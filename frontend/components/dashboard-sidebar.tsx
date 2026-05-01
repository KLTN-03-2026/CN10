"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { userApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

export function DashboardSidebar() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [isByokOpen, setIsByokOpen] = useState(false);
  const [byokKey, setByokKey] = useState("");
  const [isSavingByok, setIsSavingByok] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!feedbackMessage.trim()) {
      alert("Please enter your feedback before submitting.");
      return;
    }

    try {
      setIsSubmittingFeedback(true);

      const response = await fetch(`${apiUrl}/api/feedback`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: feedbackMessage.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || "Failed to submit feedback.",
        );
      }

      alert(
        data?.message ||
          "Thank you. Your feedback has been sent to the admin team.",
      );
      setFeedbackMessage("");
      setIsFeedbackOpen(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit feedback.";
      alert(message);
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-20 left-4 z-40 p-2 rounded-lg bg-secondary hover:bg-muted transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          />
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:static top-16 left-0 w-64 h-[calc(100vh-4rem)] flex flex-col h-full bg-slate-900 border-r border-slate-800 transition-transform duration-300 z-30 overflow-hidden`}
      >
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-800 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                AI
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  AI CI/CD Analyzer
                </p>
                <p className="text-xs text-slate-400">Client Workspace</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            <Button
              asChild
              className="w-full justify-start bg-blue-600 text-white hover:bg-blue-500"
            >
              <Link href="/dashboard">
                <svg
                  className="mr-2 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                New Analysis
              </Link>
            </Button>
          </div>

          <div className="px-4">
            <nav className="space-y-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-200 transition hover:bg-slate-800"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 16l-7-4m0 0V5m7 4l7-4"
                  />
                </svg>
                Dashboard
              </Link>
              <Link
                href="/history"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-slate-100"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                My History
              </Link>
              <Link
                href="/dashboard/documentation"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-slate-100"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17.001c0 5.591 3.824 10.29 9 11.622m0-13c5.5 0 10-4.745 10-10.999C22 5.159 17.5.413 12 .413z"
                  />
                </svg>
                Documentation
              </Link>
            </nav>
          </div>

          <div className="mt-auto border-t border-slate-800 p-4">
            <button
              type="button"
              onClick={() => setIsByokOpen(true)}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-purple-400/40 bg-purple-500/20 px-3 py-2.5 text-sm font-semibold text-purple-100 transition hover:bg-purple-500/30"
            >
              BYOK Gemini Key
            </button>

            <div className="mb-3 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2">
              <p className="text-xs text-slate-400">
                Need help improving the platform?
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsFeedbackOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-500/40 bg-blue-500/20 px-3 py-2.5 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/30"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4v-4z"
                />
              </svg>
              Submit Feedback
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-20 top-16"
          onClick={() => setIsOpen(false)}
        />
      )}

      {isFeedbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900/90 p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-100">
              Send Feedback to Admin
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Share product feedback, feature requests, or pain points.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <textarea
                value={feedbackMessage}
                onChange={(event) => setFeedbackMessage(event.target.value)}
                rows={5}
                placeholder="Type your feedback here..."
                className="w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={isSubmittingFeedback}
                  onClick={() => {
                    setIsFeedbackOpen(false);
                    setFeedbackMessage("");
                  }}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingFeedback}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-800"
                >
                  {isSubmittingFeedback ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isByokOpen && user?.tier !== "PRO" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-amber-500/40 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-amber-100">
              Tính năng BYOK dành cho gói PRO
            </h3>
            <p className="mt-2 text-sm text-slate-300">
              Đây là tính năng dành cho gói PRO. Vui lòng nâng cấp để sử dụng
              API Key cá nhân của bạn.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsByokOpen(false)}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
              >
                Dong
              </button>
              <Link
                href="/upgrade"
                onClick={() => setIsByokOpen(false)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500"
              >
                Nang cap PRO
              </Link>
            </div>
          </div>
        </div>
      )}

      {isByokOpen && user?.tier === "PRO" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900/95 p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-100">
              Luu BYOK cho Gemini
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Key se duoc ma hoa va luu an toan tren server.
            </p>

            <div className="mt-4 space-y-3">
              <input
                type="password"
                value={byokKey}
                onChange={(event) => setByokKey(event.target.value)}
                placeholder="Nhap Gemini API key cua ban"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                autoComplete="off"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={isSavingByok}
                onClick={() => {
                  setIsByokOpen(false);
                  setByokKey("");
                }}
                className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800 disabled:opacity-60"
              >
                Huy
              </button>
              <button
                type="button"
                disabled={isSavingByok}
                onClick={async () => {
                  if (!byokKey.trim()) {
                    toast({
                      title: "Loi",
                      description: "Vui long nhap Gemini API key.",
                      variant: "destructive",
                    });
                    return;
                  }

                  try {
                    setIsSavingByok(true);
                    await userApi.updateByok(byokKey.trim());
                    toast({
                      title: "Thanh cong",
                      description: "Da luu BYOK key an toan.",
                    });
                    setByokKey("");
                    setIsByokOpen(false);
                  } catch (error) {
                    const message =
                      error instanceof Error
                        ? error.message
                        : "Khong the luu BYOK key";
                    toast({
                      title: "Luu that bai",
                      description: message,
                      variant: "destructive",
                    });
                  } finally {
                    setIsSavingByok(false);
                  }
                }}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
              >
                {isSavingByok ? "Dang luu..." : "Luu key"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
