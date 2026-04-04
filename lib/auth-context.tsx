"use client";

import { createContext, useContext, useState } from "react";

interface AuthContextValue {
  openSettings: () => void;
}

const AuthContext = createContext<AuthContextValue>({ openSettings: () => {} });

export function AuthProvider({
  children,
  onOpenSettings,
}: {
  children: React.ReactNode;
  onOpenSettings: () => void;
}) {
  return (
    <AuthContext.Provider value={{ openSettings: onOpenSettings }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
