import ChatClient from "@/components/chat-client";
import { getProviderCredentials } from "@/app/actions/providers";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat - NEXORA",
};

export default async function ChatPage({
  searchParams,
}: {
  searchParams: { mode?: string, projectId?: string };
}) {
  const credentials = await getProviderCredentials();
  
  const configuredProviders = credentials
    .filter(c => c.enabled)
    .map(c => c.provider);

  return (
    <ChatClient 
      configuredProviders={configuredProviders} 
      initialMode={searchParams.mode}
      projectId={searchParams.projectId}
    />
  );
}
