"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { analysisApi } from "@/lib/api-client";

interface AnalysisResult {
  _id: string;
  repoFullName: string;
  branchName?: string;
  aiResult: {
    rootCause: string;
    suggestedFix: string;
  };
  status?: string | null;
  createdAt: string;
  updatedAt: string;
  prUrl?: string;
}

interface AnalysisHistoryTableProps {
  data?: AnalysisResult[];
}

type StatusVisual = {
  label: string;
  color: string;
};

const statusConfig: Record<string, StatusVisual> = {
  PASSED: { label: "Passed", color: "bg-emerald-900 text-emerald-200" },
  FAILED: { label: "Failed", color: "bg-red-900 text-red-200" },
  WARNING: { label: "Warning", color: "bg-amber-900 text-amber-200" },
  CRITICAL: { label: "Critical", color: "bg-rose-900 text-rose-200" },
  QUEUED: { label: "Queued", color: "bg-slate-700 text-slate-100" },
  PROCESSING: { label: "Processing", color: "bg-cyan-900 text-cyan-200" },
  PENDING: { label: "Pending", color: "bg-yellow-900 text-yellow-200" },
  COMPLETED: { label: "Completed", color: "bg-green-900 text-green-200" },
  PR_CREATED: { label: "PR Created", color: "bg-blue-900 text-blue-200" },
};

export function AnalysisHistoryTable({ data }: AnalysisHistoryTableProps) {
  const [analyses, setAnalyses] = useState<AnalysisResult[]>(data || []);
  const [isLoading, setIsLoading] = useState(!data);

  useEffect(() => {
    if (data) return;

    const loadHistory = async () => {
      try {
        const response = await analysisApi.getHistory(1, 10);
        setAnalyses(response.analyses);
      } catch (error) {
        console.error("Failed to load history:", error);
        setAnalyses([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [data]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-muted-foreground mb-2">No analyses found</p>
        <p className="text-xs text-muted-foreground">
          Start by analyzing a GitHub Actions workflow
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-secondary/40">
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
              Date
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
              Repository
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
              Root Cause
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">
              Status
            </th>
            <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {analyses.map((record, index) => {
            const safeStatus = String(record.status || "").toUpperCase();
            const currentStatus = statusConfig[safeStatus] || {
              color: "bg-gray-500 text-white",
              label: safeStatus || "Unknown",
            };

            return (
              <tr
                key={record._id}
                className={`border-b border-border transition-colors hover:bg-secondary/20 ${
                  index % 2 === 0 ? "bg-secondary/5" : "bg-transparent"
                }`}
              >
                <td className="px-6 py-4 text-sm text-muted-foreground font-mono">
                  {formatDate(record.createdAt)}
                </td>
                <td className="px-6 py-4 text-sm text-foreground font-medium">
                  <div className="flex items-center gap-2">
                    <span>{record.repoFullName}</span>
                    <span className="inline-flex rounded-full border border-blue-500/40 bg-blue-500/15 px-2 py-0.5 text-[11px] font-semibold text-blue-200">
                      {record.branchName || "main"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                        currentStatus.color
                      }`}
                    >
                      {currentStatus.label}
                    </span>
                    <span className="text-sm text-muted-foreground max-w-xs truncate">
                      {record.aiResult?.rootCause || "N/A"}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        safeStatus === "COMPLETED" || safeStatus === "PASSED"
                          ? "bg-green-500"
                          : safeStatus === "FAILED" || safeStatus === "CRITICAL"
                            ? "bg-red-500"
                            : safeStatus === "PR_CREATED"
                              ? "bg-blue-500"
                              : safeStatus === "WARNING"
                                ? "bg-amber-500"
                                : safeStatus === "PROCESSING"
                                  ? "bg-cyan-500"
                                  : "bg-yellow-500"
                      }`}
                    ></div>
                    <span className="text-sm text-muted-foreground">
                      {currentStatus.label}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  {record.prUrl ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-accent hover:text-accent hover:bg-secondary/40"
                      onClick={() => window.open(record.prUrl, "_blank")}
                    >
                      <span>View PR</span>
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
