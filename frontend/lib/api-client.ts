/**
 * API Client Utility
 * Centralized API communication with proper error handling and type safety
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const OAUTH_TRANSACTION_KEY = "oauth:github:tx";
const OAUTH_TRANSACTION_TTL_MS = 10 * 60 * 1000;

interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface AuthResponse {
  success: boolean;
  user: {
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
  };
}

interface UserProfile {
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

interface ProfileApiResponse {
  success: boolean;
  user: UserProfile;
}

function normalizeUserProfile(raw: unknown): UserProfile {
  const payload = (raw || {}) as Record<string, unknown>;

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

interface UpdateSettingsResponse {
  success: boolean;
  user: UserProfile;
}

export interface AnalysisResult {
  _id: string;
  userId:
    | string
    | {
        _id: string;
        username: string;
        githubId: string;
        avatar?: string;
        role: "USER" | "ADMIN";
      };
  repoFullName: string;
  runId: string;
  branchName?: string;
  prNumber?: number | null;
  rawErrorSnippet: string;
  aiResult: {
    rootCause: string;
    suggestedFix: string;
  };
  severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  prUrl?: string;
  status: "PENDING" | "COMPLETED" | "PR_CREATED" | "FAILED";
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

interface AnalysisJobSubmissionResponse {
  success: boolean;
  jobId: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  message?: string;
}

interface AnalysisJobStatusResponse {
  success: boolean;
  jobId: string;
  status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED";
  result?: AnalysisResult;
  errorMessage?: string;
  message?: string;
}

interface AnalysisHistoryResponse {
  analyses: AnalysisResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface AdminStatsResponse {
  users: number;
  admins: number;
  totalAnalyses: number;
  analysesByStatus: {
    PENDING?: number;
    COMPLETED?: number;
    PR_CREATED?: number;
    FAILED?: number;
  };
}

interface AdminLogsResponse {
  logs: AnalysisResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface AdminUser {
  id: string;
  username: string;
  githubId: string;
  avatar?: string;
  role: "USER" | "ADMIN";
  tier: "FREE" | "PRO";
  createdAt: string;
  updatedAt: string;
}

interface FinanceSummaryResponse {
  success: boolean;
  finance: {
    monthlyPriceUsd: number;
    proUsers: number;
    totalUsers: number;
    totalProfitUsd: number;
  };
}

interface AdminUsersResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface AdminFeedback {
  _id: string;
  userId: {
    _id: string;
    username: string;
    githubId: string;
    avatar?: string;
    role: "USER" | "ADMIN";
  };
  message: string;
  status: "PENDING" | "RESOLVED";
  adminReply?: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminFeedbacksResponse {
  feedbacks: AdminFeedback[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface SyncKnowledgeResponse {
  success: boolean;
  message: string;
  syncedCount: number;
}

interface MockPaymentVerifyResponse {
  success: boolean;
  message: string;
  user: UserProfile;
  redirectUrl?: string;
}

interface FeedbackNotificationItem {
  _id: string;
  message: string;
  adminReply: string;
  createdAt: string;
  updatedAt: string;
}

interface FeedbackNotificationResponse {
  success: boolean;
  notifications: FeedbackNotificationItem[];
  unreadCount: number;
}

/**
 * Make API request with error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_URL}${endpoint}`;
    const headers = new Headers(options.headers || {});

    // Add content type if not set
    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    const contentType = response.headers.get("content-type");
    let data;

    if (contentType?.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw {
        message: data?.error || data?.message || "API request failed",
        status: response.status,
        data,
      };
    }

    return {
      success: true,
      data: data as T,
      ...data,
    };
  } catch (error: any) {
    const errorData = error?.data;
    const errorMessage =
      errorData?.message ||
      errorData?.error ||
      error?.message ||
      "Unknown Server Error";

    console.error("API Error Detail:", errorMessage, errorData);

    throw {
      message: errorMessage,
      status: error?.status || 500,
      data: errorData,
    } as ApiError;
  }
}

/**
 * Auth API methods
 */
