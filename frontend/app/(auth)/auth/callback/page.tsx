"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { exchangeCodeForToken } from "@/lib/github-oauth";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";

/**
 * OAuth Callback Handler Page
 * GitHub redirects here with ?code=xxx&state=xxx
 * This page exchanges the code for a JWT token via secure backend flow
 */
function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { setSession } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const getNextRoute = (nextUser?: { role?: string }) => {
    if (nextUser?.role === "ADMIN") {
      return "/admin";
    }

    return "/dashboard";
  };

  useEffect(() => {
    if (hasFetched.current) {
      return;
    }
    hasFetched.current = true;

    const authenticate = async () => {
      let callbackInflightKey = "";
      let code = "";
      let state = "";
      let errorParam = "";

      try {
        // Extract code and state from URL
        code = searchParams.get("code") || "";
        state = searchParams.get("state") || "";
        errorParam = searchParams.get("error") || "";

        console.log("[OAuth Callback] URL params extracted", {
          hasCode: Boolean(code),
          hasState: Boolean(state),
          codeLength: code.length,
          stateLength: state.length,
          errorParam,
        });

        // Guard against duplicate callback processing (Strict Mode / refresh).
        const callbackFingerprint = `${code || "no-code"}:${state || "no-state"}`;
        const callbackProcessedKey = `oauth:callback:processed:${callbackFingerprint}`;
        callbackInflightKey = `oauth:callback:inflight:${callbackFingerprint}`;
        const callbackRouteKey = `oauth:callback:route:${callbackFingerprint}`;

        if (sessionStorage.getItem(callbackProcessedKey) === "1") {
          const previousRoute = sessionStorage.getItem(callbackRouteKey);
          router.replace(previousRoute === "/admin" ? "/admin" : "/dashboard");
          return;
        }

        if (sessionStorage.getItem(callbackInflightKey) === "1") {
          return;
        }

        sessionStorage.setItem(callbackInflightKey, "1");

        // Handle GitHub error response
        if (errorParam) {
          const errorDescription =
            searchParams.get("error_description") || "Authentication denied";
          throw new Error(errorDescription);
        }

        // Validate code is present
        if (!code) {
          throw new Error("No authorization code received from GitHub");
        }

        // Validate state token (CSRF protection)
        if (!state) {
          throw new Error("No state parameter received from GitHub");
        }

        console.log("🔐 Exchanging code for JWT token...");

        // Exchange code for JWT token (backend verifies everything)
        const response = await exchangeCodeForToken(code, state);

        console.log("[OAuth Callback] Exchange response received", {
          success: response.success,
          hasUser: Boolean(response.user),
          error: response.error,
          debug: response.debug,
        });

        if (!response.success) {
          throw new Error(response.error || "Authentication failed");
        }

        if (!response.user) {
          throw new Error("Invalid authentication response");
        }

        // Cookie is already set by backend; context stores user profile only.
        setSession(response.user);

        console.log("✅ Authentication successful!");
        toast({
          title: "Success",
          description: `Welcome, ${response.user?.username}!`,
        });

        const nextRoute = getNextRoute(response.user);

        sessionStorage.setItem(callbackProcessedKey, "1");
        sessionStorage.setItem(callbackRouteKey, nextRoute);
        sessionStorage.removeItem(callbackInflightKey);

        // Delay slightly for UX continuity before redirect.
        setTimeout(() => {
          router.replace(nextRoute);
        }, 500);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Authentication failed";
        console.error("❌ Authentication error (verbose):", {
          message: errorMessage,
          rawError: err,
          callbackContext: {
            hasCode: Boolean(code),
            hasState: Boolean(state),
            codeLength: code.length,
            stateLength: state.length,
            errorParam,
          },
        });
        setError(errorMessage);
        setIsAuthenticating(false);
        sessionStorage.removeItem(callbackInflightKey);

        toast({
          title: "Authentication Failed",
          description: errorMessage,
          variant: "destructive",
        });

        // Redirect back to login after showing error
        setTimeout(() => {
          router.replace(
            "/auth/login?error=" + encodeURIComponent(errorMessage),
          );
        }, 2000);
      }
    };

    authenticate();
  }, [searchParams, router, toast, setSession]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {isAuthenticating && !error && (
          <>
            {/* Loading Animation */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Authenticating...
                </h1>
                <p className="text-muted-foreground">
                  Verifying your GitHub credentials securely. Please wait.
                </p>
              </div>
            </div>

            {/* Loading steps indicator */}
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary/40 animate-pulse"></div>
                <span>Validating authorization code...</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div
                  className="w-1 h-1 rounded-full bg-primary/40 animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <span>Exchanging for access token...</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <div
                  className="w-1 h-1 rounded-full bg-primary/40 animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                ></div>
                <span>Creating secure session...</span>
              </div>
            </div>
          </>
        )}

        {error && (
          <>
            {/* Error State */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-destructive"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Authentication Failed
                </h1>
                <p className="text-destructive/80 mb-4">{error}</p>
                <p className="text-sm text-muted-foreground">
                  Redirecting back to login...
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Security info footer */}
      <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto">
        <p className="text-xs text-muted-foreground text-center">
          🔒 Your credentials are processed securely on our backend using
          industry-standard OAuth 2.0 Authorization Code Flow
        </p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
