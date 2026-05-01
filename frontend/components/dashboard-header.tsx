"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { feedbackApi } from "@/lib/api-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<
    Array<{
      _id: string;
      message: string;
      adminReply: string;
      createdAt: string;
      updatedAt: string;
    }>
  >([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const unreadCount = useMemo(() => notifications.length, [notifications]);

  const loadNotifications = async () => {
    if (!user || user.role !== "USER") {
      return;
    }

    try {
      setIsLoadingNotifications(true);
      const payload = await feedbackApi.getNotifications();
      setNotifications(payload.notifications || []);
    } catch (error) {
      // Keep header resilient if notification API fails.
      setNotifications([]);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "USER") {
      setNotifications([]);
      return;
    }

    loadNotifications();
    const timer = window.setInterval(loadNotifications, 30000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]);

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  const handleOpenNotificationItem = async (feedbackId: string) => {
    try {
      await feedbackApi.markAsRead(feedbackId);
      setNotifications((prev) =>
        prev.filter((item) => item._id !== feedbackId),
      );
    } catch (error) {
      // Ignore UI hard-fail and keep the item visible for retry.
    }
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getUserInitials = () => {
    if (!user?.username) return "U";
    return user.username.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AI</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">LOGGERS</h1>
          </div>

          {/* Navigation & User Menu */}
          <div className="flex items-center gap-4">
            {user?.role !== "ADMIN" && user?.tier === "FREE" && (
              <Button
                asChild
                size="sm"
                className="bg-blue-600 hover:bg-blue-500"
              >
                <Link href="/upgrade">Upgrade to PRO</Link>
              </Button>
            )}

            {user?.role === "USER" && (
              <DropdownMenu
                open={isNotificationOpen}
                onOpenChange={setIsNotificationOpen}
              >
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="relative border-border hover:bg-secondary"
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
                        d="M15 17h5l-1.4-1.4A2 2 0 0118 14.17V11a6 6 0 10-12 0v3.17c0 .53-.21 1.04-.59 1.43L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-96 p-0">
                  <div className="border-b border-border px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">
                      Thong bao phan hoi tu Admin
                    </p>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {isLoadingNotifications ? (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        Dang tai thong bao...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                        Chua co phan hoi moi tu Admin.
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <button
                          key={item._id}
                          type="button"
                          onClick={() => handleOpenNotificationItem(item._id)}
                          className="w-full border-b border-border px-4 py-3 text-left transition hover:bg-secondary"
                        >
                          <p className="text-xs text-muted-foreground">
                            {formatDate(item.updatedAt)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Feedback cua ban:
                          </p>
                          <p className="text-sm text-foreground line-clamp-2">
                            {item.message}
                          </p>
                          <p className="mt-2 text-xs text-blue-300">
                            Admin tra loi:
                          </p>
                          <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-4">
                            {item.adminReply}
                          </p>
                          <p className="mt-2 text-[11px] text-emerald-400">
                            Bam de danh dau da doc
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* User Menu Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-border hover:bg-secondary"
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {getUserInitials()}
                    </span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem disabled>
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {user?.username || "User"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      #{user?.id?.slice(-8) || "ID"}
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user?.role !== "ADMIN" && (
                  <DropdownMenuItem>
                    <Link href="/settings" className="w-full">
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                )}
                {user?.role !== "ADMIN" && <DropdownMenuSeparator />}
                <DropdownMenuItem onClick={handleLogout}>
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
