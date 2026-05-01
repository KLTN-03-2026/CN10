"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "@/lib/protected-route";
import { AdminShell } from "@/components/admin-shell";
import { adminApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

type AccessRole = "USER" | "ADMIN";
type AccessTier = "FREE" | "PRO";

type AdminUser = {
  _id?: string;
  id?: string;
  username: string;
  githubId: string;
  avatar?: string;
  role: AccessRole;
  tier: AccessTier;
  createdAt?: string;
};

function getUserId(user: AdminUser): string {
  return user._id || user.id || "";
}

function AdminUsersPageContent() {
  const { toast } = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [accessState, setAccessState] = useState<
    Record<string, { role: AccessRole; tier: AccessTier }>
  >({});

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getUsers(1, 100);
        const rows = (data.users || []) as unknown as AdminUser[];
        setUsers(rows);

        const initial: Record<string, { role: AccessRole; tier: AccessTier }> =
          {};
        rows.forEach((row) => {
          const id = getUserId(row);
          if (id) {
            initial[id] = { role: row.role, tier: row.tier || "FREE" };
          }
        });
        setAccessState(initial);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to load users";
        toast({
          title: "Load Failed",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [toast]);

  const handleSaveAccess = async (userId: string) => {
    const payload = accessState[userId];
    if (!payload) {
      return;
    }

    try {
      setUpdatingId(userId);
      const updated = await adminApi.updateUserAccess(
        userId,
        payload.role,
        payload.tier,
      );

      setUsers((prev) =>
        prev.map((item) =>
          getUserId(item) === userId
            ? {
                ...item,
                role: updated.role,
                tier: updated.tier,
              }
            : item,
        ),
      );

      setAccessState((prev) => ({
        ...prev,
        [userId]: { role: updated.role, tier: updated.tier },
      }));

      toast({
        title: "Updated",
        description: "User role and tier were updated successfully.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update access";
      toast({
        title: "Update Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AdminShell>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">User Management</h2>
        <p className="text-sm text-slate-400">
          Manage platform user access role and subscription tier.
        </p>

        <div className="bg-slate-900 rounded-xl border border-slate-800 shadow-lg p-6 overflow-x-auto">
          {loading ? (
            <div className="py-10 text-center text-sm text-slate-400">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">
              No users found.
            </div>
          ) : (
            <table className="w-full min-w-[860px] text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-300">
                  <th className="py-3 pr-4 text-left">User</th>
                  <th className="py-3 pr-4 text-left">GitHub ID</th>
                  <th className="py-3 pr-4 text-left">Role</th>
                  <th className="py-3 pr-4 text-left">Tier</th>
                  <th className="py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((item) => {
                  const id = getUserId(item);
                  const selected = accessState[id] || {
                    role: item.role,
                    tier: item.tier || "FREE",
                  };

                  return (
                    <tr
                      key={id}
                      className="border-b border-slate-800/70 last:border-b-0"
                    >
                      <td className="py-3 pr-4 text-slate-200">
                        {item.username}
                      </td>
                      <td className="py-3 pr-4 font-mono text-xs text-slate-300">
                        {item.githubId}
                      </td>
                      <td className="py-3 pr-4">
                        <select
                          value={selected.role}
                          onChange={(event) =>
                            setAccessState((prev) => {
                              const nextRole = event.target.value as AccessRole;
                              const nextTier =
                                nextRole === "ADMIN" ? "PRO" : selected.tier;
                              return {
                                ...prev,
                                [id]: {
                                  role: nextRole,
                                  tier: nextTier,
                                },
                              };
                            })
                          }
                          className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200"
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td className="py-3 pr-4">
                        <select
                          value={
                            selected.role === "ADMIN" ? "PRO" : selected.tier
                          }
                          disabled={selected.role === "ADMIN"}
                          onChange={(event) =>
                            setAccessState((prev) => ({
                              ...prev,
                              [id]: {
                                role: selected.role,
                                tier: event.target.value as AccessTier,
                              },
                            }))
                          }
                          className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-slate-200 disabled:opacity-60"
                        >
                          <option value="FREE">FREE</option>
                          <option value="PRO">PRO</option>
                        </select>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          disabled={updatingId === id}
                          onClick={() => handleSaveAccess(id)}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-800"
                        >
                          {updatingId === id ? "Updating..." : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </AdminShell>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <AdminUsersPageContent />
    </AdminGuard>
  );
}
