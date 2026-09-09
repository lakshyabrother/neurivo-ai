import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ status: "Unauthorized" }), { status: 401 });
    }
    const userId = session.user.id;

    const { providerId, modelId } = await req.json();

    if (!providerId || !modelId) {
      return new NextResponse(JSON.stringify({ status: "Missing provider or model" }), { status: 400 });
    }

    let apiKey = "";
    let baseUrl = undefined;

    const credential = await prisma.providerCredential.findUnique({
      where: {
        userId_provider: { userId, provider: providerId },
      },
    });

    if (credential && credential.enabled) {
      apiKey = decrypt(credential.encryptedCredential) || "";
      baseUrl = credential.baseUrl || undefined;
    } else {
      // Fallback to environment variables
      if (providerId === "openai" && process.env.OPENAI_API_KEY) {
        apiKey = process.env.OPENAI_API_KEY || "";
      } else if (providerId === "anthropic" && process.env.ANTHROPIC_API_KEY) {
        apiKey = process.env.ANTHROPIC_API_KEY || "";
      } else if (providerId === "gemini" && process.env.GEMINI_API_KEY) {
        apiKey = process.env.GEMINI_API_KEY || "";
      }
    }

    if (!apiKey) {
      return new NextResponse(JSON.stringify({ status: "Invalid API key" }), { status: 403 });
    }

    let aiModel;

    if (providerId === "openai") {
      const openai = createOpenAI({ apiKey });
      aiModel = openai(modelId);
    } else if (providerId === "anthropic") {
      const anthropic = createAnthropic({ apiKey });
      aiModel = anthropic(modelId);
    } else if (providerId === "gemini") {
      const google = createGoogleGenerativeAI({ apiKey });
      aiModel = google(modelId);
    } else if (providerId === "custom") {
      if (!baseUrl) return new NextResponse(JSON.stringify({ status: "Missing base URL for custom provider" }), { status: 400 });
      const customOpenAI = createOpenAI({ apiKey, baseURL: baseUrl });
      aiModel = customOpenAI(modelId);
    } else {
      return new NextResponse(JSON.stringify({ status: "Unsupported provider" }), { status: 400 });
    }

    // Perform a lightweight test request
    try {
      await generateText({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        model: aiModel as any,
        prompt: "Hello",
        maxTokens: 1,
      });
      return new NextResponse(JSON.stringify({ status: "Connected" }), { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("CONNECTION_TEST_ERROR", error);
      
      let errorMessage = "Provider unavailable";
      
      if (error?.statusCode === 401 || error?.message?.includes("401") || error?.message?.includes("API key not valid")) {
        errorMessage = "Invalid API key";
      } else if (error?.statusCode === 429 || error?.message?.includes("429") || error?.message?.includes("Rate limit") || error?.message?.includes("quota")) {
        errorMessage = "Rate limited";
      }

      return new NextResponse(JSON.stringify({ status: errorMessage }), { status: 200 }); // Returning 200 so frontend can parse the status easily
    }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return new NextResponse(JSON.stringify({ status: "Provider unavailable" }), { status: 500 });
  }
}
