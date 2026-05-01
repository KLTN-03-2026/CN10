"use client";

import { useState } from "react";
import { AdminGuard } from "@/lib/protected-route";
import { AdminShell } from "@/components/admin-shell";
import { useToast } from "@/hooks/use-toast";
import { adminApi } from "@/lib/api-client";

function AdminKnowledgeSyncPageContent() {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedCount, setLastSyncedCount] = useState<number | null>(null);

  const handleSyncAI = async () => {
    try {
      setSyncing(true);
      const payload = await adminApi.syncKnowledge();
      setLastSyncedCount(Number(payload.syncedCount || 0));
      toast({
        title: "AI Sync Completed",
        description:
          payload.message ||
          `Synchronized ${String(payload.syncedCount || 0)} knowledge documents.`,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to synchronize AI knowledge";
      toast({
        title: "Sync Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AdminShell>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">
          Public Knowledge RAG Sync
        </h2>
        <p className="text-sm text-slate-400">
          Admin-only operation to fetch and index public documentation for AI
          retrieval.
        </p>
        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg p-6 space-y-6">
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm text-slate-300">
            Last synced documents:{" "}
            <span className="font-semibold text-white">
              {lastSyncedCount === null
                ? "Not synced yet"
                : String(lastSyncedCount)}
            </span>
          </div>

          <button
            onClick={handleSyncAI}
            disabled={syncing}
            className="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-4 text-base font-bold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-800"
          >
            {syncing
              ? "Synchronizing Public Knowledge..."
              : "Sync Public Knowledge Base"}
          </button>
        </div>
      </section>
    </AdminShell>
  );
}

export default function AdminKnowledgeSyncPage() {
  return (
    <AdminGuard>
      <AdminKnowledgeSyncPageContent />
    </AdminGuard>
  );
}
