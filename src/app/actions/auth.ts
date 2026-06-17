"use server";

import prisma from "@/lib/prisma";
import { setSession, clearSession, encrypt } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/?success=profile_created";

  if (!email || !password || !name || !username) {
    redirect(`/register?error=Todos os campos são obrigatórios.&redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  const emailNormalized = email.toLowerCase().trim();
  const usernameNormalized = username.toLowerCase().trim();

  if (usernameNormalized.length < 3) {
    redirect(`/register?error=O nome de utilizador deve ter pelo menos 3 caracteres.&redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  if (!/^[a-zA-Z0-9_\-]+$/.test(usernameNormalized)) {
    redirect(`/register?error=O nome de utilizador apenas pode conter letras, números, sublinhados e hífenes.&redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  let existingUserByEmail;
  let existingUserByUsername;
  try {
    existingUserByEmail = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });
    existingUserByUsername = await prisma.user.findUnique({
      where: { username: usernameNormalized },
    });
  } catch (dbError) {
    console.error("Database error during registration:", dbError);
    redirect(`/register?error=Erro de ligação à base de dados. Tente mais tarde.&redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  if (existingUserByEmail) {
    redirect(`/register?error=Este e-mail já está em uso.&redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  if (existingUserByUsername) {
    redirect(`/register?error=Este nome de utilizador já está em uso.&redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 10);
  } catch (err) {
    console.error("Error hashing password:", err);
    redirect(`/register?error=Erro ao processar palavra-passe.&redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  let user;
  try {
    user = await prisma.user.create({
      data: {
        name,
        email: emailNormalized,
        username: usernameNormalized,
        password: hashedPassword,
      },
    });
  } catch (dbError) {
    console.error("Database error during user creation:", dbError);
    redirect(`/register?error=Erro ao criar conta na base de dados.&redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  try {
    await setSession(user.id);
  } catch (err) {
    console.error("Error setting session during registration:", err);
    redirect(`/register?error=Erro ao iniciar sessão após registo.&redirectTo=${encodeURIComponent(redirectTo)}`);
  }
  redirect(redirectTo);
}

export async function loginUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/login?error=Todos os campos são obrigatórios.");
  }

  const valNormalized = email.toLowerCase().trim();

  // Check if this is the admin login!
  if (valNormalized === "admin@gmail.com") {
    if (password === "th@nkmelater") {
      try {
        const adminSessionToken = await encrypt({ role: "admin", email: valNormalized });
        (await cookies()).set("admin_session", adminSessionToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        });
      } catch (err) {
        console.error("Error setting admin session:", err);
        redirect("/login?error=Erro ao iniciar sessão administrativa.");
      }
      redirect("/admin");
    } else {
      redirect("/login?error=Senha incorreta para o administrador.");
    }
  }

  let user;
  try {
    user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: valNormalized },
          { username: valNormalized }
        ]
      },
    });
  } catch (dbError) {
    console.error("Database error during login:", dbError);
    redirect("/login?error=Erro de ligação à base de dados. Tente novamente mais tarde.");
  }

  if (!user) {
    redirect("/login?error=account_not_found");
  }

  let isPasswordValid = false;
  try {
    isPasswordValid = await bcrypt.compare(password, user.password);
  } catch (err) {
    console.error("Error comparing password:", err);
    redirect("/login?error=Erro ao validar palavra-passe.");
  }

  if (!isPasswordValid) {
    redirect("/login?error=E-mail ou senha incorretos.");
  }

  try {
    await setSession(user.id);
  } catch (err) {
    console.error("Error setting user session:", err);
    redirect("/login?error=Erro ao iniciar sessão.");
  }

  const redirectTo = (formData.get("redirectTo") as string) || "/perfil";
  redirect(redirectTo);
}

export async function logoutUser() {
  try {
    await clearSession();
  } catch (err) {
    console.error("Error clearing session:", err);
  }
  redirect("/");
}
