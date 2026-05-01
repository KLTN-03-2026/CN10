"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { PipelineAnalyzer } from "@/components/pipeline-analyzer";
import { AuthGuard } from "@/lib/protected-route";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user && user?.tier === "FREE") {
      const hasSeen = sessionStorage.getItem("hasSeenUpgrade");
      if (!hasSeen) {
        router.push("/upgrade");
      }
    }
  }, [user, router]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <DashboardHeader />

        <div className="flex">
          {/* Sidebar */}
          <DashboardSidebar />

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <PipelineAnalyzer />
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
