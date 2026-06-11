import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { encrypt } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    // Retrieve client IP for lockout tracking
    const rawIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const ipAddress = rawIp.split(",")[0].trim();

    // 1. Lockout Check: verify if the IP is currently locked out
    const lockoutRecord = await prisma.adminLockout.findUnique({
      where: { ipAddress },
    });

    if (lockoutRecord && lockoutRecord.lockedUntil && new Date() < new Date(lockoutRecord.lockedUntil)) {
      const remainingTime = Math.ceil(
        (new Date(lockoutRecord.lockedUntil).getTime() - Date.now()) / (1000 * 60)
      );
      return NextResponse.json(
        { 
          error: `Acesso bloqueado por tentativas falhadas. Tente novamente em ${remainingTime} ${
            remainingTime === 1 ? "minuto" : "minutos"
          }.` 
        },
        { status: 429 }
      );
    }

    const emailNormalized = email.toLowerCase().trim();

    // 2. Validate authorized administrator credentials
    if (emailNormalized === "admin@gmail.com" && password === "th@nkmelater") {
      // Success: Reset IP attempts in DB
      if (lockoutRecord) {
        await prisma.adminLockout.update({
          where: { ipAddress },
          data: { failedAttempts: 0, lockedUntil: null },
        });
      }

      // Generate encrypted JWT session
      const adminSessionToken = await encrypt({ role: "admin", email: emailNormalized });

      const response = NextResponse.json({
        success: true,
        message: "Autenticação de administrador concedida!"
      });

      // Set cookie securely
      response.cookies.set("admin_session", adminSessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
      });

      return response;
    } else {
      // Failure: Increment attempt and check for lockout (max 5 attempts)
      const currentAttempts = lockoutRecord ? lockoutRecord.failedAttempts + 1 : 1;
      let lockedUntil: Date | null = null;

      if (currentAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
      }

      await prisma.adminLockout.upsert({
        where: { ipAddress },
        update: {
          failedAttempts: currentAttempts,
          lockedUntil,
        },
        create: {
          ipAddress,
          failedAttempts: currentAttempts,
          lockedUntil,
        },
      });

      const remaining = 5 - currentAttempts;

      return NextResponse.json(
        { 
          error: lockedUntil 
            ? "O seu acesso foi temporariamente bloqueado por 15 minutos após 5 tentativas incorretas."
            : `Credenciais inválidas. Restam ${remaining} ${remaining === 1 ? "tentativa" : "tentativas"}.`
        },
        { status: 401 }
      );
    }

  } catch (error: any) {
    console.error("Error in admin login endpoint:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor.", details: error.message },
      { status: 500 }
    );
  }
}
