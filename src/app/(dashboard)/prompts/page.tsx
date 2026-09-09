import { getPrompts } from "@/app/actions/prompts";
import PromptsClient from "@/components/prompts-client";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prompt Lab - NEXORA",
};

export default async function PromptsPage() {
  const prompts = await getPrompts();

  return (
    <PromptsClient initialPrompts={prompts} />
  );
}
