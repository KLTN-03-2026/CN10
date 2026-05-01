"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/lib/protected-route";
import { useAuth } from "@/lib/auth-context";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

function SettingsContent() {
  const router = useRouter();
  const { user } = useAuth();

  const githubProfileUrl = useMemo(() => {
    if (!user?.username) {
      return null;
    }

    return `https://github.com/${user.username}`;
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="flex">
        <DashboardSidebar />

        <main className="min-w-0 flex-1 overflow-auto">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mb-6 rounded-2xl border border-blue-500/20 bg-card/50 p-5 shadow-xl backdrop-blur sm:mb-8 sm:p-7">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                Settings
              </h1>
              <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                Profile details are managed from your authenticated session.
              </p>
            </div>

            <section className="rounded-2xl border border-border bg-card/60 p-4 shadow-xl backdrop-blur sm:p-6 md:p-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-foreground sm:text-2xl">
                    Profile Information
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    BYOK settings have been moved to the client sidebar.
                  </p>
                </div>

                <div className="rounded-xl border border-blue-500/20 bg-background/70 p-4 sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt="User avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-semibold text-foreground">
                          {(user?.username || "U").slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="grid min-w-0 flex-1 grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Username
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-foreground sm:text-base">
                          {user?.username || "Unknown user"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          GitHub Profile
                        </p>
                        {githubProfileUrl ? (
                          <a
                            href={githubProfileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-1 inline-flex text-sm font-medium text-blue-300 transition hover:text-blue-200"
                          >
                            {githubProfileUrl}
                          </a>
                        ) : (
                          <p className="mt-1 text-sm text-muted-foreground">
                            Not available
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => router.push("/dashboard")}
                    className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-secondary"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}
