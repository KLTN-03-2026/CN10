"use client";

import { Card } from "@/components/ui/card";
import { AdminGlobalLogsTable } from "@/components/admin-global-logs-table";
import { AdminGuard } from "@/lib/protected-route";
import { AdminShell } from "@/components/admin-shell";

function AdminHistoryPageContent() {
  return (
    <AdminShell>
      <div className="mx-auto max-w-7xl">
        <div className="space-y-8">
          <div>
            <h2 className="mb-2 text-3xl font-bold text-foreground">
              Global Analysis History
            </h2>
            <p className="text-muted-foreground">
              Platform-wide analysis visibility across all tenants.
            </p>
          </div>

          <Card className="overflow-hidden border border-border bg-card">
            <div className="p-6">
              <AdminGlobalLogsTable />
            </div>
          </Card>
        </div>
      </div>
    </AdminShell>
  );
}

export default function AdminHistoryPage() {
  return (
    <AdminGuard>
      <AdminHistoryPageContent />
    </AdminGuard>
  );
}
