import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { encrypt } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Endereço de e-mail inválido." },
        { status: 400 }
      );
    }

    const emailNormalized = email.toLowerCase().trim();

    // 1. Rate Limiting Check: Max 3 OTP requests per hour per email (100 during testing)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let otpCount = 0;
    try {
      otpCount = await prisma.emailOtp.count({
        where: {
          email: emailNormalized,
          createdAt: {
            gte: oneHourAgo,
          },
        },
      });
    } catch (dbErr) {
      console.warn("Database failed to check OTP count for rate limiting, letting it proceed:", dbErr);
    }

    const isTestingPeriod = new Date() < new Date("2026-08-31T00:00:00Z");
    const limit = isTestingPeriod ? 100 : 3;

    if (otpCount >= limit) {
      return NextResponse.json(
        { error: `Limite de envios excedido. Tente novamente mais tarde (máximo de ${limit} códigos por hora).` },
        { status: 429 }
      );
    }

    // 2. Generate a random 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Hash the OTP for secure storage
    const hashedOtp = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

    // 4. Store the OTP in Supabase (SQLite/Postgres via Prisma)
    try {
      await prisma.emailOtp.create({
        data: {
          email: emailNormalized,
          otpCode: hashedOtp,
          expiresAt,
          verified: false,
          attempts: 0,
        },
      });
    } catch (dbError) {
      console.warn("Database failed to store OTP, falling back to stateful cookie:", dbError);
    }

    // 4b. Set stateless cookie with OTP state for serverless compatibility
    const token = await encrypt({
      email: emailNormalized,
      hashedOtp,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
    const cookieStore = await cookies();
    cookieStore.set("contact_otp", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 10 * 60, // 10 minutes
    });

    // 5. Send OTP Email using EmailJS REST API
    let emailSent = false;
    let emailJsError = "";

    const cleanEnvKey = (key: string | undefined) => {
      if (!key) return undefined;
      return key.replace(/^['"]|['"]$/g, "").trim();
    };

    const serviceId = cleanEnvKey(process.env.EMAILJS_SERVICE_ID);
    const templateId = cleanEnvKey(process.env.EMAILJS_TEMPLATE_ID);
    const publicKey = cleanEnvKey(process.env.EMAILJS_PUBLIC_KEY);
    const privateKey = cleanEnvKey(process.env.EMAILJS_PRIVATE_KEY); // Optional, required if enabled in EmailJS

    console.log(`[EmailJS Debug] Keys present -> Service: ${!!serviceId}, Template: ${!!templateId}, Public: ${!!publicKey}, Private: ${!!privateKey}`);
    if (privateKey) {
      console.log(`[EmailJS Debug] Private key details -> Length: ${privateKey.length}, Starts with: ${privateKey.substring(0, 3)}...`);
    }

    if (serviceId && templateId && publicKey) {
      try {
        const emailJsResponse = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            service_id: serviceId,
            template_id: templateId,
            user_id: publicKey,
            accessToken: privateKey || undefined,
            access_token: privateKey || undefined, // fallback for different casings
            template_params: {
              to_email: emailNormalized,
              otp_code: otpCode,
            },
          }),
        });

        if (emailJsResponse.ok) {
          emailSent = true;
        } else {
          const text = await emailJsResponse.text();
          console.error("EmailJS REST API error sending OTP email:", text);
          emailJsError = text;
        }
      } catch (err: any) {
        console.error("EmailJS exception sending OTP email:", err);
        emailJsError = err.message || "Unknown exception";
      }
    }

    // Log to console so it's always accessible in serverless function logs / dev logs
    console.log(`\n=========================================\n[OTP Verification] Code for ${emailNormalized} is: ${otpCode}\n(Sent via EmailJS Service: ${serviceId || "SIMULATOR"})\n=========================================\n`);

    return NextResponse.json({
      success: true,
      message: emailSent 
        ? "Código de verificação enviado para o seu e-mail." 
        : "Código de verificação gerado em modo de simulação.",
      ...((isTestingPeriod && !emailSent) ? { otp: otpCode } : {}),
      emailJsError: emailJsError || undefined
    });

  } catch (error: any) {
    console.error("Error in send-otp API:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor.", details: error.message },
      { status: 500 }
    );
  }
}
