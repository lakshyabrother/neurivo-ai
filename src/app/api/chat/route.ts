import { convertToCoreMessages, streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const maxDuration = 60;

// Simple in-memory rate limiter (per user)
const rateLimitMap = new Map<string, { count: number, resetTime: number }>();


export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const userId = session.user.id;

    const { id: chatId, messages, providerId, modelId, systemPrompt, mode, projectId, preview } = await req.json();

    if (!providerId || !modelId) {
      return new NextResponse("Missing provider or model", { status: 400 });
    }

    // Rate Limiting Check
    const rateLimit = parseInt(process.env.CHAT_RATE_LIMIT || "5");
    const rateWindow = parseInt(process.env.CHAT_RATE_WINDOW_SECONDS || "60");
    const now = Date.now();
    
    let userLimit = rateLimitMap.get(userId);
    if (!userLimit || now > userLimit.resetTime) {
      userLimit = { count: 1, resetTime: now + (rateWindow * 1000) };
    } else {
      userLimit.count += 1;
    }
    rateLimitMap.set(userId, userLimit);

    if (userLimit.count > rateLimit) {
      return new NextResponse("You're sending requests too quickly. Please wait a moment.", { status: 429 });
    }

    // Daily Usage Check
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const messageCount = await prisma.message.count({
      where: {
        conversation: { userId },
        role: "user",
        createdAt: { gte: today },
      },
    });

    const dailyLimit = parseInt(process.env.FREE_DAILY_MESSAGES || "30");
    if (messageCount >= dailyLimit) {
      return new NextResponse("You've reached your daily free message limit. Please try again after your limit resets.", { status: 429 });
    }

    // Message Length Validation
    const lastMessage = messages[messages.length - 1];
    const maxLength = parseInt(process.env.FREE_MAX_MESSAGE_LENGTH || "8000");
    if (lastMessage?.content?.length > maxLength) {
      return new NextResponse(`Message exceeds maximum length of ${maxLength} characters.`, { status: 400 });
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
      // Fallback to environment variables if no DB credential exists
      if (providerId === "experiential") {
        apiKey = process.env.EXPLABS_API_KEY || "";
        baseUrl = process.env.EXPLABS_BASE_URL || "https://api.experientiallabs.ai/v1";
      } else if (providerId === "openai" && process.env.OPENAI_API_KEY) {
        apiKey = process.env.OPENAI_API_KEY || "";
      } else if (providerId === "anthropic" && process.env.ANTHROPIC_API_KEY) {
        apiKey = process.env.ANTHROPIC_API_KEY || "";
      } else if (providerId === "gemini" && process.env.GEMINI_API_KEY) {
        apiKey = process.env.GEMINI_API_KEY || "";
      }
    }

    if (!apiKey) {
      return new NextResponse(
        `Please configure your ${providerId} API key in Settings or your .env.local file.`,
        { status: 403 }
      );
    }

    let aiModel;

    if (providerId === "openai") {
      const openai = createOpenAI({ apiKey });
      aiModel = openai(modelId);
    } else if (providerId === "experiential") {
      const experiential = createOpenAI({ apiKey, baseURL: baseUrl || "https://api.experientiallabs.ai/v1" });
      aiModel = experiential(modelId);
    } else if (providerId === "anthropic") {
      const anthropic = createAnthropic({ apiKey });
      aiModel = anthropic(modelId);
    } else if (providerId === "gemini") {
      const google = createGoogleGenerativeAI({ apiKey });
      aiModel = google(modelId);
    } else if (providerId === "custom") {
      if (!baseUrl) return new NextResponse("Missing base URL for custom provider", { status: 400 });
      const customOpenAI = createOpenAI({ apiKey, baseURL: baseUrl });
      aiModel = customOpenAI(modelId);
    } else {
      return new NextResponse("Unsupported provider", { status: 400 });
    }

    if (!preview) {
      // Ensure conversation exists
      let conversation = await prisma.conversation.findUnique({ where: { id: chatId } });
      if (!conversation) {
        // Create new conversation with an initial title based on the first message
        conversation = await prisma.conversation.create({
          data: {
            id: chatId,
            userId,
            projectId: projectId || null,
            title: lastMessage.content.substring(0, 50) + "...",
            provider: providerId,
            model: modelId,
            mode: mode || "CHAT",
          },
        });
      }

      // Save the user's incoming message securely using upsert to avoid duplicates on regenerate
      if (lastMessage.id) {
        await prisma.message.upsert({
          where: { id: lastMessage.id },
          update: { content: lastMessage.content },
          create: {
            id: lastMessage.id,
            conversationId: chatId,
            role: "user",
            content: lastMessage.content,
          },
        });
      } else {
        await prisma.message.create({
          data: {
            conversationId: chatId,
            role: "user",
            content: lastMessage.content,
          },
        });
      }
    }

    const result = await streamText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: aiModel as any,
      system: systemPrompt || undefined,
      messages: convertToCoreMessages(messages),
      onFinish: async ({ text, usage }) => {
        if (!preview) {
          // Save the AI's response when streaming finishes
          await prisma.message.create({
            data: {
              conversationId: chatId,
              role: "assistant",
              content: text,
              model: modelId,
            },
          });

          // Save usage tracking
          await prisma.usageRecord.create({
            data: {
              userId,
              provider: providerId,
              model: modelId,
              tokensIn: usage?.promptTokens || 0,
              tokensOut: usage?.completionTokens || 0,
            }
          });
        }
      },
    });

    return result.toAIStreamResponse();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("CHAT_ERROR", error);
    
    // Clean error handling for frontend display without exposing secrets
    let errorMessage = "An error occurred during generation.";
    let statusCode = 500;

    if (error?.statusCode === 401 || error?.message?.includes("401") || error?.message?.includes("API key not valid")) {
      errorMessage = "Invalid API key provided. Please check your configuration.";
      statusCode = 401;
    } else if (error?.statusCode === 429 || error?.message?.includes("429") || error?.message?.includes("Rate limit")) {
      errorMessage = "Rate limit exceeded or quota exhausted. Please try again later or check your billing.";
      statusCode = 429;
    } else if (error?.message?.includes("Timeout") || error?.message?.includes("fetch failed")) {
      errorMessage = "Network timeout communicating with the AI provider. Please try again.";
      statusCode = 504;
    } else if (error?.message?.includes("context length") || error?.message?.includes("token limit")) {
      errorMessage = "Conversation context limit reached. Please start a new chat or clear history.";
      statusCode = 400;
    } else if (error?.message) {
      // Return a safe subset of the error message for debugging purposes
      errorMessage = `Provider error: ${error.message.split('\n')[0]}`;
    }

    return new NextResponse(errorMessage, { status: statusCode });
  }
}
