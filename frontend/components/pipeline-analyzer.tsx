"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { analysisApi, type AnalysisResult } from "@/lib/api-client";

export function PipelineAnalyzer() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCreatingPR, setIsCreatingPR] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const { toast } = useToast();

  const [pollingStatus, setPollingStatus] = useState<string | null>(null);

  /**
   * Poll the analysis status endpoint until a terminal state is reached.
   * Uses analysisApi.getAnalysisStatus() instead of raw fetch.
   */
  const pollAnalysisStatus = async (jobId: string) => {
    setPollingStatus("QUEUED");

    const maxAttempts = 60; // 60 × 3s = 3 minutes max
    let attempts = 0;

    return new Promise<AnalysisResult>((resolve, reject) => {
      const interval = setInterval(async () => {
        attempts += 1;

        try {
          const statusPayload = await analysisApi.getAnalysisStatus(jobId);

          setPollingStatus(statusPayload.status);

          if (statusPayload.status === "COMPLETED") {
            clearInterval(interval);
            setPollingStatus(null);
            resolve(statusPayload.result as AnalysisResult);
            return;
          }

          if (statusPayload.status === "FAILED") {
            clearInterval(interval);
            setPollingStatus(null);
            reject(new Error(statusPayload.errorMessage || "Analysis failed"));
            return;
          }

          if (attempts >= maxAttempts) {
            clearInterval(interval);
            setPollingStatus(null);
            reject(new Error("Analysis timed out. Please try again."));
          }
        } catch (error) {
          clearInterval(interval);
          setPollingStatus(null);
          reject(error);
        }
      }, 3000);
    });
  };

  const handleAnalyze = async () => {
    if (!input.trim()) return;

    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const urlParts = input.match(
        /github\.com\/([^/]+)\/([^/]+).*\/runs\/(\d+)/,
      );

      if (!urlParts) {
        throw new Error(
          "Invalid GitHub Actions URL. Please use format: https://github.com/owner/repo/actions/runs/12345678",
        );
      }

      const owner = urlParts[1];
      const repo = urlParts[2];
      const runId = urlParts[3];
      const repoUrl = `${owner}/${repo}`;

      // Backend resolves BYOK from encrypted user profile when available.
      const submission = await analysisApi.analyzeWorkflow(repoUrl, runId);

      if (submission.jobId) {
        const result = await pollAnalysisStatus(submission.jobId);
        setAnalysis(result);

        toast({
          title: "Analysis Complete",
          description: "Your workflow has been successfully analyzed!",
        });
        return;
      }

      throw new Error("Analysis job submission failed");
    } catch (error: unknown) {
      const apiError = error as { message?: string; data?: { code?: string } };
      const errorMessage = apiError?.message || "Failed to analyze workflow";

      if (
        apiError?.data?.code === "LIMIT_EXCEEDED" ||
        errorMessage.includes("weekly analysis limit")
      ) {
        setShowLimitModal(true);
        return;
      }

      console.error("Analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setPollingStatus(null);
    }
  };

  const handleCopyFix = () => {
    if (analysis?.aiResult.suggestedFix) {
      navigator.clipboard.writeText(analysis.aiResult.suggestedFix);
      toast({
        title: "Copied",
        description: "Fix suggestion copied to clipboard",
      });
    }
  };

  /**
   * Create an Auto-Fix PR using the centralized analysisApi client.
   */
  const handleCreatePR = async () => {
    if (!analysis) return;

    setIsCreatingPR(true);
    try {
      const data = await analysisApi.createAutoFixPrById(analysis._id);

      if (data.success && data.prUrl) {
        window.open(data.prUrl, "_blank", "noopener,noreferrer");
      }

      toast({
        title: "PR Created",
        description: "Redirecting to GitHub PR compare page...",
      });
    } catch (error: unknown) {
      const apiError = error as { message?: string };
      const errorMessage = apiError?.message || "Failed to create PR";
      toast({
        title: "PR Creation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreatingPR(false);
    }
  };

  return (
    <div className="space-y-8">
      {showLimitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-blue-500/30 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-2xl font-bold text-white">
              Weekly Limit Reached
            </h3>
            <p className="mt-3 text-sm text-slate-300">
              You have used all 5 FREE analyses for this 7-day window. Upgrade
              to PRO for priority AI model access and unlimited analysis.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowLimitModal(false)}
                className="border-slate-600 text-slate-200 hover:bg-slate-800"
              >
                Maybe Later
              </Button>
              <Button
                onClick={() => router.push("/upgrade")}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                Upgrade Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Input Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Analyze GitHub Actions Failures
          </h2>
          <p className="text-muted-foreground">
            Paste your GitHub Actions workflow URL or error logs to get instant
            AI-powered analysis
          </p>
        </div>

        {/* Input Card */}
        <Card className="border border-border bg-card p-6">
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                placeholder="Paste your GitHub Actions workflow URL (https://github.com/owner/repo/actions/runs/...)..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-40 bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none"
              />
              <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                {input.length} characters
              </div>
            </div>

            <div className="flex gap-3 justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Example: https://github.com/yourrepo/actions/runs/123456
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !input.trim()}
                className="bg-primary hover:bg-blue-600 text-primary-foreground font-medium px-8"
              >
                {isAnalyzing ? (
                  <div className="flex items-center gap-2">
                    <Spinner className="w-4 h-4" />
                    <span>
                      {pollingStatus === "QUEUED"
                        ? "Queued..."
                        : pollingStatus === "PROCESSING"
                          ? "AI Analyzing..."
                          : "Submitting..."}
                    </span>
                  </div>
                ) : (
                  "Analyze Now"
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Async Job Progress Indicator */}
      {isAnalyzing && pollingStatus && (
        <Card className="border border-blue-500/30 bg-blue-950/20 p-6 animate-in fade-in duration-300">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Spinner className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-sm font-semibold text-blue-100">
                  {pollingStatus === "QUEUED"
                    ? "Analysis Queued"
                    : pollingStatus === "PROCESSING"
                      ? "AI Processing..."
                      : "Waiting..."}
                </h3>
                <p className="text-xs text-blue-300/70">
                  {pollingStatus === "QUEUED"
                    ? "Your analysis job is in the queue. This usually takes 15-60 seconds."
                    : pollingStatus === "PROCESSING"
                      ? "Gemini AI is analyzing your CI/CD logs. Almost there..."
                      : "Checking status..."}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-blue-950/50 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  pollingStatus === "QUEUED"
                    ? "w-1/4 bg-blue-500"
                    : pollingStatus === "PROCESSING"
                      ? "w-3/4 bg-blue-400 animate-pulse"
                      : "w-1/6 bg-blue-600"
                }`}
              />
            </div>

            {/* Step indicators */}
            <div className="flex justify-between text-xs">
              <span
                className={`font-medium ${pollingStatus === "QUEUED" || pollingStatus === "PROCESSING" ? "text-blue-300" : "text-blue-500/50"}`}
              >
                ● Queued
              </span>
              <span
                className={`font-medium ${pollingStatus === "PROCESSING" ? "text-blue-300" : "text-blue-500/50"}`}
              >
                ● Processing
              </span>
              <span className="font-medium text-blue-500/50">○ Completed</span>
            </div>
          </div>
        </Card>
      )}

      {/* Results Section */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-300">
          {/* Root Cause Card */}
          <Card className="border-2 border-red-900/40 bg-card overflow-hidden">
            <div className="border-b border-red-900/40 px-6 py-4 bg-red-950/20">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <h3 className="text-lg font-semibold text-foreground">
                  Root Cause
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {analysis.aiResult.rootCause}
                </p>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    <strong>ID:</strong> {analysis._id.slice(-8)}
                  </p>
                  <p>
                    <strong>Status:</strong> Completed
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Suggested Fix Card */}
          <Card className="border border-gray-700/50 bg-card overflow-hidden">
            <div className="border-b border-gray-700/50 px-6 py-4 bg-gray-950/40 font-mono text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <h3 className="text-lg font-semibold text-foreground">
                  Suggested Fix
                </h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">
                    Recommended changes:
                  </p>
                  <div className="bg-gray-950/60 border border-gray-700/30 rounded-lg p-4 font-mono text-xs text-gray-300 overflow-x-auto max-h-64 overflow-y-auto">
                    <pre>{analysis.aiResult.suggestedFix}</pre>
                  </div>
                </div>

                <div className="bg-blue-950/30 border border-blue-700/30 rounded-lg p-3">
                  <p className="text-xs text-blue-300">
                    <strong>💡 Tip:</strong> Review the suggested changes before
                    applying them to your workflow.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyFix}
                  className="flex-1 border-border hover:bg-secondary"
                >
                  Copy Fix
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreatePR}
                  disabled={isCreatingPR}
                  className="flex-1 bg-primary hover:bg-blue-600 text-primary-foreground"
                >
                  {isCreatingPR ? "Creating PR..." : "Create PR"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!analysis && !isAnalyzing && (
        <div className="border-2 border-dashed border-border rounded-lg p-16 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-secondary mb-4">
            <svg
              className="w-6 h-6 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <p className="text-muted-foreground text-sm mb-2">No analysis yet</p>
          <p className="text-xs text-muted-foreground">
            Paste your GitHub Actions workflow URL above to get started
          </p>
        </div>
      )}
    </div>
  );
}
