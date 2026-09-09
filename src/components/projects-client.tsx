"use client";

import { useState } from "react";
import Link from "next/link";
import { Folder, Plus, FileText, MessageSquare, Trash2 } from "lucide-react";
import { createProject, deleteProject } from "@/app/actions/projects";
import { useRouter } from "next/navigation";

export default function ProjectsClient({ initialProjects }: { initialProjects: { id: string; name: string; color: string; updatedAt: Date; _count?: { conversations: number; files: number } }[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    try {
      const project = await createProject(newProjectName);
      setProjects([project, ...projects]);
      setIsCreating(false);
      setNewProjectName("");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Failed to create project");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Delete this project and all its contents?")) {
      try {
        await deleteProject(id);
        setProjects(projects.filter(p => p.id !== id));
        router.refresh();
      } catch (err) {
        console.error(err);
        alert("Failed to delete project");
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans flex items-center gap-3">
              <Folder className="w-8 h-8 text-primary" />
              Projects
            </h1>
            <p className="text-muted-foreground mt-1">Organize your workspace contexts</p>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Project
          </button>
        </div>

        {isCreating && (
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm mb-6 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-semibold text-lg mb-4">Create New Project</h3>
            <form onSubmit={handleCreate} className="flex items-end gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Project Name</label>
                <input 
                  autoFocus
                  type="text" 
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g., Marketing Campaign Q4"
                />
              </div>
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground font-medium"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={!newProjectName.trim()}
                className="bg-foreground text-background px-6 py-2 rounded-md font-medium disabled:opacity-50"
              >
                Create
              </button>
            </form>
          </div>
        )}

        {projects.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card/50">
            <Folder className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground">No projects yet</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              Create a project to group your related conversations, documents, and prompts into an isolated workspace context.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <Link 
                href={`/projects/${p.id}`} 
                key={p.id}
                className="group bg-card border border-border rounded-2xl p-6 hover:border-primary/50 hover:shadow-md transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-primary" style={{ backgroundColor: p.color }}></div>
                <div className="flex justify-between items-start mb-6 mt-2">
                  <h3 className="font-semibold text-lg text-foreground truncate pr-6">{p.name}</h3>
                  <button 
                    onClick={(e) => handleDelete(p.id, e)}
                    className="absolute right-4 top-6 p-1 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" />
                    <span>{p._count?.conversations || 0}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    <span>{p._count?.files || 0}</span>
                  </div>
                </div>
                
                <div className="mt-6 text-xs text-muted-foreground font-medium">
                  Updated {new Date(p.updatedAt).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
        
      </div>
    </div>
  );
}
