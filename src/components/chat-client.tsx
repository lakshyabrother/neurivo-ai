"use client";

import { useChat } from "ai/react";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { Send, Square, RefreshCcw, Copy, Check, BotMessageSquare, User as UserIcon, SlidersHorizontal, Info, Command, Settings2, CheckCircle2, Edit2 } from "lucide-react";

const AVAILABLE_MODELS = {
  auto: ["neurivo-auto"],
  experiential: ["experiential-auto", "gpt-5.6-luna"],
  openai: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
  anthropic: ["claude-3-5-sonnet-20240620", "claude-3-opus-20240229", "claude-3-haiku-20240307"],
  gemini: ["gemini-1.5-pro", "gemini-1.5-flash"],
  custom: ["custom-model-id"],
};

const TASKS = ["Chat", "Code", "Research", "Summarize", "Analyze", "Brainstorm"];
const OUTPUT_STYLES = ["Concise", "Detailed", "Structured", "Step-by-step", "Table"];

export default function ChatClient({ 
  configuredProviders,
  id,
  initialMessages = [],
  initialMode = "Chat",
  projectId
}: { 
  configuredProviders: string[],
  id?: string,
  initialMessages?: { id: string; role: "user" | "assistant" | "system" | "data"; content: string; }[],
  initialMode?: string,
  projectId?: string
}) {
  const [providerId, setProviderId] = useState("experiential");
  const [modelId, setModelId] = useState("experiential-auto");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Command Center State
  const [showCommandCenter, setShowCommandCenter] = useState(false);
  const [task, setTask] = useState(
    TASKS.find(t => t.toLowerCase() === initialMode?.toLowerCase()) || "Chat"
  );
  const [outputStyle, setOutputStyle] = useState("Detailed");
  const [customInstructions, setCustomInstructions] = useState("");
  const [showInspector, setShowInspector] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-router logic
  const resolveModel = () => {
    if (providerId !== "auto") return { p: providerId, m: modelId };
    
    // Naive local router for AUTO mode
    let targetProvider = configuredProviders.includes("openai") ? "openai" : configuredProviders[0];
    let targetModel = AVAILABLE_MODELS[targetProvider as keyof typeof AVAILABLE_MODELS]?.[0] || "";

    if (task === "Code" && configuredProviders.includes("anthropic")) {
      targetProvider = "anthropic";
      targetModel = "claude-3-5-sonnet-20240620";
    } else if (task === "Research" && configuredProviders.includes("gemini")) {
      targetProvider = "gemini";
      targetModel = "gemini-1.5-pro";
    }
    
    return { p: targetProvider, m: targetModel };
  };

  const { p: resolvedProvider, m: resolvedModel } = resolveModel();

  // Combine system prompt based on command center settings
  const systemPrompt = `You are Neurivo, a highly intelligent AI workspace.
Task: ${task}
Output Style: ${outputStyle}
User Instructions: ${customInstructions || "None"}
`;

  const { messages, input, handleInputChange, handleSubmit, isLoading, stop, reload, error } = useChat({
    api: "/api/chat",
    id,
    initialMessages,
    body: {
      providerId: resolvedProvider,
      modelId: resolvedModel,
      systemPrompt,
      mode: task,
      projectId,
    },
  });

  const handleEditMessage = (content: string) => {
    handleInputChange({ target: { value: content } } as any);
    // Optional: We could slice the messages here, but Vercel AI SDK handles `setMessages` uniquely. 
    // Just copying to input is the safest immediate UX improvement for this scope.
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        const fakeEvent = new Event("submit") as unknown as React.FormEvent<HTMLFormElement>;
        handleSubmit(fakeEvent);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Top Header */}
      <div className="h-14 border-b border-border bg-card/80 backdrop-blur-sm flex items-center pl-14 md:px-4 pr-4 justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <h1 className="font-semibold text-foreground">Neurivo Workspace</h1>
          {providerId === "auto" && (
            <span className="text-[10px] uppercase font-bold tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">
              Auto Router Active
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInspector(!showInspector)}
            className={`p-2 rounded-md transition-colors ${showInspector ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
            title="Toggle Response Inspector"
          >
            <Info className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowCommandCenter(!showCommandCenter)}
            className={`flex items-center gap-2 text-sm font-medium border rounded-md px-3 py-1.5 transition-colors ${
              showCommandCenter ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-input text-foreground hover:bg-muted'
            }`}
          >
            <Command className="w-4 h-4" />
            Command Center
          </button>
        </div>
      </div>

      {/* Command Center Panel */}
      {showCommandCenter && (
        <div className="border-b border-border bg-card p-4 shadow-sm relative z-10 animate-in slide-in-from-top-4 duration-200">
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Task & Output */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Task Type</label>
                <div className="flex flex-wrap gap-2">
                  {TASKS.map(t => (
                    <button
                      key={t}
                      onClick={() => setTask(t)}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors border ${
                        task === t ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border text-foreground hover:border-primary/50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Output Style</label>
                <select
                  value={outputStyle}
                  onChange={(e) => setOutputStyle(e.target.value)}
                  className="w-full text-sm bg-background border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                >
                  {OUTPUT_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {/* Model Router */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                  <Settings2 className="w-3 h-3" /> Model Selection
                </label>
                <select
                  value={providerId}
                  onChange={(e) => {
                    const newProvider = e.target.value;
                    setProviderId(newProvider);
                    setModelId(AVAILABLE_MODELS[newProvider as keyof typeof AVAILABLE_MODELS]?.[0] || "");
                  }}
                  className="w-full text-sm bg-background border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-primary mb-2"
                >
                  <option value="auto">AUTO (Smart Router)</option>
                  <option value="openai" disabled={!configuredProviders.includes("openai")}>OpenAI</option>
                  <option value="anthropic" disabled={!configuredProviders.includes("anthropic")}>Anthropic</option>
                  <option value="gemini" disabled={!configuredProviders.includes("gemini")}>Google Gemini</option>
                  <option value="custom" disabled={!configuredProviders.includes("custom")}>Custom Provider</option>
                </select>

                {providerId !== "auto" && (
                  <select
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    className="w-full text-sm bg-background border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-primary"
                  >
                    {(AVAILABLE_MODELS[providerId as keyof typeof AVAILABLE_MODELS] || []).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                )}
                
                {providerId === "auto" && (
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded border border-border">
                    <span className="font-semibold text-primary">Router active.</span> Will route to <strong className="text-foreground">{resolvedModel}</strong> based on the current task ({task}).
                  </div>
                )}
              </div>
            </div>

            {/* Context */}
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Custom Instructions</label>
              <textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="e.g., Answer like a pirate, only output code..."
                className="w-full h-24 text-sm bg-background border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:border-primary resize-none"
              />
            </div>

          </div>
        </div>
      )}

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
              <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
                <SlidersHorizontal className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground mb-3 font-sans">
                {task} Workspace
              </h2>
              <p className="text-muted-foreground mb-8">
                Your command center is configured. Type a message below or adjust your settings from the top right.
              </p>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8 pb-24">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-4 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role !== "user" && (
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1 border border-primary/20">
                      <BotMessageSquare className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  
                  <div className={`group relative max-w-[85%] rounded-2xl px-5 py-4 ${
                    m.role === "user" 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "bg-card text-foreground border border-border shadow-sm"
                  }`}>
                    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                      {m.role === "user" ? (
                        <p className="whitespace-pre-wrap m-0">{m.content}</p>
                      ) : (
                        <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                          {m.content}
                        </ReactMarkdown>
                      )}
                    </div>
                    
                    <div className="absolute -bottom-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 right-0">
                      {m.role === "user" && (
                        <button 
                          onClick={() => handleEditMessage(m.content)}
                          className="text-muted-foreground hover:text-foreground text-[10px] font-medium uppercase tracking-wider flex items-center gap-1 bg-card px-2 py-1 rounded border border-border shadow-sm"
                        >
                          <Edit2 className="w-3 h-3" /> Edit
                        </button>
                      )}
                    </div>
                    
                    {m.role !== "user" && (
                      <div className="absolute -bottom-6 left-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button 
                          onClick={() => copyToClipboard(m.content, m.id)}
                          className="text-muted-foreground hover:text-foreground text-[10px] font-medium uppercase tracking-wider flex items-center gap-1 bg-card px-2 py-1 rounded border border-border shadow-sm"
                        >
                          {copiedId === m.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedId === m.id ? "Copied" : "Copy"}
                        </button>
                      </div>
                    )}
                  </div>

                  {m.role === "user" && (
                    <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center flex-shrink-0 mt-1 border border-border">
                      <UserIcon className="w-5 h-5 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {error && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm flex items-center gap-3 max-w-2xl mx-auto">
                  <div className="bg-destructive/20 p-2 rounded-md">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="block font-semibold">Generation Error</strong>
                    {error.message}
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Response Inspector Panel */}
        {showInspector && messages.length > 0 && (
          <div className="w-72 border-l border-border bg-card overflow-y-auto hidden lg:block animate-in slide-in-from-right-8 duration-300">
            <div className="p-4 border-b border-border sticky top-0 bg-card/90 backdrop-blur-sm z-10">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Response Inspector
              </h3>
            </div>
            <div className="p-4 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Generation Details</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <span className="text-sm text-muted-foreground">Provider</span>
                    <span className="text-sm font-medium text-foreground capitalize">{resolvedProvider}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <span className="text-sm text-muted-foreground">Model</span>
                    <span className="text-sm font-medium text-foreground">{resolvedModel}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <span className="text-sm text-muted-foreground">Mode</span>
                    <span className="text-sm font-medium text-foreground">{task}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-border pb-2">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className="text-sm font-medium text-success flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {isLoading ? "Streaming..." : "Complete"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">System Instructions</h4>
                <div className="bg-background border border-border rounded-md p-3 text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                  {systemPrompt}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Composer Input Area */}
      <div className="p-4 bg-background/80 backdrop-blur-md border-t border-border sticky bottom-0 z-20">
        <div className="max-w-4xl mx-auto relative">
          <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-card border border-input rounded-2xl shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary p-2 transition-all">
            <textarea
              className="flex-1 max-h-60 min-h-[44px] bg-transparent resize-none outline-none px-4 py-3 text-foreground placeholder:text-muted-foreground font-medium"
              placeholder={`Send a message to ${resolvedModel}...`}
              value={input}
              onChange={handleInputChange}
              onKeyDown={onKeyDown}
              rows={input.split("\n").length > 1 ? Math.min(input.split("\n").length, 8) : 1}
            />
            
            <div className="flex gap-2 pb-1.5 pr-2 flex-shrink-0">
              {isLoading ? (
                <button
                  type="button"
                  onClick={stop}
                  className="p-3 bg-destructive/10 text-destructive rounded-xl hover:bg-destructive/20 transition-colors"
                  title="Stop generating"
                >
                  <Square className="w-5 h-5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  <Send className="w-5 h-5" />
                </button>
              )}
            </div>
          </form>
          
          <div className="mt-3 text-center flex justify-between items-center px-2">
            <span className="text-[11px] text-muted-foreground font-medium tracking-wide">
              Neurivo uses advanced AI models. Consider verifying important information.
            </span>
            {messages.length > 0 && !isLoading && (
              <button onClick={() => reload()} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors bg-card px-2 py-1 rounded border border-border">
                <RefreshCcw className="w-3.5 h-3.5" /> Regenerate
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
