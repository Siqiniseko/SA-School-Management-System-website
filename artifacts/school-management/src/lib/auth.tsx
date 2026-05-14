import React, { createContext, useContext, ReactNode } from "react";
import { User, useGetMe, useLogin, useLogout, getGetMeQueryKey } from "@workspace/api-client-react";

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
      queryKey: getGetMeQueryKey(),
      retry: false,
      refetchOnWindowFocus: false,
    },
  });

  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const handleLogin: typeof loginMutation.mutateAsync = async (...args) => {
    const result = await loginMutation.mutateAsync(...args);
    await refetch();
    return result;
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    await refetch();
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
