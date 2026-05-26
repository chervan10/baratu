"use server";

import prisma from "@/lib/prisma";
import { getUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

interface RouteItem {
  id: number;
  nome: string;
  imagem: string;
  mercado: string;
  cidade: string;
  valor: number;
  categoria: string;
}

export async function saveUserRoute(items: RouteItem[]) {
  const user = await getUser();
  if (!user) {
    return { error: "Usuário não autenticado." };
  }

  try {
    // Delete previous list
    await prisma.savedItem.deleteMany({
      where: { userId: user.id }
    });

    // Save new list
    if (items.length > 0) {
      await prisma.savedItem.createMany({
        data: items.map(item => ({
          userId: user.id,
          productId: item.id,
          nome: item.nome,
          imagem: item.imagem,
          mercado: item.mercado,
          cidade: item.cidade,
          valor: item.valor,
          categoria: item.categoria
        }))
      });
    }

    revalidatePath("/perfil");
    return { success: true };
  } catch (error) {
    return { error: "Erro ao salvar a lista." };
  }
}

export async function getUserRoute() {
  const user = await getUser();
  if (!user) return [];

  const items = await prisma.savedItem.findMany({
    where: { userId: user.id }
  });

  return items.map((item: any) => ({
    id: item.productId,
    nome: item.nome,
    imagem: item.imagem,
    mercado: item.mercado,
    cidade: item.cidade,
    valor: item.valor,
    categoria: item.categoria
  }));
}
