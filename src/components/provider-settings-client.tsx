"use client";

import { useState } from "react";
import { saveProviderCredential, deleteProviderCredential, toggleProviderCredential } from "@/app/actions/providers";
import { Key, Plus, Trash2, Check, AlertCircle, Loader2 } from "lucide-react";

type ProviderCredential = {
  id: string;
  provider: string;
  baseUrl: string | null;
  enabled: boolean;
  updatedAt: Date;
};

const SUPPORTED_PROVIDERS = [
  { id: "openai", name: "OpenAI" },
  { id: "anthropic", name: "Anthropic" },
  { id: "gemini", name: "Google Gemini" },
  { id: "custom", name: "Custom (OpenAI Compatible)" },
];

export default function ProviderSettingsClient({
  initialCredentials,
}: {
  initialCredentials: ProviderCredential[];
}) {
  const [credentials] = useState<ProviderCredential[]>(initialCredentials);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!apiKey.trim()) throw new Error("API Key is required");

      await saveProviderCredential(selectedProvider, apiKey, baseUrl);
      
      setSuccess(`${SUPPORTED_PROVIDERS.find(p => p.id === selectedProvider)?.name} credentials saved securely.`);
      setApiKey("");
      setBaseUrl("");
      setIsAdding(false);
      
      // We would normally re-fetch or rely on Next.js Server Action revalidatePath.
      // Next.js will refresh the page data automatically since we used revalidatePath.
      // But to update local optimistic state quickly:
      window.location.reload(); 
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save credentials");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;
    try {
      await deleteProviderCredential(id);
      window.location.reload();
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to delete credential");
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await toggleProviderCredential(id, enabled);
      window.location.reload();
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to toggle credential");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Key className="w-6 h-6 text-primary" /> API Keys & Models
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure your AI provider credentials. Keys are encrypted at rest and never exposed to the frontend.
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-md flex items-center gap-2">
          <Check className="w-5 h-5" />
          <span>{success}</span>
        </div>
      )}

      <div className="space-y-4">
        {credentials.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg p-8 text-center bg-card/50">
            <p className="text-muted-foreground mb-4">No API providers configured yet.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {credentials.map((cred) => (
              <div key={cred.id} className="border border-border bg-card rounded-lg p-4 flex items-center justify-between shadow-sm">
                <div>
                  <h3 className="font-semibold text-foreground">
                    {SUPPORTED_PROVIDERS.find(p => p.id === cred.provider)?.name || cred.provider}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                    Configured • Last updated {new Date(cred.updatedAt).toLocaleDateString()}
                  </p>
                  {cred.baseUrl && (
                    <p className="text-xs text-muted-foreground mt-1 font-mono">
                      URL: {cred.baseUrl}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only" 
                        checked={cred.enabled}
                        onChange={(e) => handleToggle(cred.id, e.target.checked)}
                      />
                      <div className={`block w-10 h-6 rounded-full transition-colors ${cred.enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}></div>
                      <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${cred.enabled ? 'transform translate-x-4' : ''}`}></div>
                    </div>
                  </label>
                  <button 
                    onClick={() => handleDelete(cred.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-2"
                    title="Delete key"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium transition-colors border border-border"
        >
          <Plus className="w-4 h-4" /> Add Provider
        </button>
      ) : (
        <div className="border border-border bg-card rounded-lg p-6 shadow-sm mt-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Add New Provider Configuration</h2>
          <form onSubmit={handleSave} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Provider</label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full bg-background border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              >
                {SUPPORTED_PROVIDERS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">API Key</label>
              <input
                type="password"
                required
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-background border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-foreground font-mono"
              />
            </div>

            {selectedProvider === "custom" && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Base URL</label>
                <input
                  type="url"
                  required
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.your-custom-provider.com/v1"
                  className="w-full bg-background border border-input rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-foreground font-mono text-sm"
                />
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Configuration
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-muted-foreground hover:text-foreground px-4 py-2 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
