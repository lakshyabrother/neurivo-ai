"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getConversations() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      pinned: true,
      mode: true,
    },
  });

  return conversations;
}

export async function getConversation(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!conversation || conversation.userId !== session.user.id) {
    return null;
  }

  return conversation;
}

export async function deleteConversation(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id },
  });

  if (!conversation || conversation.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  await prisma.conversation.delete({
    where: { id },
  });

  revalidatePath("/");
  return { success: true };
}

export async function togglePinConversation(id: string, pinned: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await prisma.conversation.update({
    where: { id, userId: session.user.id },
    data: { pinned },
  });

  revalidatePath("/");
  return { success: true };
}

export async function updateConversationTitle(id: string, title: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await prisma.conversation.update({
    where: { id, userId: session.user.id },
    data: { title },
  });

  revalidatePath("/");
  return { success: true };
}
