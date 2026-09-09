import { getProviderCredentials } from "@/app/actions/providers";
import ProviderSettingsClient from "@/components/provider-settings-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Keys & Models - AI Chat",
};

export default async function ProvidersPage() {
  const credentials = await getProviderCredentials();
  
  return (
    <div className="flex-1 overflow-y-auto">
      <ProviderSettingsClient initialCredentials={credentials} />
    </div>
  );
}
