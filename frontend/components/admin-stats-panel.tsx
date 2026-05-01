"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api-client";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";

interface SystemStats {
  users: number;
  admins: number;
  totalAnalyses: number;
  analysesByStatus: Record<string, number>;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  QUEUED: {
    label: "Queued",
    color: "text-yellow-300",
    bg: "bg-yellow-500/20 border-yellow-500/30",
  },
  PROCESSING: {
    label: "Processing",
    color: "text-blue-300",
    bg: "bg-blue-500/20 border-blue-500/30",
  },
  COMPLETED: {
    label: "Completed",
    color: "text-green-300",
    bg: "bg-green-500/20 border-green-500/30",
  },
  PR_CREATED: {
    label: "PR Created",
    color: "text-purple-300",
    bg: "bg-purple-500/20 border-purple-500/30",
  },
  FAILED: {
    label: "Failed",
    color: "text-red-300",
    bg: "bg-red-500/20 border-red-500/30",
  },
};

export function AdminStatsPanel() {
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load stats.";
      setError(message);
      toast({
        title: "Stats Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="w-6 h-6" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-sm text-red-400">{error || "No data"}</p>
        <button
          onClick={fetchStats}
          className="text-sm text-blue-400 hover:text-blue-300 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const statusEntries = Object.entries(stats.analysesByStatus || {});
  const totalFromStatus = statusEntries.reduce(
    (sum, [, count]) => sum + count,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border border-slate-700/50 bg-gradient-to-br from-slate-900 to-slate-800 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Total Users
          </p>
          <p className="mt-2 text-3xl font-bold text-white">{stats.users}</p>
          <p className="mt-1 text-xs text-slate-500">
            including {stats.admins} admin{stats.admins !== 1 ? "s" : ""}
          </p>
        </Card>

        <Card className="border border-slate-700/50 bg-gradient-to-br from-slate-900 to-slate-800 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Total Admins
          </p>
          <p className="mt-2 text-3xl font-bold text-blue-400">
            {stats.admins}
          </p>
          <p className="mt-1 text-xs text-slate-500">system administrators</p>
        </Card>

        <Card className="border border-slate-700/50 bg-gradient-to-br from-slate-900 to-slate-800 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Total Analyses
          </p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">
            {stats.totalAnalyses}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            all-time pipeline analyses
          </p>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card className="border border-slate-700/50 bg-slate-900/60 p-5">
        <h4 className="text-sm font-semibold text-slate-300 mb-4">
          Analyses by Status
        </h4>

        {statusEntries.length === 0 ? (
          <p className="text-sm text-slate-500">No analysis data yet.</p>
        ) : (
          <div className="space-y-3">
            {statusEntries.map(([status, count]) => {
              const config = STATUS_CONFIG[status] || {
                label: status,
                color: "text-slate-300",
                bg: "bg-slate-500/20 border-slate-500/30",
              };
              const percent =
                totalFromStatus > 0
                  ? Math.round((count / totalFromStatus) * 100)
                  : 0;

              return (
                <div key={status} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={`inline-flex items-center gap-2 px-2 py-0.5 rounded border text-xs font-medium ${config.bg} ${config.color}`}
                    >
                      {config.label}
                    </span>
                    <span className="text-slate-400 font-mono text-xs">
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
