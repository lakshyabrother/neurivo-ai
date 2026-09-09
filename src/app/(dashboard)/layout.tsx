import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/sidebar";
import { getConversations } from "@/app/actions/conversations";
import { ThemeProvider } from "@/components/theme-provider";

export const maxDuration = 60;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const conversations = await getConversations();
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Sidebar user={session?.user as any} conversations={conversations} />
        <main className="flex-1 overflow-hidden relative flex flex-col">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
