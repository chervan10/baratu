import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";
import bcrypt from "bcryptjs";

// Initialize Resend with API Key from environment
const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

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

    // 1. Rate Limiting Check: Max 3 OTP requests per hour per email
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const otpCount = await prisma.emailOtp.count({
      where: {
        email: emailNormalized,
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (otpCount >= 3) {
      return NextResponse.json(
        { error: "Limite de envios excedido. Tente novamente mais tarde (máximo de 3 códigos por hora)." },
        { status: 429 }
      );
    }

    // 2. Generate a random 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Hash the OTP for secure storage
    const hashedOtp = await bcrypt.hash(otpCode, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Expires in 10 minutes

    // 4. Store the OTP in Supabase (SQLite/Postgres via Prisma)
    await prisma.emailOtp.create({
      data: {
        email: emailNormalized,
        otpCode: hashedOtp,
        expiresAt,
        verified: false,
        attempts: 0,
      },
    });

    // 5. Send OTP Email using Resend
    const fromEmail = process.env.EMAIL_FROM || "onboarding@resend.dev";
    const emailBody = `Hello,

Your verification code is:

${otpCode}

This code expires in 10 minutes.

If you did not request this code, please ignore this email.`;

    let emailSent = false;
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "re_mock_key") {
      try {
        await resend.emails.send({
          from: fromEmail,
          to: emailNormalized,
          subject: "Your Verification Code",
          text: emailBody,
        });
        emailSent = true;
      } catch (err: any) {
        console.error("Resend API error sending email:", err);
      }
    }

    // Log to console in development so the developer can see it easily
    console.log(`\n=========================================\n[OTP Verification] Code for ${emailNormalized} is: ${otpCode}\n=========================================\n`);

    return NextResponse.json({
      success: true,
      message: emailSent 
        ? "Código de verificação enviado para o seu e-mail." 
        : "Código de verificação gerado com sucesso (verifique a consola do servidor)."
    });

  } catch (error: any) {
    console.error("Error in send-otp API:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor.", details: error.message },
      { status: 500 }
    );
  }
}
