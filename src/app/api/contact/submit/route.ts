import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

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

    // Save the submission to Supabase database (mapped via Prisma)
    const newSubmission = await prisma.contactSubmission.create({
      data: {
        fullName,
        email: emailNormalized,
        phone: phone || null,
        subject,
        message,
        verifiedEmail: false,
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
