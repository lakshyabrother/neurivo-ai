"use client";

import Link from "next/link";
import { MessageSquarePlus, FileText, PenTool, Code, Search, GitCompare, ArrowRight, Zap, CheckCircle2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

const QUICK_ACTIONS = [
  { id: "chat", title: "Start Conversation", icon: MessageSquarePlus, description: "General purpose AI chat", color: "text-blue-500", bg: "bg-blue-500/10" },
  { id: "analyze", title: "Analyze Document", icon: FileText, description: "Extract insights from PDFs/Docs", color: "text-purple-500", bg: "bg-purple-500/10" },
  { id: "write", title: "Write Something", icon: PenTool, description: "Draft essays, emails, or blogs", color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "code", title: "Code With AI", icon: Code, description: "Build software and debug", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "research", title: "Research Topic", icon: Search, description: "Deep dive into complex topics", color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { id: "compare", title: "Compare Models", icon: GitCompare, description: "Test prompts in Model Arena", color: "text-pink-500", bg: "bg-pink-500/10" },
];

const PROVIDER_INFO: Record<string, { name: string, models: string[] }> = {
  openai: { name: "OpenAI", models: ["GPT-4o", "GPT-4 Turbo", "GPT-3.5"] },
  anthropic: { name: "Anthropic", models: ["Claude 3.5 Sonnet", "Claude 3 Opus", "Claude 3 Haiku"] },
  gemini: { name: "Google", models: ["Gemini 1.5 Pro", "Gemini 1.5 Flash"] },
  custom: { name: "Custom", models: ["Custom Endpoints"] },
};

export default function HomeDashboard({ 
  configuredProviders, 
  recentConversations 
}: { 
  configuredProviders: string[],
  recentConversations: { id: string; title: string; updatedAt: Date; mode: string }[]
}) {
  const router = useRouter();

  const handleActionClick = (actionId: string) => {
    // For now, most actions route to a new chat with a specific mode query param
    // Compare routes to the Arena
    if (actionId === "compare") {
      router.push("/arena");
    } else {
      router.push(`/chat?mode=${actionId}`);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10 lg:p-12">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header Section */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground font-sans">
            Neurivo
          </h1>
          <p className="text-xl text-muted-foreground font-medium">
            Your intelligent workspace. What are we building today?
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action.id)}
                  className="group flex flex-col items-start p-5 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all text-left relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </div>
                  <div className={`p-3 rounded-xl ${action.bg} ${action.color} mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">{action.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{action.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase mb-4 flex items-center gap-2">
              Continue where you left off
            </h2>
            {recentConversations.length === 0 ? (
              <div className="border border-dashed border-border rounded-2xl p-8 text-center bg-card/50">
                <p className="text-muted-foreground">No recent projects or conversations.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentConversations.map((conv) => (
                  <Link 
                    href={`/c/${conv.id}`} 
                    key={conv.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                        <MessageSquarePlus className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <h4 className="font-medium text-foreground truncate">{conv.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(conv.updatedAt).toLocaleDateString()} • {conv.mode || 'CHAT'}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* AI Stack */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Your AI Stack
            </h2>
            <div className="border border-border rounded-2xl bg-card p-5 space-y-5">
              {configuredProviders.length === 0 ? (
                <div className="text-center py-4">
                  <ShieldAlert className="w-8 h-8 text-warning mx-auto mb-2" />
                  <p className="text-sm text-foreground font-medium">No Providers Connected</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">You need to connect an API key to start using Neurivo.</p>
                  <Link 
                    href="/settings/providers" 
                    className="inline-block text-xs font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Connect Provider
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {configuredProviders.map((providerId) => (
                    <div key={providerId} className="flex flex-col gap-2 border-b border-border/50 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-success" />
                          {PROVIDER_INFO[providerId]?.name || providerId}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {PROVIDER_INFO[providerId]?.models.map((m) => (
                          <span key={m} className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Link 
                    href="/settings/providers" 
                    className="block text-center text-xs font-medium text-primary hover:text-primary/80 mt-2"
                  >
                    Manage Configurations
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
