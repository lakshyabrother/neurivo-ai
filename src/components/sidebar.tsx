"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MessageSquarePlus, Key, BotMessageSquare, LogOut, PanelLeftClose, PanelLeftOpen, MessageSquare, Trash2, Pin, Folder, GitCompare, Database, BookOpen, Edit2, Moon, Sun, Menu, X } from "lucide-react";
import { signOut } from "next-auth/react";
import { useState } from "react";
import { deleteConversation, togglePinConversation, updateConversationTitle } from "@/app/actions/conversations";
import { useTheme } from "next-themes";
import { useEffect } from "react";

type Conversation = {
  id: string;
  title: string;
  updatedAt: Date;
  pinned: boolean;
};

export default function Sidebar({ user, conversations }: { user: { name?: string | null; email?: string | null } | null, conversations: Conversation[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [usage, setUsage] = useState<{ used: number; limit: number; remaining: number } | null>(null);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    fetch("/api/usage")
      .then((res) => res.json())
      .then((data) => setUsage(data))
      .catch((err) => console.error("Failed to fetch usage", err));
  }, [conversations]);

  const pinnedConversations = conversations.filter(c => c.pinned);
  const recentConversations = conversations.filter(c => !c.pinned);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (confirm("Delete this conversation?")) {
      await deleteConversation(id);
      if (pathname === `/c/${id}`) {
        router.push("/");
      }
    }
  };

  const handlePin = async (e: React.MouseEvent, id: string, currentlyPinned: boolean) => {
    e.preventDefault();
    await togglePinConversation(id, !currentlyPinned);
  };

  const handleRenameSubmit = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (editTitle.trim()) {
      await updateConversationTitle(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const startRename = (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.preventDefault();
    setEditTitle(currentTitle);
    setEditingId(id);
  };

  const renderConversationList = (list: Conversation[], title: string) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-4">
        {!isCollapsed && (
          <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
            {title}
          </div>
        )}
        <div className="space-y-1 px-2">
          {list.map((c) => {
            const isActive = pathname === `/c/${c.id}`;
            return (
              <Link
                key={c.id}
                href={`/c/${c.id}`}
                className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors relative ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                {!isCollapsed && (
                  <>
                    {editingId === c.id ? (
                      <form 
                        onSubmit={(e) => handleRenameSubmit(e, c.id)}
                        className="flex-1 pr-2"
                        onClick={(e) => e.preventDefault()}
                      >
                        <input
                          autoFocus
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={(e) => handleRenameSubmit(e, c.id)}
                          className="w-full bg-background border border-primary text-foreground rounded px-1 py-0.5 text-xs outline-none"
                        />
                      </form>
                    ) : (
                      <span className="truncate flex-1 pr-20">{c.title}</span>
                    )}
                    
                    {editingId !== c.id && (
                      <div className="absolute right-2 opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-md px-1 py-0.5 shadow-sm border border-border/50">
                        <button 
                          onClick={(e) => startRename(e, c.id, c.title)}
                          className="p-1 text-muted-foreground hover:text-foreground"
                          title="Rename"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={(e) => handlePin(e, c.id, c.pinned)}
                          className={`p-1 hover:text-foreground ${c.pinned ? "text-primary" : "text-muted-foreground"}`}
                          title={c.pinned ? "Unpin" : "Pin"}
                        >
                          <Pin className="h-3 w-3" />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(e, c.id)}
                          className="p-1 text-muted-foreground hover:text-destructive"
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Mobile Toggle Button (Visible only when sidebar is closed on mobile) */}
      {!isMobileOpen && (
        <button
          onClick={() => setIsMobileOpen(true)}
          className="md:hidden fixed top-3 left-4 z-40 p-2 bg-card border border-border rounded-md shadow-sm text-foreground"
        >
          <Menu className="h-4 w-4" />
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <div
        className={`flex flex-col border-r border-border bg-card transition-all duration-300 z-50
          fixed inset-y-0 left-0 md:relative md:translate-x-0 h-full
          ${isCollapsed ? "md:w-16" : "w-64"}
          ${isMobileOpen ? "translate-x-0 w-64 shadow-2xl" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="flex h-14 items-center justify-between border-b border-border px-4 shrink-0">
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-foreground font-sans">
            <div className="bg-primary text-primary-foreground p-1 rounded-md">
              <BotMessageSquare className="h-5 w-5" />
            </div>
            <span className="text-lg">Neurivo</span>
          </Link>
        )}
        {isCollapsed && (
          <div className="mx-auto flex h-full items-center">
            <div className="bg-primary text-primary-foreground p-1 rounded-md">
              <BotMessageSquare className="h-5 w-5" />
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`hidden md:block text-muted-foreground hover:text-foreground ${isCollapsed ? "mx-auto mt-4 absolute top-14 left-4" : ""}`}
          style={isCollapsed ? { display: 'none' } : {}}
        >
          <PanelLeftClose className="h-5 w-5" />
        </button>
        {isCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="hidden md:block absolute top-4 left-[68px] z-50 text-muted-foreground hover:text-foreground p-1 bg-card border border-border rounded-md shadow-sm"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        )}
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden text-muted-foreground hover:text-foreground p-1"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2 mb-4">
          <Link
            href="/"
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname === "/"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <MessageSquarePlus className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Dashboard</span>}
          </Link>
          <Link
            href="/chat"
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname === "/chat"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <MessageSquare className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>New Chat</span>}
          </Link>
          <Link
            href="/projects"
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname.startsWith("/projects")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Folder className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Projects</span>}
          </Link>
          <Link
            href="/arena"
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname.startsWith("/arena")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <GitCompare className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Model Arena</span>}
          </Link>
          <Link
            href="/vault"
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname.startsWith("/vault")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Database className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Knowledge Vault</span>}
          </Link>
          <Link
            href="/prompts"
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname.startsWith("/prompts")
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <BookOpen className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Prompt Lab</span>}
          </Link>
        </nav>
        
        {renderConversationList(pinnedConversations, "Pinned")}
        {renderConversationList(recentConversations, "Recent")}
        
        <div className="my-4 border-t border-border/50" />
        
        <nav className="space-y-1 px-2">
          {!isCollapsed && (
            <div className="px-3 mb-2 text-xs font-semibold text-muted-foreground tracking-wider uppercase">
              Settings
            </div>
          )}

          <Link
            href="/settings/providers"
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              pathname === "/settings/providers"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Key className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>API Keys & Models</span>}
          </Link>
        </nav>

        {!isCollapsed && usage && (
          <div className="mt-6 mx-4 p-3 bg-primary/5 rounded-lg border border-primary/10">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Free Plan</p>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-foreground">{usage.remaining} / {usage.limit} msgs</span>
              <span className="text-xs text-muted-foreground">left today</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div 
                className={`h-full ${usage.remaining === 0 ? 'bg-destructive' : 'bg-primary'}`} 
                style={{ width: `${(usage.used / usage.limit) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border p-4">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-foreground">
                {user?.name || "User"}
              </span>
              <span className="truncate text-xs text-muted-foreground">
                {user?.email}
              </span>
            </div>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="text-muted-foreground hover:text-foreground transition-colors p-2"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => signOut()}
              className="text-muted-foreground hover:text-destructive transition-colors p-2"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={() => signOut()}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
