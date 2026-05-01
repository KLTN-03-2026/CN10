"use client";

import { useEffect, useState } from "react";
import { AdminGuard } from "@/lib/protected-route";
import { AdminShell } from "@/components/admin-shell";
import { adminApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

type FinanceState = {
  monthlyPriceUsd: number;
  proUsers: number;
  totalUsers: number;
  totalProfitUsd: number;
};

function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function AdminFinancePageContent() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [finance, setFinance] = useState<FinanceState | null>(null);

  useEffect(() => {
    const loadFinance = async () => {
      try {
        setLoading(true);
        const summary = await adminApi.getFinanceSummary();
        setFinance(summary as FinanceState);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to load finance data";
        toast({
          title: "Load Failed",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadFinance();
  }, [toast]);

  return (
    <AdminShell>
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Finance Dashboard</h2>
        <p className="text-sm text-slate-400">
          Revenue snapshot based on current PRO subscriptions.
        </p>

        {loading ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
            Loading finance summary...
          </div>
        ) : !finance ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center text-sm text-slate-400">
            No finance data available.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <article className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                PRO Users
              </p>
              <p className="mt-2 text-3xl font-bold text-white">
                {finance.proUsers}
              </p>
            </article>

            <article className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Monthly Price
              </p>
              <p className="mt-2 text-3xl font-bold text-white">
                {formatUsd(finance.monthlyPriceUsd)}
              </p>
            </article>

            <article className="rounded-xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-xs uppercase tracking-wide text-slate-400">
                Total Profit
              </p>
              <p className="mt-2 text-3xl font-bold text-emerald-300">
                {formatUsd(finance.totalProfitUsd)}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Based on {finance.proUsers} PRO out of {finance.totalUsers}{" "}
                users
              </p>
            </article>
          </div>
        )}
      </section>
    </AdminShell>
  );
}

export default function AdminFinancePage() {
  return (
    <AdminGuard>
      <AdminFinancePageContent />
    </AdminGuard>
  );
}
