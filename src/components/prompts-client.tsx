"use client";

import { useState } from "react";
import { BookOpen, Plus, Trash2, Search, Play, Copy, Check } from "lucide-react";
import { createPrompt, deletePrompt } from "@/app/actions/prompts";
import { useRouter } from "next/navigation";

const CATEGORIES = ["Coding", "Writing", "Study", "Research", "Business", "Productivity", "Creative", "General"];

export default function PromptsClient({ initialPrompts }: { initialPrompts: { id: string; title: string; content: string; category: string; createdAt: Date; }[] }) {
  const [prompts, setPrompts] = useState(initialPrompts);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    try {
      const prompt = await createPrompt(newTitle, newContent, newCategory);
      setPrompts([prompt, ...prompts]);
      setIsCreating(false);
      setNewTitle("");
      setNewContent("");
      setNewCategory("General");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to create prompt");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this prompt?")) {
      try {
        await deletePrompt(id);
        setPrompts(prompts.filter(p => p.id !== id));
        router.refresh();
      } catch (err) {
        console.error(err);
        alert("Failed to delete prompt");
      }
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPrompts = prompts.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              Prompt Lab
            </h1>
            <p className="text-muted-foreground mt-1">Design, test, and save reusable AI instructions</p>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Prompt
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search prompts by title, content, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
          />
        </div>

        {isCreating && (
          <div className="bg-card border border-primary/50 rounded-xl p-6 shadow-sm mb-6 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-semibold text-lg mb-4">Create New Prompt</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Title</label>
                  <input 
                    autoFocus
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="e.g., Code Review Expert"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-background border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Prompt Content</label>
                <textarea 
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full h-32 resize-none bg-background border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-mono text-sm"
                  placeholder="You are an expert software engineer performing a code review. Please check for..."
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-muted-foreground hover:text-foreground font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!newTitle.trim() || !newContent.trim()}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-md font-medium disabled:opacity-50"
                >
                  Save Prompt
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPrompts.map((p) => (
            <div key={p.id} className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-md transition-all flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg text-foreground truncate pr-6">{p.title}</h3>
                  <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                    {p.category}
                  </span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => copyToClipboard(p.content, p.id)}
                    className="p-1.5 text-muted-foreground hover:text-primary rounded-md"
                    title="Copy Prompt"
                  >
                    {copiedId === p.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive rounded-md"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 bg-background border border-border/50 rounded-lg p-4 font-mono text-xs text-muted-foreground whitespace-pre-wrap overflow-y-auto max-h-40">
                {p.content}
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                <div className="text-xs text-muted-foreground font-medium">
                  {new Date(p.createdAt).toLocaleDateString()}
                </div>
                <button 
                  onClick={() => router.push(`/arena?prompt=${encodeURIComponent(p.content)}`)}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <Play className="w-3.5 h-3.5" /> Run in Arena
                </button>
              </div>
            </div>
          ))}
          {filteredPrompts.length === 0 && !isCreating && (
            <div className="col-span-full text-center py-20 text-muted-foreground">
              No prompts found. Create one to get started.
            </div>
          )}
        </div>
        
      </div>
    </div>
  );
}
