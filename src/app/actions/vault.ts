"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getVaultFiles() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  return prisma.projectFile.findMany({
    where: { 
      project: {
        userId: session.user.id
      }
    },
    include: {
      project: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function uploadVaultFile(projectId: string, name: string, type: string, size: number, content: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify project belongs to user
  const project = await prisma.project.findUnique({
    where: { id: projectId, userId: session.user.id }
  });

  if (!project) throw new Error("Project not found");

  const file = await prisma.projectFile.create({
    data: {
      projectId,
      name,
      type,
      size,
      status: "READY",
      content, // In local mode, we just store the raw extracted text directly
    }
  });

  revalidatePath("/vault");
  revalidatePath(`/projects/${projectId}`);
  return file;
}

export async function deleteVaultFile(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const file = await prisma.projectFile.findUnique({
    where: { id },
    include: { project: true }
  });

  if (!file || file.project.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  await prisma.projectFile.delete({
    where: { id }
  });

  revalidatePath("/vault");
  revalidatePath(`/projects/${file.projectId}`);
}
