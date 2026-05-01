/**
 * GitHub OAuth Configuration
 * Server-Side Authorization Code Flow (Secure)
 */

import { getGitHubAuthUrl, authApi } from "./api-client";
import { consumeOAuthTransaction } from "./api-client";

// 1. ĐỊNH NGHĨA INTERFACE ĐỂ DẬP TẮT LỖI TYPESCRIPT
export interface AuthResponse {
  success: boolean;
  user?: any;
  error?: string;
  debug?: {
    status?: number;
    data?: unknown;
    details?: unknown;
    reason?: string;
  };
}

export const GITHUB_OAUTH_CONFIG = {
  CLIENT_ID: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || "",
  REDIRECT_URI: `${typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
  SCOPE: "user:email repo",
  STATE_LENGTH: 32,
};

/**
 * Format GitHub OAuth authorization URL
 */
export const getGitHubOAuthURL = getGitHubAuthUrl;

/**
 * Generate random state token for CSRF protection
 */
export function generateRandomState(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Exchange GitHub authorization code for JWT token
 * Trả về đúng định dạng AuthResponse mà Frontend đang chờ đợi
 */
export const exchangeCodeForToken = async (
  code: string,
  state: string,
): Promise<AuthResponse> => {
  try {
    if (!code) {
      return { success: false, error: "Authorization code is required" };
    }

    const bypassStateValidation =
      process.env.NEXT_PUBLIC_OAUTH_BYPASS_STATE_CHECK === "true";

    const savedTxRaw =
      typeof window !== "undefined"
        ? window.sessionStorage.getItem("oauth:github:tx")
        : null;
    let savedState = "";
    if (savedTxRaw) {
      try {
        const parsed = JSON.parse(savedTxRaw) as { state?: string };
        savedState = typeof parsed?.state === "string" ? parsed.state : "";
      } catch {
        savedState = "";
      }
    }

    console.log("[OAuth Exchange] State check context", {
      savedState,
      urlState: state,
      matches: savedState.length > 0 && savedState === state,
      hasSavedState: savedState.length > 0,
      hasUrlState: state.length > 0,
    });

    if (!bypassStateValidation && !validateOAuthState(state)) {
      console.error("[OAuth Exchange] State validation failed", {
        savedState,
        urlState: state,
        stateMatch: savedState.length > 0 && savedState === state,
        stateLength: state.length,
      });
      return {
        success: false,
        error: "Invalid OAuth state - possible CSRF attack",
        debug: {
          reason: "STATE_VALIDATION_FAILED",
        },
      };
    }

    if (bypassStateValidation) {
      console.warn(
        "[OAuth Exchange] State validation is temporarily bypassed for debugging",
      );
    }

    console.log("[OAuth Exchange] Sending code to backend callback endpoint", {
      endpoint: "/api/auth/github/callback",
      codeLength: code.length,
      stateLength: state.length,
      bypassStateValidation,
    });

    // Gọi api-client, backend sẽ set HttpOnly cookie và trả user profile.
    const data = await authApi.handleCallback(code, state);

    // Gói lại thành object có 'success' để UI không bị báo lỗi đỏ
    return {
      success: true,
      user: data.user,
    };
  } catch (err: any) {
    const backendStatus =
      typeof err?.status === "number" ? err.status : undefined;
    const backendData = err?.data;
    const backendDetails =
      (backendData as any)?.details || (backendData as any)?.error || undefined;

    console.error("[OAuth Exchange] Backend callback failed", {
      status: backendStatus,
      data: backendData,
      details: backendDetails,
      message: err?.message,
      rawError: err,
    });

    return {
      success: false,
      error:
        (backendData as any)?.error ||
        (backendData as any)?.message ||
        err.message ||
        err.response?.data?.error ||
        "Authentication failed on server",
      debug: {
        status: backendStatus,
        data: backendData,
        details: backendDetails,
      },
    };
  }
};

/**
 * Verify and validate OAuth state (CSRF protection)
 */
export const validateOAuthState = (state: string): boolean => {
  const result = consumeOAuthTransaction(state);
  return result.valid;
};
