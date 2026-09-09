"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getPrompts() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  return prisma.prompt.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
}

export async function createPrompt(title: string, content: string, category: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const prompt = await prisma.prompt.create({
    data: {
      userId: session.user.id,
      title,
      content,
      category,
    }
  });

  revalidatePath("/prompts");
  return prompt;
}

export async function deletePrompt(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await prisma.prompt.delete({
    where: { id, userId: session.user.id }
  });

  revalidatePath("/prompts");
}
