"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/lib/protected-route";
import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { paymentApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { refreshUser } = useAuth();
  const [isVerifying, setIsVerifying] = useState(false);

  const handleCompleteDemoPayment = async () => {
    try {
      setIsVerifying(true);
      const result = await paymentApi.demoCheckout();
      await refreshUser();
      toast({
        title: "Upgrade Successful",
        description:
          result.message || "Your account has been upgraded to PRO (Demo Mode).",
      });
      router.push(result.redirectUrl || "/dashboard");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to verify payment";
      toast({
        title: "Verification Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <DashboardHeader />
        <main className="mx-auto max-w-5xl px-6 py-12">
          <div className="grid gap-8 md:grid-cols-2">
            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h1 className="text-3xl font-bold">Checkout</h1>
              <p className="mt-2 text-sm text-slate-400">
                Demo payment flow for thesis presentation.
              </p>

              <div className="mt-6 rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-sm text-blue-100">
                Plan: <strong>PRO</strong>
                <br />
                Billing: <strong>One-time demo transfer</strong>
              </div>

              <ul className="mt-6 space-y-2 text-sm text-slate-300">
                <li>Unlimited analyses</li>
                <li>Gemini Pro model selection</li>
                <li>Priority troubleshooting quality</li>
              </ul>

              <Button
                onClick={handleCompleteDemoPayment}
                disabled={isVerifying}
                className="mt-8 w-full bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {isVerifying
                  ? "Completing Demo Payment..."
                  : "Complete Demo Payment"}
              </Button>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="text-xl font-semibold">Scan Bank QR</h2>
              <p className="mt-2 text-sm text-slate-400">
                Use any banking app to simulate payment, then click the verify
                button.
              </p>
              <div className="mt-6 flex justify-center rounded-xl border border-slate-700 bg-white p-4">
                <Image
                  src="/bank-qr-demo.svg"
                  alt="Demo bank QR code"
                  width={280}
                  height={280}
                  priority
                />
              </div>
            </section>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
