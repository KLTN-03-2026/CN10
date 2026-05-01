"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getGitHubAuthUrl } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";

/**
 * ARCHITECTURE PATTERN: Suspense Boundary for useSearchParams()
 * ============================================================
 * In Next.js 14 App Router, components using useSearchParams() MUST be wrapped
 * in a <Suspense> boundary to prevent hydration mismatches and SSR incompatibility.
 *
 * This file uses a two-layer pattern:
 * 1. LoginPage (default export) - Thin wrapper providing Suspense + fallback
 * 2. LoginContent (inner component) - Contains all hooks and business logic
 */

/**
 * Inner Component: Contains useSearchParams, useRouter, and all business logic
 * This is wrapped in <Suspense> by the outer LoginPage component
 */
function LoginContent() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const authError = searchParams.get("error");

  // Redirect authenticated users based on role.
  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) {
      return;
    }

    const targetPath = user?.role === "ADMIN" ? "/admin" : "/dashboard";
    console.log(
      `✅ Existing session detected, redirecting to ${targetPath}...`,
    );
    router.push(targetPath);
  }, [router, user, isAuthenticated, isAuthLoading]);

  // ✅ Handle GitHub OAuth login initiation
  const handleGitHubLogin = () => {
    try {
      setIsLoading(true);

      // Get GitHub OAuth authorization URL with CSRF protection
      const authURL = getGitHubAuthUrl();

      console.log("🔐 Redirecting to GitHub OAuth authorization...");

      // Redirect to GitHub for authorization
      window.location.href = authURL;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to initiate GitHub authentication";
      console.error("❌ GitHub auth error:", errorMessage);

      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });

      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-background px-3 py-6 sm:px-4 sm:py-8 md:px-6">
      {/* Animated terminal code background pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,0,0,.2)_25%,rgba(255,0,0,.2)_50%,transparent_50%,transparent_75%,rgba(255,0,0,.2)_75%,rgba(255,0,0,.2))] bg-[length:40px_40px]"></div>
      </div>

      {/* Terminal code overlay background */}
      <svg
        className="pointer-events-none absolute inset-0 hidden h-full w-full opacity-3 sm:block"
        viewBox="0 0 1200 600"
      >
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="rgba(59, 130, 246, 0.5)"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="1200" height="600" fill="url(#grid)" />
        <text
          x="50"
          y="100"
          className="text-xs font-mono fill-blue-500/30"
          fontSize="11"
        >
          {"> npm run build"}
        </text>
        <text
          x="50"
          y="150"
          className="text-xs font-mono fill-green-500/30"
          fontSize="11"
        >
          {"✓ Build successful"}
        </text>
        <text
          x="50"
          y="200"
          className="text-xs font-mono fill-blue-500/30"
          fontSize="11"
        >
          {"> github.auth.connect()"}
        </text>
        <text
          x="50"
          y="250"
          className="text-xs font-mono fill-cyan-500/30"
          fontSize="11"
        >
          {"→ Validating credentials..."}
        </text>
      </svg>

      {/* Main content container */}
      <div className="relative z-10 w-full max-w-[94vw] sm:max-w-md md:max-w-lg">
        {/* Logo/Header */}
        <div className="mb-8 text-center sm:mb-10 md:mb-12">
          <div className="mb-3 inline-flex items-center justify-center gap-2 sm:mb-4 sm:gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/25 sm:h-12 sm:w-12">
              <svg
                className="h-6 w-6 text-white sm:h-7 sm:w-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-foreground sm:text-3xl md:text-4xl">
            AI CI/CD Analyzer
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm md:text-base">
            Debug GitHub Actions in seconds with AI-powered insights
          </p>
        </div>

        {/* Error Alert - shown if OAuth callback fails */}
        {authError && (
          <div className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 sm:mb-6 sm:p-4">
            <div className="flex items-start gap-2 sm:gap-3">
              <svg
                className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive sm:h-5 sm:w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="mb-1 text-sm font-medium text-destructive">
                  Authentication Error
                </p>
                <p className="break-words text-xs text-destructive/80">
                  {decodeURIComponent(authError)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Glass-morphism card */}
        <div className="group relative">
          {/* Gradient border effect */}
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-blue-500/50 to-cyan-500/50 opacity-0 blur transition-opacity duration-500 group-hover:opacity-100"></div>

          {/* Main card */}
          <div className="relative rounded-2xl border border-blue-500/20 bg-card/40 p-4 shadow-2xl backdrop-blur-xl sm:p-6 md:p-8">
            <div className="space-y-5 sm:space-y-6">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-foreground sm:text-xl md:text-2xl">
                  Secure Authentication
                </h2>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  Connect with your GitHub account
                </p>
              </div>

              {/* GitHub Login Button - Initiates OAuth Flow */}
              <button
                onClick={handleGitHubLogin}
                disabled={isLoading}
                className="group/btn relative inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:scale-[1.01] hover:from-blue-500 hover:to-blue-600 hover:shadow-xl hover:shadow-blue-500/50 active:scale-95 disabled:from-gray-600 disabled:to-gray-700 sm:gap-3 sm:px-6 sm:py-4 sm:text-base md:hover:scale-105"
              >
                {/* GitHub Icon */}
                <svg
                  className="h-4 w-4 sm:h-5 sm:w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.545 2.914 1.209.1-.957.349-1.546.635-1.903-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.578 9.578 0 0112 6.836c.85.005 1.705.114 2.504.336 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482 3.970-1.316 6.833-5.073 6.833-9.488C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                {isLoading ? (
                  <>
                    <span className="inline-block animate-spin mr-2">⏳</span>
                    Connecting...
                  </>
                ) : (
                  "Continue with GitHub"
                )}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/40"></div>
                </div>
                <div className="relative flex justify-center text-[11px] sm:text-xs">
                  <span className="bg-card/40 px-2 text-muted-foreground">
                    OAuth 2.0 Authorization Code Flow
                  </span>
                </div>
              </div>

              {/* Security Features Info */}
              <div className="space-y-2 text-[11px] text-muted-foreground sm:text-xs">
                <div className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500/60"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>GitHub token never exposed to frontend</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500/60"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>CSRF protection with state token</span>
                </div>
                <div className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500/60"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Secure JWT session with 7-day expiry</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <p className="mt-6 text-center text-[11px] text-muted-foreground sm:mt-8 sm:text-xs">
          By signing in, you agree to our{" "}
          <span className="text-cyan-400 hover:text-cyan-300 cursor-pointer">
            Terms of Service
          </span>{" "}
          and{" "}
          <span className="text-cyan-400 hover:text-cyan-300 cursor-pointer">
            Privacy Policy
          </span>
        </p>
      </div>
    </div>
  );
}

/**
 * Outer Component: Provides Suspense boundary for dynamic routes
 * This is the default export and ensures useSearchParams() works safely
 */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="text-center space-y-4">
            <div className="inline-block animate-spin">⏳</div>
            <p className="text-muted-foreground">Loading authentication...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
