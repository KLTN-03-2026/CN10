"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface FeedbackUser {
  _id: string;
  username: string;
  githubId?: number;
  avatar?: string;
  role?: string;
}

interface FeedbackTicket {
  _id: string;
  userId: FeedbackUser | null;
  message: string;
  status: "PENDING" | "RESOLVED";
  adminReply: string;
  createdAt: string;
  updatedAt?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export function AdminFeedbackPanel() {
  const [tickets, setTickets] = useState<FeedbackTicket[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, pages: 0,
  });
  const [loading, setLoading] = useState(true);

  // Resolve modal state
  const [resolving, setResolving] = useState<FeedbackTicket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Detail expand
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchTickets = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await fetch(
        `${API_URL}/api/admin/feedbacks?page=${page}&limit=20`,
        { credentials: "include" },
      );
      if (!res.ok) throw new Error("Failed to fetch feedback tickets");
      const data = await res.json();
      setTickets(data.feedback || []);
      setPagination(
        data.pagination || { page: 1, limit: 20, total: 0, pages: 0 },
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error loading feedback";
      toast({ title: "Error", description: msg, variant: "destructive" });
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // --- UC26: Resolve Feedback ---
  const openResolveModal = (ticket: FeedbackTicket) => {
    setResolving(ticket);
    setReplyText(ticket.adminReply || "");
  };

  const handleResolve = async () => {
    if (!resolving || !replyText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/feedbacks/${resolving._id}/resolve`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminReply: replyText.trim() }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resolve feedback");
      }

      // Update local state
      setTickets((prev) =>
        prev.map((t) =>
          t._id === resolving._id ? { ...t, ...data.feedback } : t,
        ),
      );
      setResolving(null);
      setReplyText("");
      toast({
        title: "Feedback resolved",
        description: `Reply sent to ${data.feedback?.userId?.username || "user"}.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Resolve failed";
      toast({ title: "Resolve Failed", description: msg, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Helpers ---
  const getStatusBadge = (status: string) => {
    return status === "RESOLVED"
      ? "bg-green-500/20 text-green-300 border border-green-500/30"
      : "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const truncate = (s: string, n: number) =>
    s.length > n ? s.slice(0, n) + "…" : s;

  const pendingCount = tickets.filter((t) => t.status === "PENDING").length;

  // --- Render ---
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner className="w-6 h-6" />
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">No feedback tickets yet.</p>
      </div>
    );
  }

  return (
    <>
      {/* Summary */}
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm text-slate-400">
          {pagination.total} total tickets
        </span>
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Ticket List */}
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <Card
            key={ticket._id}
            className={`border p-4 transition-colors ${
              ticket.status === "PENDING"
                ? "border-yellow-700/40 bg-yellow-950/10"
                : "border-slate-700/50 bg-slate-900/40"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              {/* Left: user + message */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {ticket.userId?.avatar ? (
                  <img
                    src={ticket.userId.avatar}
                    alt={ticket.userId.username}
                    className="w-8 h-8 rounded-full border border-slate-700 flex-shrink-0 mt-0.5"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0 mt-0.5">
                    {ticket.userId?.username?.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-foreground">
                      {ticket.userId?.username || "Deleted User"}
                    </span>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusBadge(ticket.status)}`}
                    >
                      {ticket.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDate(ticket.createdAt)}
                    </span>
                  </div>

                  {/* Message preview or full */}
                  <p
                    className="text-sm text-slate-300 mt-1 cursor-pointer hover:text-white transition-colors"
                    onClick={() =>
                      setExpandedId(
                        expandedId === ticket._id ? null : ticket._id,
                      )
                    }
                  >
                    {expandedId === ticket._id
                      ? ticket.message
                      : truncate(ticket.message, 120)}
                  </p>

                  {/* Admin reply (if resolved) */}
                  {ticket.status === "RESOLVED" && ticket.adminReply && (
                    <div className="mt-2 pl-3 border-l-2 border-green-600/40">
                      <p className="text-xs text-green-400 font-medium">
                        Admin Reply:
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {expandedId === ticket._id
                          ? ticket.adminReply
                          : truncate(ticket.adminReply, 80)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: action button */}
              <div className="flex-shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openResolveModal(ticket)}
                  className={`text-xs ${
                    ticket.status === "PENDING"
                      ? "border-yellow-600/50 text-yellow-300 hover:bg-yellow-500/10"
                      : "border-slate-600 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  {ticket.status === "PENDING" ? "Resolve" : "Edit Reply"}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.pages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={() => fetchTickets(pagination.page - 1)}
              className="text-xs"
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page >= pagination.pages}
              onClick={() => fetchTickets(pagination.page + 1)}
              className="text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {resolving.status === "PENDING"
                  ? "Resolve Feedback"
                  : "Edit Reply"}
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                From: {resolving.userId?.username || "Deleted User"}
              </p>
            </div>

            {/* Original message (read-only) */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                User Message
              </label>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 max-h-32 overflow-y-auto">
                {resolving.message}
              </div>
            </div>

            {/* Admin reply textarea */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Your Reply
              </label>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Type your reply to the user..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 resize-none"
              />
              {replyText.trim().length === 0 && (
                <p className="text-xs text-red-400">Reply cannot be empty.</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setResolving(null);
                  setReplyText("");
                }}
                disabled={submitting}
                className="text-sm"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleResolve}
                disabled={submitting || !replyText.trim()}
                className="bg-green-600 hover:bg-green-500 text-white text-sm"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="w-3 h-3" /> Sending...
                  </span>
                ) : (
                  "Submit Reply"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
