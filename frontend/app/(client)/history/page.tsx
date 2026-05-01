"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card } from "@/components/ui/card";
import { AnalysisHistoryTable } from "@/components/analysis-history-table";
import { AuthGuard } from "@/lib/protected-route";

function PersonalHistoryPageContent() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <div className="flex">
        <DashboardSidebar />

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="space-y-8">
              <div>
                <h2 className="mb-2 text-3xl font-bold text-foreground">
                  My Analysis History
                </h2>
                <p className="text-muted-foreground">
                  View analyses for your repositories only.
                </p>
              </div>

              <Card className="overflow-hidden border border-border bg-card">
                <div className="p-6">
                  <AnalysisHistoryTable />
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function PersonalHistoryPage() {
  return (
    <AuthGuard>
      <PersonalHistoryPageContent />
    </AuthGuard>
  );
}