export const authApi = {
  /**
   * Exchange GitHub authorization code for JWT token
   */
  async handleCallback(code: string, state: string): Promise<AuthResponse> {
    const response = await apiRequest<AuthResponse>(
      "/api/auth/github/callback",
      {
        method: "POST",
        body: JSON.stringify({ code, state }),
      },
    );
    const payload = response.data as AuthResponse;
    return {
      ...payload,
      user: normalizeUserProfile(payload?.user),
    };
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile> {
    const response = await apiRequest<ProfileApiResponse>("/api/auth/profile");
    const payload = response.data as ProfileApiResponse;
    return normalizeUserProfile(payload?.user || payload);
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await apiRequest<{ success: boolean }>("/api/auth/logout", {
      method: "POST",
    });
  },
};

/**
 * Analysis API methods
 */
export const analysisApi = {
  /**
   * Analyze a workflow
   */
  async analyzeWorkflow(
    repoUrl: string,
    workflowRunId: string,
  ): Promise<AnalysisJobSubmissionResponse> {
    const response = await apiRequest<AnalysisJobSubmissionResponse>(
      "/api/analysis/analyze",
      {
        method: "POST",
        body: JSON.stringify({ repoUrl, workflowRunId }),
      },
    );
    return response.data as AnalysisJobSubmissionResponse;
  },

  /**
   * Get analysis job status by job id.
   */
  async getAnalysisStatus(jobId: string): Promise<AnalysisJobStatusResponse> {
    const response = await apiRequest<AnalysisJobStatusResponse>(
      `/api/analysis/${jobId}/status`,
    );
    return response.data as AnalysisJobStatusResponse;
  },

  /**
   * Create Auto-Fix PR
   */
  async createAutoFixPr(
    analysisId: string,
    filePath: string,
  ): Promise<AnalysisResult> {
    const response = await apiRequest<AnalysisResult>(
      `/api/analysis/auto-fix`,
      {
        method: "POST",
        body: JSON.stringify({ analysisId, filePath }),
      },
    );
    return response.data as AnalysisResult;
  },

  /**
   * Create an Auto-Fix PR using only the analysis id.
   * Keeps the existing analyzer UI working while the PR flow remains based
   * on the stored analysis record.
   */
  async createAutoFixPrById(
    analysisId: string,
  ): Promise<{ success: boolean; prUrl?: string }> {
    const response = await apiRequest<{ success: boolean; prUrl?: string }>(
      `/api/analysis/${analysisId}/create-pr`,
      {
        method: "POST",
      },
    );
    return response.data as { success: boolean; prUrl?: string };
  },

  /**
   * Get analysis history for current user
   */
  async getHistory(
    page: number = 1,
    limit: number = 10,
  ): Promise<AnalysisHistoryResponse> {
    const response = await apiRequest<AnalysisHistoryResponse>(
      `/api/analysis/history?page=${page}&limit=${limit}`,
    );
    return response.data as AnalysisHistoryResponse;
  },
};

/**
 * Admin API methods
 */
export const adminApi = {
  /**
   * Get system statistics
   */
  async getStats(): Promise<AdminStatsResponse> {
    const response = await apiRequest<AdminStatsResponse>("/api/admin/stats");
    return response.data as AdminStatsResponse;
  },

  /**
   * Get global logs (all analyses)
   */
  async getLogs(
    page: number = 1,
    limit: number = 20,
    status?: string,
  ): Promise<AdminLogsResponse> {
    const query = new URLSearchParams();
    query.append("page", page.toString());
    query.append("limit", limit.toString());
    if (status) query.append("status", status);

    const response = await apiRequest<AdminLogsResponse>(
      `/api/admin/logs?${query}`,
    );
    return response.data as AdminLogsResponse;
  },

  /**
   * Get audit logs for specific user
   */
  async getAuditLogs(
    userId: string,
    page: number = 1,
  ): Promise<AnalysisResult[]> {
    const response = await apiRequest<AnalysisResult[]>(
      `/api/admin/audit-logs/${userId}?page=${page}`,
    );
    return response.data as AnalysisResult[];
  },

  /**
   * Get paginated users for admin management
   */
  async getUsers(
    page: number = 1,
    limit: number = 20,
  ): Promise<AdminUsersResponse> {
    const response = await apiRequest<AdminUsersResponse>(
      `/api/admin/users?page=${page}&limit=${limit}`,
    );
    return response.data as AdminUsersResponse;
  },

  /**
   * Update a user's role
   */
  async updateUserRole(
    userId: string,
    role: "USER" | "ADMIN",
  ): Promise<AdminUser> {
    const response = await apiRequest<{ user: AdminUser }>(
      `/api/admin/users/${userId}/role`,
      {
        method: "PUT",
        body: JSON.stringify({ role }),
      },
    );

    const payload = response.data as { user: AdminUser };
    return payload.user;
  },

  async updateUserAccess(
    userId: string,
    role: "USER" | "ADMIN",
    tier: "FREE" | "PRO",
  ): Promise<AdminUser> {
    const response = await apiRequest<{ user: AdminUser }>(
      `/api/admin/users/${userId}/access`,
      {
        method: "PUT",
        body: JSON.stringify({ role, tier }),
      },
    );

    const payload = response.data as { user: AdminUser };
    return payload.user;
  },

  async getFinanceSummary(): Promise<FinanceSummaryResponse["finance"]> {
    const response = await apiRequest<FinanceSummaryResponse>(
      "/api/admin/finance/summary",
    );
    const payload = response.data as FinanceSummaryResponse;
    return payload.finance;
  },

  /**
   * Get feedback queue
   */
  async getFeedbacks(
    page: number = 1,
    limit: number = 20,
  ): Promise<AdminFeedbacksResponse> {
    const response = await apiRequest<AdminFeedbacksResponse>(
      `/api/admin/feedbacks?page=${page}&limit=${limit}`,
    );
    return response.data as AdminFeedbacksResponse;
  },

  /**
   * Resolve feedback with optional admin reply
   */
  async resolveFeedback(
    feedbackId: string,
    adminReply: string,
  ): Promise<AdminFeedback> {
    const response = await apiRequest<{ feedback: AdminFeedback }>(
      `/api/admin/feedbacks/${feedbackId}/resolve`,
      {
        method: "PUT",
        body: JSON.stringify({ adminReply }),
      },
    );

    const payload = response.data as { feedback: AdminFeedback };
    return payload.feedback;
  },

  /**
   * Trigger AI knowledge synchronization
   */
  async syncKnowledge(): Promise<SyncKnowledgeResponse> {
    const response = await apiRequest<SyncKnowledgeResponse>(
      "/api/admin/ai/sync-knowledge",
      {
        method: "POST",
      },
    );
    return response.data as SyncKnowledgeResponse;
  },
};

/**
 * User API methods
 */
export const userApi = {
  /**
   * Update current user settings
   */
  async updateSettings(username: string): Promise<UserProfile> {
    const response = await apiRequest<UpdateSettingsResponse>(
      "/api/users/settings",
      {
        method: "PUT",
        body: JSON.stringify({ username }),
      },
    );

    const payload = response.data as UpdateSettingsResponse;
    return payload.user;
  },

  async updateByok(
    geminiApiKey: string,
  ): Promise<{ hasCustomGeminiKey: boolean }> {
    const response = await apiRequest<{ hasCustomGeminiKey: boolean }>(
      "/api/users/byok",
      {
        method: "PUT",
        body: JSON.stringify({ geminiApiKey }),
      },
    );

    const payload = response.data as { hasCustomGeminiKey: boolean };
    return payload;
  },

  async clearByok(): Promise<{ hasCustomGeminiKey: boolean }> {
    const response = await apiRequest<{ hasCustomGeminiKey: boolean }>(
      "/api/users/byok",
      {
        method: "PUT",
        body: JSON.stringify({ clear: true }),
      },
    );

    const payload = response.data as { hasCustomGeminiKey: boolean };
    return payload;
  },
};

export const paymentApi = {
  async mockVerify(): Promise<MockPaymentVerifyResponse> {
    const response = await apiRequest<MockPaymentVerifyResponse>(
      "/api/payment/mock-verify",
      {
        method: "POST",
      },
    );
    return response.data as MockPaymentVerifyResponse;
  },
};

export const feedbackApi = {
  async getNotifications(): Promise<FeedbackNotificationResponse> {
    const response = await apiRequest<FeedbackNotificationResponse>(
      "/api/feedback/notifications",
    );
    return response.data as FeedbackNotificationResponse;
  },

  async markAsRead(feedbackId: string): Promise<void> {
    await apiRequest<{ success: boolean }>(`/api/feedback/${feedbackId}/read`, {
      method: "PUT",
    });
  },
};

/**
 * Utility function to build API URL
 */
export function buildApiUrl(endpoint: string): string {
  return `${API_URL}${endpoint}`;
}

interface OAuthTransaction {
  state: string;
  createdAt: number;
}

function generateSecureState(size: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const randomValues = new Uint8Array(size);
    window.crypto.getRandomValues(randomValues);
    return Array.from(
      randomValues,
      (value) => chars[value % chars.length],
    ).join("");
  }

  return Array.from({ length: size }, () => {
    return chars[Math.floor(Math.random() * chars.length)];
  }).join("");
}

