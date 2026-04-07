import React, { createContext, useContext, ReactNode, useEffect, useState } from "react";
import { User, useGetMe, useLogin, useLogout } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: ReturnType<typeof useLogin>["mutateAsync"];
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading, refetch } = useGetMe({
    query: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  });

  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    await refetch();
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        login: loginMutation.mutateAsync,
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
