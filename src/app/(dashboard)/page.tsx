import { getProviderCredentials } from "@/app/actions/providers";
import { getConversations } from "@/app/actions/conversations";
import HomeDashboard from "@/components/home-dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Workspace - Neurivo",
};

export default async function DashboardPage() {
  const credentials = await getProviderCredentials();
  const conversations = await getConversations();
  
  const configuredProviders = credentials
    .filter(c => c.enabled)
    .map(c => c.provider);

  return (
    <HomeDashboard 
      configuredProviders={configuredProviders} 
      recentConversations={conversations.slice(0, 5)} 
    />
  );
}
