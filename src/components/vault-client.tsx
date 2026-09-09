"use client";

import { useState, useRef } from "react";
import { Database, UploadCloud, FileText, Trash2, Search, CheckCircle2, AlertTriangle, FileJson, FileCode, FileImage } from "lucide-react";
import { uploadVaultFile, deleteVaultFile } from "@/app/actions/vault";
import { useRouter } from "next/navigation";

const getFileIcon = (type: string) => {
  if (type.includes("json")) return FileJson;
  if (type.includes("javascript") || type.includes("typescript") || type.includes("html") || type.includes("css")) return FileCode;
  if (type.includes("image")) return FileImage;
  return FileText;
};

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export default function VaultClient({ 
  initialFiles, 
  projects 
}: { 
  initialFiles: { id: string; name: string; type?: string; size: number; status: string; createdAt: Date; project: { name: string; } }[], 
  projects: { id: string; name: string; }[] 
}) {
  const [files, setFiles] = useState(initialFiles);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProject, setUploadProject] = useState(projects[0]?.id || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const router = useRouter();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0 || !uploadProject) return;
    
    const file = fileList[0];
    
    // In local mode, we extract text on the client if possible
    setIsUploading(true);
    
    try {
      let content = "";
      
      // Basic client-side text extraction for supported simple files
      if (file.type.includes("text") || file.name.endsWith(".md") || file.name.endsWith(".json") || file.name.endsWith(".csv")) {
        content = await file.text();
      } else {
        // Mock binary extraction (in a real app, send to server for OCR/pdf-parsing)
        content = `[Binary content representation of ${file.name}]`;
      }

      const newFile = await uploadVaultFile(uploadProject, file.name, file.type || "unknown", file.size, content);
      
      // Attach project name for local display
      const projName = projects.find(p => p.id === uploadProject)?.name;
      setFiles([{ ...newFile, project: { name: projName || "Unknown Project" } }, ...files]);
      router.refresh();
      
    } catch (err) {
      console.error(err);
      alert("Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this document? It will no longer be available to AI contexts.")) {
      try {
        await deleteVaultFile(id);
        setFiles(files.filter(f => f.id !== id));
        router.refresh();
      } catch (err) {
        console.error(err);
        alert("Failed to delete file");
      }
    }
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.project?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-sans flex items-center gap-3">
              <Database className="w-8 h-8 text-primary" />
              Knowledge Vault
            </h1>
            <p className="text-muted-foreground mt-1">Upload and organize data for your AI workspaces.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <select
              value={uploadProject}
              onChange={(e) => setUploadProject(e.target.value)}
              className="bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary h-[42px]"
            >
              {projects.length === 0 ? <option value="">No projects available</option> : null}
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || projects.length === 0}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 h-[42px]"
            >
              {isUploading ? "Uploading..." : <><UploadCloud className="w-4 h-4" /> Upload Document</>}
            </button>
          </div>
        </div>

        {projects.length === 0 && (
          <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg text-warning-foreground text-sm flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <div>You need to create a <strong>Project Workspace</strong> before you can upload knowledge files.</div>
          </div>
        )}

        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex gap-4 bg-muted/20">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search files by name or project..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-input rounded-lg pl-9 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Document</th>
                  <th className="px-6 py-4 font-medium">Project</th>
                  <th className="px-6 py-4 font-medium">Size</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredFiles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      No files found.
                    </td>
                  </tr>
                ) : (
                  filteredFiles.map((file) => {
                    const Icon = getFileIcon(file.type || "unknown");
                    return (
                      <tr key={file.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{file.name}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{new Date(file.createdAt).toLocaleString()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {file.project?.name}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                          {formatBytes(file.size)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 bg-success/10 text-success text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md">
                            <CheckCircle2 className="w-3 h-3" /> {file.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDelete(file.id)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
