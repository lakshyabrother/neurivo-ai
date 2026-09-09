import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const messageCount = await prisma.message.count({
      where: {
        conversation: { userId: session.user.id },
        role: "user",
        createdAt: { gte: today },
      },
    });

    const dailyLimit = parseInt(process.env.FREE_DAILY_MESSAGES || "30");

    return NextResponse.json({
      used: messageCount,
      limit: dailyLimit,
      remaining: Math.max(0, dailyLimit - messageCount),
    });
  } catch (error) {
    console.error("USAGE_ERROR", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
