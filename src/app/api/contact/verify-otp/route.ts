import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

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

    // 1. Fetch the latest active (unverified) OTP record for this email
    const latestOtp = await prisma.emailOtp.findFirst({
      where: {
        email: emailNormalized,
        verified: false,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!latestOtp) {
      return NextResponse.json(
        { error: "Nenhum código OTP ativo encontrado para este e-mail." },
        { status: 404 }
      );
    }

    // 2. Check if attempts limit is already exceeded (max 3 verification attempts)
    if (latestOtp.attempts >= 3) {
      return NextResponse.json(
        { error: "Excedeu o limite de tentativas. Solicite um novo código." },
        { status: 400 }
      );
    }

    // 3. Check if the code has expired (after 10 minutes)
    if (new Date() > new Date(latestOtp.expiresAt)) {
      return NextResponse.json(
        { error: "O código OTP expirou. Por favor, solicite um novo." },
        { status: 400 }
      );
    }

    // 4. Secure comparison of the entered code with the hashed OTP
    const isMatch = await bcrypt.compare(otpClean, latestOtp.otpCode);

    if (!isMatch) {
      const updatedAttempts = latestOtp.attempts + 1;
      
      // Update attempts in DB
      await prisma.emailOtp.update({
        where: { id: latestOtp.id },
        data: { attempts: updatedAttempts },
      });

      const remaining = 3 - updatedAttempts;

      return NextResponse.json(
        { 
          error: remaining > 0 
            ? `Código incorreto. Restam ${remaining} ${remaining === 1 ? 'tentativa' : 'tentativas'}.`
            : "Excedeu o limite de tentativas. Por favor, solicite um novo código."
        },
        { status: 400 }
      );
    }

    // 5. Success: Mark OTP as verified (prevents future reuse)
    await prisma.emailOtp.update({
      where: { id: latestOtp.id },
      data: { verified: true },
    });

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
