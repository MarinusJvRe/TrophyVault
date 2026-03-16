import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";
import { getAuthToken, clearAuthToken } from "@/lib/auth-token";
import { resetUser } from "@/lib/posthog";

async function fetchUser(): Promise<User | null> {
  const headers: Record<string, string> = {};
  const token = getAuthToken();
  if (token) headers["X-Auth-Token"] = token;

  const response = await fetch("/api/auth/user", {
    credentials: "include",
    headers,
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function logout(): Promise<void> {
  const token = getAuthToken();
  clearAuthToken();
  sessionStorage.clear();
  resetUser();
  const headers: Record<string, string> = {};
  if (token) headers["X-Auth-Token"] = token;
  try {
    const res = await fetch("/api/auth/email-logout", {
      method: "POST",
      credentials: "include",
      headers,
    });
    if (res.ok) {
      window.location.href = "/";
      return;
    }
  } catch {}
  window.location.href = "/api/logout";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
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
    isLoggingOut: logoutMutation.isPending,
  };
}
