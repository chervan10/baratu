import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username")?.toLowerCase().trim();

    if (!username) {
      return NextResponse.json({ available: false, error: "Nome de utilizador é obrigatório" });
    }

    if (username.length < 3) {
      return NextResponse.json({ available: false, error: "O nome de utilizador deve ter pelo menos 3 caracteres" });
    }

    if (!/^[a-zA-Z0-9_\-]+$/.test(username)) {
      return NextResponse.json({ available: false, error: "Apenas letras, números, sublinhados (_) e hífenes (-) são permitidos" });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    return NextResponse.json({ available: !existingUser });
  } catch (error: any) {
    console.error("Error checking username availability:", error);
    return NextResponse.json({ available: false, error: "Erro de servidor ao validar nome de utilizador" }, { status: 500 });
  }
}
