"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./auth-context";
import { Spinner } from "@/components/ui/spinner";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "USER" | "ADMIN";
}

/**
 * Wrapper component for protecting routes that require authentication
 */
export function ProtectedRoute({
  children,
  requiredRole = "USER",
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    if (requiredRole === "ADMIN" && user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    if (requiredRole === "USER" && user?.role === "ADMIN") {
      router.push("/admin");
      return;
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (requiredRole === "ADMIN" && user?.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (requiredRole === "USER" && user?.role === "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  return children;
}

/**
 * Component to wrap pages that require authentication
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>;
}

/**
 * Component to wrap admin-only pages
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute requiredRole="ADMIN">{children}</ProtectedRoute>;
}
