"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface AnalysisLog {
  _id: string;
  userId:
    | string
    | {
        _id: string;
        username: string;
        githubId?: string;
        avatar?: string;
        role?: string;
      }
    | null;
  repoFullName: string;
  runId?: string;
  branchName?: string;
  severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  aiResult?: {
    rootCause?: string;
    suggestedFix?: string;
  };
  status?: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-600/20 text-red-300 border border-red-500/40",
  HIGH: "bg-orange-500/20 text-orange-300 border border-orange-500/40",
  MEDIUM: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40",
  LOW: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-green-500/20 text-green-300 border border-green-500/30",
  FAILED: "bg-red-500/20 text-red-300 border border-red-500/30",
  PROCESSING: "bg-blue-500/20 text-blue-300 border border-blue-500/30",
  QUEUED: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30",
  PR_CREATED: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
};

export function AdminGlobalLogsTable() {
  const [logs, setLogs] = useState<AnalysisLog[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const { toast } = useToast();

  const fetchLogs = useCallback(
    async (page = 1, status?: string) => {
      try {
        setIsLoading(true);
        const filterParam =
          status && status !== "ALL" ? `&status=${status}` : "";
        const res = await fetch(
          `${API_URL}/api/admin/logs?page=${page}&limit=20${filterParam}`,
          { credentials: "include" },
        );
        if (!res.ok) throw new Error("Failed to fetch global logs");
        const data = await res.json();
        // Ensure logs is always an array
        setLogs(Array.isArray(data?.logs) ? data.logs : []);
        setPagination(
          data?.pagination || { page: 1, limit: 20, total: 0, pages: 0 },
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error loading logs";
        toast({ title: "Error", description: msg, variant: "destructive" });
        setLogs([]);
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    fetchLogs(1, statusFilter);
  }, [fetchLogs, statusFilter]);

  const getUserDisplay = (userId: AnalysisLog["userId"]) => {
    if (!userId) return "Deleted User";
    if (typeof userId === "string") return userId;
    return userId?.username || "Unknown";
  };

  const getUserAvatar = (userId: AnalysisLog["userId"]) => {
    if (!userId || typeof userId === "string") return null;
    return userId?.avatar || null;
  };

  const getUserGithubId = (userId: AnalysisLog["userId"]) => {
    if (!userId || typeof userId === "string") return null;
    return userId?.githubId || null;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const statusOptions = [
    "ALL",
    "QUEUED",
    "PROCESSING",
    "COMPLETED",
    "FAILED",
    "PR_CREATED",
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Filter:</span>
        {statusOptions.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
              statusFilter === s
                ? "bg-blue-600/30 border-blue-500 text-blue-200"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
            }`}
          >
            {s === "ALL" ? "All" : s}
          </button>
        ))}
        {pagination.total > 0 && (
          <span className="text-xs text-muted-foreground ml-2">
            {pagination.total} results
          </span>
        )}
      </div>

      {/* Table */}
      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center">
          <p className="text-muted-foreground">No analysis logs found.</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  User
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Repository
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Status
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Severity
                </th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">
                  Analysis
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, index) => (
                <tr
                  key={log._id}
                  className={`border-b border-border/50 transition-colors ${
                    index % 2 === 0 ? "bg-card/30" : "bg-card/10"
                  } hover:bg-secondary/20`}
                >
                  {/* User */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {getUserAvatar(log.userId) ? (
                        <img
                          src={getUserAvatar(log.userId)!}
                          alt=""
                          className="w-6 h-6 rounded-full border border-slate-700"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-400">
                          {getUserDisplay(log.userId).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          {getUserDisplay(log.userId)}
                        </p>
                        {getUserGithubId(log.userId) && (
                          <p className="text-[10px] text-muted-foreground font-mono">
                            #{getUserGithubId(log.userId)}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Repository */}
                  <td className="py-3 px-4">
                    <p className="text-xs font-mono text-foreground">
                      {log.repoFullName || "N/A"}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="inline-flex rounded-full border border-blue-500/40 bg-blue-500/15 px-1.5 py-0 text-[10px] font-medium text-blue-200">
                        {log.branchName || "main"}
                      </span>
                      {log.runId && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          #{log.runId}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        STATUS_COLORS[log.status || ""] ||
                        "bg-gray-500/20 text-gray-300 border border-gray-500/30"
                      }`}
                    >
                      {log.status || "UNKNOWN"}
                    </span>
                  </td>

                  {/* Severity */}
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        SEVERITY_COLORS[log.severity || ""] ||
                        "bg-gray-500/20 text-gray-300 border border-gray-500/30"
                      }`}
                    >
                      {log.severity || "—"}
                    </span>
                  </td>

                  {/* Analysis */}
                  <td className="py-3 px-4">
                    <Link
                      href={`/admin/history?analysisId=${log._id}`}
                      className="text-blue-300 underline underline-offset-4 hover:text-blue-200 text-xs"
                    >
                      View Details
                    </Link>
                    <p className="mt-0.5 max-w-xs truncate text-[11px] text-muted-foreground">
                      {log.aiResult?.rootCause || "No analysis yet"}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {formatDate(log.createdAt)}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={() => fetchLogs(pagination.page - 1, statusFilter)}
              className="text-xs"
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page >= pagination.pages}
              onClick={() => fetchLogs(pagination.page + 1, statusFilter)}
              className="text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
