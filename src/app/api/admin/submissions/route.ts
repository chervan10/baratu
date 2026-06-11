import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user session
    const user = await getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Não autorizado. Inicie sessão para continuar." },
        { status: 401 }
      );
    }

    // 2. Authorize admin check
    const adminEmailsEnv = process.env.ADMIN_EMAILS || "";
    const adminEmails = adminEmailsEnv
      .split(",")
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    // Fallback: If no ADMIN_EMAILS are defined in env, default to the user's primary email address
    const isUserAdmin = adminEmails.length > 0 
      ? adminEmails.includes(user.email.toLowerCase())
      : user.email.toLowerCase() === "chervan.cachaco@gmail.com";

    if (!isUserAdmin) {
      return NextResponse.json(
        { error: "Acesso negado. Apenas administradores têm acesso a estes dados." },
        { status: 403 }
      );
    }

    // 3. Extract query parameters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const dateStr = searchParams.get("date") || "";

    // 4. Construct query filters
    const where: any = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { subject: { contains: search } },
        { message: { contains: search } },
      ];
    }

    if (dateStr) {
      const date = new Date(dateStr);
      // Ensure date is valid before applying filter
      if (!isNaN(date.getTime())) {
        where.createdAt = {
          gte: date,
        };
      }
    }

    // 5. Fetch filtered contact submissions from DB
    const submissions = await prisma.contactSubmission.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      submissions,
    });

  } catch (error: any) {
    console.error("Error in admin submissions API:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor.", details: error.message },
      { status: 500 }
    );
  }
}
