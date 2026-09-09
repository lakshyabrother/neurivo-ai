import ChatClient from "@/components/chat-client";
import { getProviderCredentials } from "@/app/actions/providers";
import { getConversation } from "@/app/actions/conversations";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat - AI Platform",
};

export default async function ConversationPage({
  params,
}: {
  params: { id: string };
}) {
  const conversation = await getConversation(params.id);

  if (!conversation) {
    redirect("/");
  }

  const credentials = await getProviderCredentials();
  
  const configuredProviders = credentials
    .filter(c => c.enabled)
    .map(c => c.provider);

  const initialMessages = conversation.messages.map(msg => ({
    id: msg.id,
    role: msg.role as "user" | "assistant" | "system",
    content: msg.content,
  }));

  return (
    <ChatClient 
      configuredProviders={configuredProviders} 
      id={conversation.id}
      initialMessages={initialMessages}
    />
  );
}
