import React, { createContext, useContext, ReactNode } from "react";
import {
  User,
  useGetMe,
  useLogin,
  useLogout,
  getGetMeQueryKey,
  setAuthTokenGetter,
} from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: ReturnType<typeof useLogin>["mutateAsync"];
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const AUTH_TOKEN_STORAGE_KEY = "sa-school-auth-token";

function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

function setStoredAuthToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
}

setAuthTokenGetter(getStoredAuthToken);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading, refetch } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
      refetchOnWindowFocus: false,
    },
  });

  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const handleLogin: typeof loginMutation.mutateAsync = async (...args) => {
    const result = await loginMutation.mutateAsync(...args);
    const token = (result as typeof result & { token?: string }).token;
    setStoredAuthToken(token ?? null);
    await refetch();
    return result;
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } finally {
      setStoredAuthToken(null);
      await refetch();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        login: handleLogin,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
