"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getProjects() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  return prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { conversations: true, files: true }
      }
    }
  });
}

export async function getProject(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  return prisma.project.findUnique({
    where: { id, userId: session.user.id },
    include: {
      conversations: {
        orderBy: { updatedAt: "desc" }
      },
      files: {
        orderBy: { createdAt: "desc" }
      }
    }
  });
}

export async function createProject(name: string, color: string = "#10b981") {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const project = await prisma.project.create({
    data: {
      name,
      color,
      userId: session.user.id,
    }
  });

  revalidatePath("/projects");
  return project;
}

export async function deleteProject(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  await prisma.project.delete({
    where: { id, userId: session.user.id }
  });

  revalidatePath("/projects");
}
