"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import { AdminSidebar } from "@/components/admin-sidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <DashboardHeader />
      <div className="flex h-[calc(100vh-64px)] overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto bg-slate-950 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
