import { getVaultFiles } from "@/app/actions/vault";
import { getProjects } from "@/app/actions/projects";
import VaultClient from "@/components/vault-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Knowledge Vault - NEXORA",
};

export default async function VaultPage() {
  const files = await getVaultFiles();
  const projects = await getProjects();

  return (
    <VaultClient initialFiles={files} projects={projects} />
  );
}
