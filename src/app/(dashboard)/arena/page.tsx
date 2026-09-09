import { getProviderCredentials } from "@/app/actions/providers";
import ArenaClient from "@/components/arena-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Model Arena - NEXORA",
};

export default async function ArenaPage({
  searchParams,
}: {
  searchParams: { prompt?: string };
}) {
  const credentials = await getProviderCredentials();
  
  const configuredProviders = credentials
    .filter(c => c.enabled)
    .map(c => c.provider);

  return (
    <ArenaClient 
      configuredProviders={configuredProviders} 
      initialPrompt={searchParams.prompt}
    />
  );
}
