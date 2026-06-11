import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

const secretKey = process.env.JWT_SECRET || "fallback_secret_for_development";
const key = new TextEncoder().encode(secretKey);

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate JWT session from cookie
    const sessionCookie = req.cookies.get("admin_session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Sessão expirada. Inicie sessão como administrador." }, { status: 401 });
    }

    try {
      await jwtVerify(sessionCookie, key);
    } catch (err) {
      return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
    }

    // 2. Extract query filters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const country = searchParams.get("country") || "";
    const browser = searchParams.get("browser") || "";
    const dateStr = searchParams.get("date") || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { deviceName: { contains: search } },
        { browser: { contains: search } },
        { operatingSystem: { contains: search } },
        { country: { contains: search } },
        { city: { contains: search } },
        { visitorId: { contains: search } }
      ];
    }

    if (country) {
      where.country = country;
    }

    if (browser) {
      where.browser = browser;
    }

    if (dateStr) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        where.createdAt = {
          gte: date,
        };
      }
    }

    // 3. Query records from Supabase via Prisma
    const visitors = await prisma.visitorAnalytics.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      visitors
    });

  } catch (error: any) {
    console.error("Error in admin analytics GET API:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor.", details: error.message },
      { status: 500 }
    );
  }
}
