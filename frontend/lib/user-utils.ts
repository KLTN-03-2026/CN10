/**
 * User Profile Utilities
 * Single source of truth for user data normalization across the application.
 * Used by both api-client.ts (API responses) and auth-context.tsx (session state).
 *
 * @module user-utils
 */

/**
 * Canonical user profile shape used throughout the frontend application.
 * ADMIN users omit client-specific fields (tier, analyzeCount, etc.).
 */
export interface UserProfile {
  id: string;
  username: string;
  avatar?: string;
  role: "USER" | "ADMIN";
  tier?: "FREE" | "PRO";
  analyzeCount?: number;
  lastResetDate?: string;
  isFirstLogin?: boolean;
  githubId?: string;
  hasCustomGeminiKey?: boolean;
}

/**
 * Normalize a raw user payload into a strongly-typed UserProfile.
 *
 * Handles:
 * - Missing or malformed fields with safe defaults
 * - ADMIN users always omit client-only fields (tier, analyzeCount, etc.)
 * - USER role gets full client metadata (tier, BYOK status, weekly count)
 *
 * @param raw - Untyped payload from API response or auth callback
 * @returns Normalized UserProfile with sensible defaults for missing fields
 */
export function normalizeUserProfile(raw: unknown): UserProfile {
  // Provide sensible defaults for invalid/empty input
  if (!raw || typeof raw !== "object") {
    return {
      id: "",
      username: "GitHub User",
      role: "USER",
      tier: "FREE",
      analyzeCount: 0,
    };
  }

  const payload = raw as Record<string, unknown>;

  const role = payload.role === "ADMIN" ? "ADMIN" : "USER";
  const username =
    typeof payload.username === "string" && payload.username.trim().length > 0
      ? payload.username.trim()
      : "GitHub User";
  const id =
    typeof payload.id === "string" && payload.id.trim().length > 0
      ? payload.id
      : "";

  const normalized: UserProfile = {
    id,
    username,
    role,
  };

  if (typeof payload.avatar === "string" && payload.avatar.trim().length > 0) {
    normalized.avatar = payload.avatar;
  }

  if (
    typeof payload.githubId === "string" &&
    payload.githubId.trim().length > 0
  ) {
    normalized.githubId = payload.githubId;
  }

  if (role === "USER") {
    normalized.tier = payload.tier === "PRO" ? "PRO" : "FREE";
    normalized.isFirstLogin = payload.isFirstLogin === true;
    normalized.hasCustomGeminiKey = payload.hasCustomGeminiKey === true;
    normalized.analyzeCount =
      typeof payload.analyzeCount === "number" &&
      Number.isFinite(payload.analyzeCount)
        ? Math.max(0, Math.floor(payload.analyzeCount))
        : 0;

    if (
      typeof payload.lastResetDate === "string" &&
      payload.lastResetDate.trim().length > 0
    ) {
      normalized.lastResetDate = payload.lastResetDate;
    }
  }

  return normalized;
}
