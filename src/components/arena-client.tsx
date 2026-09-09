"use client";

import { useState, useRef, useEffect } from "react";
import { useChat } from "ai/react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { GitCompare, Square, CheckCircle2, Play } from "lucide-react";
import { useRouter } from "next/navigation";

const AVAILABLE_MODELS = {
  openai: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
  anthropic: ["claude-3-5-sonnet-20240620", "claude-3-opus-20240229", "claude-3-haiku-20240307"],
  gemini: ["gemini-1.5-pro", "gemini-1.5-flash"],
  custom: ["custom-model-id"],
};

export default function ArenaClient({ 
  configuredProviders,
  initialPrompt = ""
}: { 
  configuredProviders: string[],
  initialPrompt?: string
}) {
  const router = useRouter();
  
  // Model A State
  const [providerA, setProviderA] = useState(configuredProviders[0] || "openai");
  const [modelA, setModelA] = useState(AVAILABLE_MODELS[providerA as keyof typeof AVAILABLE_MODELS]?.[0] || "");
  const [timeA, setTimeA] = useState(0);

  // Model B State
  const [providerB, setProviderB] = useState(configuredProviders[1] || configuredProviders[0] || "openai");
  const [modelB, setModelB] = useState(AVAILABLE_MODELS[providerB as keyof typeof AVAILABLE_MODELS]?.[1] || AVAILABLE_MODELS[providerB as keyof typeof AVAILABLE_MODELS]?.[0] || "");
  const [timeB, setTimeB] = useState(0);

  const [prompt, setPrompt] = useState(initialPrompt);
  const [isBattling, setIsBattling] = useState(false);
  const [battleComplete, setBattleComplete] = useState(false);
  
  // Track start times
  const startTimeARef = useRef<number>(0);
  const startTimeBRef = useRef<number>(0);

  const chatA = useChat({
    api: "/api/chat",
    id: "arena-a",
    body: { providerId: providerA, modelId: modelA, preview: true, mode: "ARENA" },
    onFinish: () => {
      setTimeA(Date.now() - startTimeARef.current);
    }
  });

  const chatB = useChat({
    api: "/api/chat",
    id: "arena-b",
    body: { providerId: providerB, modelId: modelB, preview: true, mode: "ARENA" },
    onFinish: () => {
      setTimeB(Date.now() - startTimeBRef.current);
    }
  });

  useEffect(() => {
    // Instead of using effect to set state, we'll let the user manually see the result when streams stop
    // Or we just update a simple ref/derived state. But React 19 prefers we do it in an event.
    // However, useChat isLoading is reactive. We can derive battleComplete from isLoading directly.
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isActuallyBattling = isBattling && (chatA.isLoading || chatB.isLoading);
  const isActuallyComplete = isBattling && !chatA.isLoading && !chatB.isLoading && timeA > 0 && timeB > 0;

  const startBattle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isBattling) return;

    setIsBattling(true);
    setBattleComplete(false);
    setTimeA(0);
    setTimeB(0);
    
    // Clear previous
    chatA.setMessages([]);
    chatB.setMessages([]);

    startTimeARef.current = Date.now();
    startTimeBRef.current = Date.now();

    const userMessage = { id: Date.now().toString(), role: "user" as const, content: prompt };
    chatA.append(userMessage);
    chatB.append(userMessage);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleUseAnswer = (modelName: string) => {
    // Navigate away or pass data
    router.push(`/chat?mode=Chat`);
  };

  const lastMessageA = chatA.messages[chatA.messages.length - 1];
  const lastMessageB = chatB.messages[chatB.messages.length - 1];

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      
      {/* Header */}
      <div className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center px-6 sticky top-0 z-10 shrink-0">
        <h1 className="font-semibold text-foreground flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-primary" />
          Model Arena
        </h1>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Arena Configuration & Input */}
        <div className="bg-card border-b border-border p-6 shrink-0 z-20 shadow-sm relative">
          <div className="max-w-5xl mx-auto space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
              {/* Model A Config */}
              <div className="space-y-2 p-4 bg-primary/5 border border-primary/20 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                <label className="block text-xs font-bold text-primary uppercase tracking-wider">Model A</label>
                <div className="flex gap-2">
                  <select
                    value={providerA}
                    onChange={(e) => {
                      setProviderA(e.target.value);
                      setModelA(AVAILABLE_MODELS[e.target.value as keyof typeof AVAILABLE_MODELS]?.[0] || "");
                    }}
                    disabled={isBattling}
                    className="flex-1 text-sm bg-background border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                  >
                    <option value="openai" disabled={!configuredProviders.includes("openai")}>OpenAI</option>
                    <option value="anthropic" disabled={!configuredProviders.includes("anthropic")}>Anthropic</option>
                    <option value="gemini" disabled={!configuredProviders.includes("gemini")}>Google Gemini</option>
                  </select>
                  <select
                    value={modelA}
                    onChange={(e) => setModelA(e.target.value)}
                    disabled={isBattling}
                    className="flex-1 text-sm bg-background border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                  >
                    {(AVAILABLE_MODELS[providerA as keyof typeof AVAILABLE_MODELS] || []).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Model B Config */}
              <div className="space-y-2 p-4 bg-accent/30 border border-accent rounded-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-accent-foreground"></div>
                <label className="block text-xs font-bold text-accent-foreground uppercase tracking-wider">Model B</label>
                <div className="flex gap-2">
                  <select
                    value={providerB}
                    onChange={(e) => {
                      setProviderB(e.target.value);
                      setModelB(AVAILABLE_MODELS[e.target.value as keyof typeof AVAILABLE_MODELS]?.[0] || "");
                    }}
                    disabled={isBattling}
                    className="flex-1 text-sm bg-background border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-accent disabled:opacity-50"
                  >
                    <option value="openai" disabled={!configuredProviders.includes("openai")}>OpenAI</option>
                    <option value="anthropic" disabled={!configuredProviders.includes("anthropic")}>Anthropic</option>
                    <option value="gemini" disabled={!configuredProviders.includes("gemini")}>Google Gemini</option>
                  </select>
                  <select
                    value={modelB}
                    onChange={(e) => setModelB(e.target.value)}
                    disabled={isBattling}
                    className="flex-1 text-sm bg-background border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-accent disabled:opacity-50"
                  >
                    {(AVAILABLE_MODELS[providerB as keyof typeof AVAILABLE_MODELS] || []).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <form onSubmit={startBattle} className="flex gap-2">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={isBattling}
                placeholder="Enter a prompt to compare models..."
                className="flex-1 resize-none bg-background border border-input rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-inner disabled:opacity-50 h-16"
              />
              <button
                type="submit"
                disabled={!prompt.trim() || isBattling || configuredProviders.length === 0}
                className="bg-primary text-primary-foreground px-6 rounded-xl font-medium hover:bg-primary/90 transition-colors shadow-md flex items-center justify-center disabled:opacity-50"
              >
                {isBattling ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              </button>
            </form>

          </div>
        </div>

        {/* Battle Arena */}
        <div className="flex-1 flex overflow-hidden bg-muted/20">
          
          {/* Panel A */}
          <div className="flex-1 border-r border-border flex flex-col overflow-hidden relative group">
            <div className="h-10 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">{modelA}</span>
              {chatA.isLoading && <span className="text-xs text-muted-foreground animate-pulse flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary"></div> Generating...</span>}
              {!chatA.isLoading && timeA > 0 && <span className="text-xs text-muted-foreground">{(timeA / 1000).toFixed(2)}s</span>}
            </div>
            <div className="flex-1 overflow-y-auto p-6 prose prose-sm dark:prose-invert max-w-none">
              {!lastMessageA || lastMessageA.role === "user" ? (
                <div className="h-full flex items-center justify-center text-muted-foreground opacity-50">Waiting for prompt...</div>
              ) : (
                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                  {lastMessageA.content}
                </ReactMarkdown>
              )}
            </div>
            {isActuallyComplete && lastMessageA && lastMessageA.role === "assistant" && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleUseAnswer(modelA)}
                  className="bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Use This Answer
                </button>
              </div>
            )}
          </div>

          {/* Panel B */}
          <div className="flex-1 flex flex-col overflow-hidden relative group">
            <div className="h-10 bg-card border-b border-border flex items-center justify-between px-4 shrink-0 shadow-sm z-10">
              <span className="text-xs font-bold text-accent-foreground uppercase tracking-wider">{modelB}</span>
              {chatB.isLoading && <span className="text-xs text-muted-foreground animate-pulse flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-accent-foreground"></div> Generating...</span>}
              {!chatB.isLoading && timeB > 0 && <span className="text-xs text-muted-foreground">{(timeB / 1000).toFixed(2)}s</span>}
            </div>
            <div className="flex-1 overflow-y-auto p-6 prose prose-sm dark:prose-invert max-w-none">
              {!lastMessageB || lastMessageB.role === "user" ? (
                <div className="h-full flex items-center justify-center text-muted-foreground opacity-50">Waiting for prompt...</div>
              ) : (
                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                  {lastMessageB.content}
                </ReactMarkdown>
              )}
            </div>
            {isActuallyComplete && lastMessageB && lastMessageB.role === "assistant" && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleUseAnswer(modelB)}
                  className="bg-accent text-accent-foreground text-sm font-medium px-4 py-2 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2 border border-accent-foreground/20"
                >
                  <CheckCircle2 className="w-4 h-4" /> Use This Answer
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
