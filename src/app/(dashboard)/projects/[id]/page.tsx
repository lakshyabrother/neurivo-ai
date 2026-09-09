import { getProject } from "@/app/actions/projects";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MessageSquarePlus, FileText, ArrowLeft, MoreVertical } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Project Workspace - NEXORA",
};

export default async function ProjectWorkspacePage({
  params,
}: {
  params: { id: string };
}) {
  const project = await getProject(params.id);

  if (!project) {
    redirect("/projects");
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div>
          <Link href="/projects" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Projects
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans flex items-center gap-3">
                <div className="w-6 h-6 rounded-md shadow-sm" style={{ backgroundColor: project.color }}></div>
                {project.name}
              </h1>
              <p className="text-muted-foreground mt-1">Project Workspace</p>
            </div>
            <button className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Conversations Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">Conversations</h2>
              <Link 
                href={`/chat?projectId=${project.id}`}
                className="text-xs font-medium bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md hover:bg-secondary/80 transition-colors flex items-center gap-1.5"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" /> New Chat
              </Link>
            </div>
            
            {project.conversations.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-8 text-center bg-card/50">
                <p className="text-muted-foreground text-sm">No conversations in this project yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {project.conversations.map((conv) => (
                  <Link 
                    href={`/c/${conv.id}`} 
                    key={conv.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors group"
                  >
                    <div className="truncate">
                      <h4 className="font-medium text-foreground truncate">{conv.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(conv.updatedAt).toLocaleDateString()} • {conv.mode}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Knowledge Files Column */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">Knowledge Base</h2>
            </div>
            
            {project.files.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-8 text-center bg-card/50">
                <p className="text-muted-foreground text-sm">No files uploaded.</p>
                <button className="mt-3 text-xs font-medium text-primary hover:underline">
                  Upload Document
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {project.files.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                    <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="truncate flex-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{file.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
