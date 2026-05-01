"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface UserRecord {
  _id: string;
  username: string;
  githubId: number;
  avatar?: string;
  role: "USER" | "ADMIN";
  tier: "FREE" | "PRO";
  createdAt: string;
  updatedAt?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

type EditingUser = {
  _id: string;
  username: string;
  role: "USER" | "ADMIN";
  tier: "FREE" | "PRO";
};

export function AdminUsersTable() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<EditingUser | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const fetchUsers = useCallback(
    async (page = 1) => {
      try {
        setIsLoading(true);
        const res = await fetch(
          `${API_URL}/api/admin/users?page=${page}&limit=20`,
          { credentials: "include" },
        );
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        setUsers(data.users || []);
        setPagination(
          data.pagination || { page: 1, limit: 20, total: 0, pages: 0 },
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error loading users";
        toast({ title: "Error", description: msg, variant: "destructive" });
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openEditModal = (user: UserRecord) => {
    setEditing({
      _id: user._id,
      username: user.username,
      role: user.role,
      tier: user.tier,
    });
  };

  const handleSaveAccess = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/users/${editing._id}/access`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: editing.role, tier: editing.tier }),
        },
      );
      const data = await res.json();

      if (!res.ok) {
        // 403 self-demote | 400 invalid | 404 not found
        throw new Error(data.error || "Failed to update user access");
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u._id === editing._id ? { ...u, ...data.user } : u)),
      );
      setEditing(null);
      toast({
        title: "User access updated",
        description: `${data.user.username} → Role: ${data.user.role}, Tier: ${data.user.tier}`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Update failed";
      toast({ title: "Update Failed", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    return role === "ADMIN"
      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
      : "bg-blue-500/20 text-blue-300 border border-blue-500/30";
  };

  const getTierBadge = (tier: string) => {
    return tier === "PRO"
      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
      : "bg-slate-500/20 text-slate-300 border border-slate-500/30";
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const isSelf = (userId: string) =>
    currentUser && ("_id" in currentUser ? currentUser._id : currentUser.id) === userId;

  // --- Render ---

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-muted-foreground">No users found</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-4 px-4 font-semibold text-foreground">
                User
              </th>
              <th className="text-left py-4 px-4 font-semibold text-foreground">
                Role
              </th>
              <th className="text-left py-4 px-4 font-semibold text-foreground">
                Tier
              </th>
              <th className="text-left py-4 px-4 font-semibold text-foreground">
                Joined
              </th>
              <th className="text-left py-4 px-4 font-semibold text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr
                key={user._id}
                className={`border-b border-border/50 transition-colors ${
                  index % 2 === 0 ? "bg-card/30" : "bg-card/10"
                } hover:bg-secondary/20`}
              >
                {/* User info */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-8 h-8 rounded-full border border-slate-700"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                        {user.username?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {user.username}
                        {isSelf(user._id) && (
                          <span className="ml-1.5 text-[10px] text-amber-400 font-normal">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        ID: {user.githubId}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Role badge */}
                <td className="py-3 px-4">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}
                  >
                    {user.role}
                  </span>
                </td>

                {/* Tier badge */}
                <td className="py-3 px-4">
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierBadge(user.tier)}`}
                  >
                    {user.tier}
                  </span>
                </td>

                {/* Date */}
                <td className="py-3 px-4 text-muted-foreground text-xs">
                  {formatDate(user.createdAt)}
                </td>

                {/* Actions */}
                <td className="py-3 px-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-border text-xs hover:bg-secondary"
                    onClick={() => openEditModal(user)}
                  >
                    Edit Access
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Page {pagination.page} of {pagination.pages} ({pagination.total}{" "}
            users)
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page <= 1}
              onClick={() => fetchUsers(pagination.page - 1)}
              className="text-xs"
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pagination.page >= pagination.pages}
              onClick={() => fetchUsers(pagination.page + 1)}
              className="text-xs"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit Access Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Edit User Access
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {editing.username}
                {isSelf(editing._id) && (
                  <span className="text-amber-400 ml-1">(your account)</span>
                )}
              </p>
            </div>

            {/* Role selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Role</label>
              <div className="flex gap-2">
                {(["USER", "ADMIN"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setEditing((prev) =>
                        prev
                          ? {
                              ...prev,
                              role: r,
                              // Auto-force PRO when promoting to ADMIN
                              tier: r === "ADMIN" ? "PRO" : prev.tier,
                            }
                          : null,
                      );
                    }}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      editing.role === r
                        ? r === "ADMIN"
                          ? "bg-purple-600/30 border-purple-500 text-purple-200"
                          : "bg-blue-600/30 border-blue-500 text-blue-200"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              {isSelf(editing._id) && editing.role === "USER" && (
                <p className="text-xs text-red-400">
                  ⚠ You cannot demote yourself. This will be blocked by the
                  server.
                </p>
              )}
            </div>

            {/* Tier selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Tier</label>
              <div className="flex gap-2">
                {(["FREE", "PRO"] as const).map((t) => (
                  <button
                    key={t}
                    disabled={editing.role === "ADMIN"}
                    onClick={() =>
                      setEditing((prev) => (prev ? { ...prev, tier: t } : null))
                    }
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      editing.tier === t
                        ? t === "PRO"
                          ? "bg-emerald-600/30 border-emerald-500 text-emerald-200"
                          : "bg-slate-600/30 border-slate-500 text-slate-200"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {editing.role === "ADMIN" && (
                <p className="text-xs text-slate-500">
                  Admins are automatically set to PRO tier.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(null)}
                disabled={saving}
                className="text-sm"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAccess}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-500 text-white text-sm"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <Spinner className="w-3 h-3" /> Saving...
                  </span>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