export function createOAuthTransaction(): string {
  const state = generateSecureState();

  if (typeof window !== "undefined") {
    resetOAuthRuntimeState();

    const payload: OAuthTransaction = {
      state,
      createdAt: Date.now(),
    };

    const serialized = JSON.stringify(payload);

    // Keep a single source of truth and write aliases for backward compatibility.
    sessionStorage.setItem(OAUTH_TRANSACTION_KEY, serialized);
    sessionStorage.setItem("oauthState", state);
    localStorage.setItem("oauth_state", state);
  }

  return state;
}

export function resetOAuthRuntimeState(): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(OAUTH_TRANSACTION_KEY);
  sessionStorage.removeItem("oauthState");
  localStorage.removeItem("oauth_state");

  // Remove stale callback locks from previous attempts.
  const keysToDelete: string[] = [];
  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index);
    if (
      key &&
      (key.startsWith("oauth:callback:processed:") ||
        key.startsWith("oauth:callback:inflight:"))
    ) {
      keysToDelete.push(key);
    }
  }

  keysToDelete.forEach((key) => sessionStorage.removeItem(key));
}

export function consumeOAuthTransaction(candidateState: string): {
  valid: boolean;
  reason?: string;
} {
  if (typeof window === "undefined") {
    return { valid: true };
  }

  const raw = sessionStorage.getItem(OAUTH_TRANSACTION_KEY);
  if (!raw) {
    return { valid: false, reason: "Missing OAuth transaction" };
  }

  try {
    const parsed = JSON.parse(raw) as OAuthTransaction;

    if (!parsed.state) {
      sessionStorage.removeItem(OAUTH_TRANSACTION_KEY);
      return { valid: false, reason: "Corrupted OAuth transaction" };
    }

    if (Date.now() - parsed.createdAt > OAUTH_TRANSACTION_TTL_MS) {
      sessionStorage.removeItem(OAUTH_TRANSACTION_KEY);
      sessionStorage.removeItem("oauthState");
      localStorage.removeItem("oauth_state");
      return { valid: false, reason: "OAuth transaction expired" };
    }

    if (parsed.state !== candidateState) {
      return { valid: false, reason: "OAuth state mismatch" };
    }

    // Single-use: remove transaction immediately after a successful match.
    sessionStorage.removeItem(OAUTH_TRANSACTION_KEY);
    sessionStorage.removeItem("oauthState");
    localStorage.removeItem("oauth_state");

    return { valid: true };
  } catch {
    sessionStorage.removeItem(OAUTH_TRANSACTION_KEY);
    sessionStorage.removeItem("oauthState");
    localStorage.removeItem("oauth_state");
    return { valid: false, reason: "Failed to parse OAuth transaction" };
  }
}

/**
 * Utility function to get backend OAuth start URL.
 * Browser must navigate to this endpoint (not fetch) to preserve full OAuth redirect flow.
 */
export function getGitHubAuthUrl(): string {
  const state = createOAuthTransaction();
  const params = new URLSearchParams({ state });
  return `${API_URL}/api/auth/github/login?${params.toString()}`;
}

export default {
  authApi,
  analysisApi,
  adminApi,
  userApi,
  feedbackApi,
  buildApiUrl,
  getGitHubAuthUrl,
};
