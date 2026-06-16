import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { encrypt, decrypt } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "E-mail e código OTP são obrigatórios." },
        { status: 400 }
      );
    }

    const emailNormalized = email.toLowerCase().trim();
    const otpClean = otp.trim();

    const cookieStore = await cookies();
    const token = cookieStore.get("contact_otp")?.value;

    let isVerified = false;
    let verifyError = "";

    // 1. Try Cookie-based Stateless OTP verification (serverless friendly)
    if (token) {
      try {
        const payload = await decrypt(token);
        if (payload && payload.email === emailNormalized) {
          if (Date.now() < payload.expiresAt) {
            const isMatch = await bcrypt.compare(otpClean, payload.hashedOtp);
            if (isMatch) {
              isVerified = true;
            } else {
              verifyError = "Código incorreto. Tente novamente.";
            }
          } else {
            verifyError = "O código OTP expirou. Por favor, solicite um novo.";
          }
        }
      } catch (decryptErr) {
        console.warn("Failed to decrypt OTP state cookie:", decryptErr);
      }
    }

    // 2. Fallback to Database verification (if postgres/sqlite is fully synchronized and available)
    if (!isVerified && !verifyError) {
      try {
        const latestOtp = await prisma.emailOtp.findFirst({
          where: {
            email: emailNormalized,
            verified: false,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        if (latestOtp) {
          if (latestOtp.attempts >= 3) {
            verifyError = "Excedeu o limite de tentativas. Solicite um novo código.";
          } else if (new Date() > new Date(latestOtp.expiresAt)) {
            verifyError = "O código OTP expirou. Por favor, solicite um novo.";
          } else {
            const isMatch = await bcrypt.compare(otpClean, latestOtp.otpCode);
            if (isMatch) {
              isVerified = true;
              
              // Try updating DB status, ignoring errors since cookie verification is primary
              try {
                await prisma.emailOtp.update({
                  where: { id: latestOtp.id },
                  data: { verified: true },
                });
              } catch (updateDbErr) {
                console.warn("Failed to update OTP verified status in DB:", updateDbErr);
              }
            } else {
              const updatedAttempts = latestOtp.attempts + 1;
              try {
                await prisma.emailOtp.update({
                  where: { id: latestOtp.id },
                  data: { attempts: updatedAttempts },
                });
              } catch (updateDbErr) {
                console.warn("Failed to update OTP attempts status in DB:", updateDbErr);
              }
              const remaining = 3 - updatedAttempts;
              verifyError = remaining > 0
                ? `Código incorreto. Restam ${remaining} ${remaining === 1 ? 'tentativa' : 'tentativas'}.`
                : "Excedeu o limite de tentativas. Por favor, solicite um novo código.";
            }
          }
        } else {
          verifyError = "Nenhum código OTP ativo encontrado para este e-mail.";
        }
      } catch (dbErr: any) {
        console.error("Database verify fallback failed:", dbErr);
        verifyError = verifyError || `Erro de base de dados: ${dbErr.message}`;
      }
    }

    if (!isVerified) {
      return NextResponse.json(
        { error: verifyError || "Código incorreto. Tente novamente." },
        { status: 400 }
      );
    }

    // 3. Success: Set a signed 'contact_email_verified' token cookie (expires in 15 minutes)
    const verifiedToken = await encrypt({
      email: emailNormalized,
      verifiedAt: Date.now(),
    });
    
    cookieStore.set("contact_email_verified", verifiedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 15 * 60, // 15 minutes
    });

    // Clear the active OTP cookie
    cookieStore.set("contact_otp", "", { expires: new Date(0), path: "/" });

    return NextResponse.json({
      success: true,
      message: "E-mail verificado com sucesso!"
    });

  } catch (error: any) {
    console.error("Error in verify-otp API:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor.", details: error.message },
      { status: 500 }
    );
  }
}
