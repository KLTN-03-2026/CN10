"use client";

import { useRouter } from "next/navigation";
import { AuthGuard } from "@/lib/protected-route";
import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";

const freeFeatures = [
  "5 CI/CD Analyses per week",
  "Standard System AI Model",
  "Basic RAG Context",
  "Community Support",
];

const proFeatures = [
  "Unlimited CI/CD Analyses",
  "Bring Your Own Key (BYOK) Integration",
  "Advanced Root-Cause Reasoning",
  "Priority DevSecOps Support",
];

export default function UpgradePage() {
  const router = useRouter();

  const handleSkipForNow = () => {
    sessionStorage.setItem("hasSeenUpgrade", "true");
    router.push("/dashboard");
  };

  const handleUpgradeNow = () => {
    console.log("Redirect to payment");
    router.push("/checkout");
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <DashboardHeader />
        <main className="mx-auto max-w-6xl px-6 py-12">
          <section className="mb-10 text-center">
            <p className="inline-flex rounded-full border border-blue-500/40 bg-blue-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-200">
              Pricing Upgrade
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Compare Plans and Unlock PRO Value
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-slate-400">
              Keep using FREE with limits, or upgrade to PRO for unlimited
              analysis power, BYOK integration, and faster DevSecOps support.
            </p>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-7 shadow-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-slate-100">FREE</h2>
                <span className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300">
                  Current
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                Good for basic usage and small CI/CD debugging needs.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                {freeFeatures.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button
                variant="outline"
                onClick={handleSkipForNow}
                className="mt-8 w-full border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800"
              >
                Continue with Free
              </Button>
            </article>

            <article className="relative rounded-2xl border border-blue-400/70 bg-gradient-to-b from-blue-500/20 to-slate-900 p-7 shadow-2xl shadow-blue-900/30">
              <span className="absolute -top-3 right-6 rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                Most Popular
              </span>
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-blue-100">PRO</h2>
                <span className="rounded-full border border-blue-300/50 px-3 py-1 text-xs text-blue-100">
                  Recommended
                </span>
              </div>
              <p className="mt-2 text-sm text-blue-100/80">
                Built for serious teams and production-grade CI/CD operations.
              </p>

              <ul className="mt-6 space-y-3 text-sm text-slate-100">
                {proFeatures.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-300" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button
                onClick={handleUpgradeNow}
                className="mt-8 w-full bg-blue-600 text-white hover:bg-blue-500"
              >
                Upgrade Now
              </Button>
            </article>
          </section>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={handleSkipForNow}
              className="text-sm text-slate-400 underline decoration-slate-600 underline-offset-4 transition hover:text-slate-200"
            >
              Skip for now
            </button>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
