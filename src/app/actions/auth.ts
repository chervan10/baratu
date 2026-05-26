"use server";

import prisma from "@/lib/prisma";
import { setSession, clearSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password || !name) {
    redirect("/register?error=Todos os campos são obrigatórios.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    redirect("/register?error=Este e-mail já está em uso.");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
    },
  });

  await setSession(user.id);
  redirect("/?success=profile_created");
}

export async function loginUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/login?error=Todos os campos são obrigatórios.");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    redirect("/login?error=account_not_found");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    redirect("/login?error=E-mail ou senha incorretos.");
  }

  await setSession(user.id);
  const redirectTo = (formData.get("redirectTo") as string) || "/perfil";
  redirect(redirectTo);
}

export async function logoutUser() {
  await clearSession();
  redirect("/");
}
