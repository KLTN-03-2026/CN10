"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { authApi } from "./api-client";
import { normalizeUserProfile, type UserProfile } from "./user-utils";

/**
 * Re-export UserProfile as User for backward-compatible imports.
 * Components that `import { User } from "./auth-context"` continue to work.
 */
export type User = UserProfile;

// normalizeAuthUser delegates to the shared normalizeUserProfile utility.
const normalizeAuthUser = normalizeUserProfile;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  setSession: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth from HttpOnly cookie session via profile endpoint.
  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const profile = await authApi.getProfile();
        setUser(normalizeAuthUser(profile));
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  const setSession = (nextUser: User) => {
    setUser(normalizeAuthUser(nextUser));
  };

  const refreshUser = async () => {
    try {
      const profile = await authApi.getProfile();
      setUser(normalizeAuthUser(profile));
    } catch (error) {
      console.error("Failed to refresh user:", error);
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout,
    refreshUser,
    setUser,
    setSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

/**
 * Hook to check if user is authenticated
 */
export function useAuthCheck() {
  const { isAuthenticated, isLoading } = useAuth();
  return { isAuthenticated, isLoading };
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin() {
  const { user } = useAuth();
  return user?.role === "ADMIN";
}
