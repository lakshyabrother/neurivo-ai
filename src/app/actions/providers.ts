"use server";

import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/encryption";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function saveProviderCredential(provider: string, credentialValue: string, baseUrl?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const encryptedCredential = encrypt(credentialValue);

  await prisma.providerCredential.upsert({
    where: {
      userId_provider: {
        userId: session.user.id,
        provider,
      },
    },
    update: {
      encryptedCredential,
      baseUrl: baseUrl || null,
      enabled: true,
      updatedAt: new Date(),
    },
    create: {
      userId: session.user.id,
      provider,
      encryptedCredential,
      baseUrl: baseUrl || null,
      enabled: true,
    },
  });

  revalidatePath("/settings/providers");
  return { success: true };
}

export async function getProviderCredentials() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const credentials = await prisma.providerCredential.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      id: true,
      provider: true,
      baseUrl: true,
      enabled: true,
      updatedAt: true,
      // We explicitly DO NOT return the encrypted credential or decrypted credential to the client
      // The client only needs to know that the credential exists.
    },
  });

  // Inject env-based fallbacks if they don't exist in the DB credentials
  const envProviders = [
    { provider: "openai", envKey: process.env.OPENAI_API_KEY },
    { provider: "anthropic", envKey: process.env.ANTHROPIC_API_KEY },
    { provider: "gemini", envKey: process.env.GEMINI_API_KEY },
  ];

  envProviders.forEach(({ provider, envKey }) => {
    if (envKey && !credentials.find(c => c.provider === provider)) {
      // Mock an enabled credential for the frontend so it knows the provider is available
      credentials.push({
        id: `env-${provider}`,
        provider,
        baseUrl: null,
        enabled: true,
        updatedAt: new Date(),
      });
    }
  });

  return credentials;
}

export async function deleteProviderCredential(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Ensure the credential belongs to the user
  const credential = await prisma.providerCredential.findUnique({
    where: { id },
  });

  if (!credential || credential.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  await prisma.providerCredential.delete({
    where: { id },
  });

  revalidatePath("/settings/providers");
  return { success: true };
}

export async function toggleProviderCredential(id: string, enabled: boolean) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const credential = await prisma.providerCredential.findUnique({
    where: { id },
  });

  if (!credential || credential.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  await prisma.providerCredential.update({
    where: { id },
    data: { enabled },
  });

  revalidatePath("/settings/providers");
  return { success: true };
}
