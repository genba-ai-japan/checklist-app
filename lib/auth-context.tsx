"use client";

import { createContext, useContext } from "react";

interface AuthContextValue {
  openSettings: () => void;
  accountId: string;
  username: string;
}

const AuthContext = createContext<AuthContextValue>({
  openSettings: () => {},
  accountId: "default",
  username: "",
});

export function AuthProvider({
  children,
  onOpenSettings,
  accountId,
  username,
}: {
  children: React.ReactNode;
  onOpenSettings: () => void;
  accountId: string;
  username: string;
}) {
  return (
    <AuthContext.Provider value={{ openSettings: onOpenSettings, accountId, username }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
