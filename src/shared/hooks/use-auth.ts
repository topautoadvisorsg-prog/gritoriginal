import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { AuthUser } from "../../../shared/models/auth";
import { logClientError, trackMetric } from "../lib/logger";
import { useEffect } from "react";

async function fetchUser(): Promise<AuthUser | null> {
  const response = await fetch("/api/auth/user", {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    const errMessage = `${response.status}: ${response.statusText}`;
    logClientError({ location: 'useAuth', action: 'fetchUser', error: errMessage });
    trackMetric('auth_fetch_fail', 1);
    throw new Error(errMessage);
  }

  const user = await response.json();
  if (user) trackMetric('auth_user_present', 1);
  return user;
}

async function logout(): Promise<void> {
  window.location.href = "/api/logout";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 0, // Always refetch on mount - ensures auth state is current
    refetchOnWindowFocus: true,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    login: () => { window.location.href = "/api/login"; },
    isLoggingOut: logoutMutation.isPending,
  };
}
