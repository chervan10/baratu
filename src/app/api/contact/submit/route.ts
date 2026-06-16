import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { cookies } from "next/headers";
import { decrypt } from "@/lib/auth";

const contactSchema = z.object({
  fullName: z.string().min(2, "O nome deve ter pelo menos 2 caracteres."),
  email: z.string().email("Endereço de e-mail inválido."),
  phone: z.string().optional().nullable(),
  subject: z.string().min(3, "O assunto deve ter pelo menos 3 caracteres."),
  message: z.string().min(10, "A mensagem deve ter pelo menos 10 caracteres."),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Parse and validate input data using Zod
    const result = contactSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: result.error.issues },
        { status: 400 }
      );
    }
    
    const { fullName, email, phone, subject, message } = result.data;
    const emailNormalized = email.toLowerCase().trim();

    // 1. Double check that this email has been verified via OTP recently (within last 15 minutes)
    const cookieStore = await cookies();
    const verifiedToken = cookieStore.get("contact_email_verified")?.value;

    let isEmailVerified = false;

    if (verifiedToken) {
      try {
        const payload = await decrypt(verifiedToken);
        if (payload && payload.email === emailNormalized && (Date.now() - payload.verifiedAt) < 15 * 60 * 1000) {
          isEmailVerified = true;
        }
      } catch (decryptErr) {
        console.warn("Failed to decrypt verified email token:", decryptErr);
      }
    }

    if (!isEmailVerified) {
      // Fallback to database check
      try {
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const verifiedOtpRecord = await prisma.emailOtp.findFirst({
          where: {
            email: emailNormalized,
            verified: true,
            createdAt: {
              gte: fifteenMinutesAgo
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        });
        if (verifiedOtpRecord) {
          isEmailVerified = true;
        }
      } catch (dbErr) {
        console.error("Database check failed for submission verification:", dbErr);
      }
    }

    if (!isEmailVerified) {
      return NextResponse.json(
        { error: "E-mail não verificado. Por favor, verifique o seu endereço de e-mail antes de enviar o formulário." },
        { status: 403 }
      );
    }

    // Success verification: clear the verification cookie
    try {
      cookieStore.set("contact_email_verified", "", { expires: new Date(0), path: "/" });
    } catch (clearErr) {
      console.warn("Failed to clear contact_email_verified cookie:", clearErr);
    }

    // 2. Save the submission to Supabase database (mapped via Prisma)
    const newSubmission = await prisma.contactSubmission.create({
      data: {
        fullName,
        email: emailNormalized,
        phone: phone || null,
        subject,
        message,
        verifiedEmail: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Obrigado! A sua mensagem foi recebida com sucesso.",
      submission: {
        id: newSubmission.id,
        createdAt: newSubmission.createdAt
      }
    });

  } catch (error: any) {
    console.error("Error in contact form submission API:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor.", details: error.message },
      { status: 500 }
    );
  }
}
