"use client";

import { createContext, useContext, useEffect, useState, startTransition } from "react";
import { authentificationService } from "../services/authentificationService";
import { inscriptionService } from "../services/inscriptionService";
import { normalizeUser } from "../services/userMapper";
import type { AuthTokens, User, RegisterInput } from "../types";

type AuthResult = { ok: boolean; message?: string };

type AuthContextValue = {
  user:       User | null;
  tokens:     AuthTokens | null;
  loading:    boolean;
  login:      (email: string, password: string) => Promise<AuthResult>;
  register:   (input: RegisterInput) => Promise<AuthResult>;
  logout:     () => void;
  updateUser: (updated: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKENS_KEY = "ecoeats_tokens";
const USER_KEY   = "ecoeats_user";

const persist = (tokens: AuthTokens, user: User) => {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  document.cookie = `isLoggedIn=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
};

const clear = () => {
  localStorage.removeItem(TOKENS_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = "isLoggedIn=; path=/; max-age=0";
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user,    setUser]    = useState<User | null>(null);
  const [tokens,  setTokens]  = useState<AuthTokens | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedTokens = localStorage.getItem(TOKENS_KEY);
    const storedUser   = localStorage.getItem(USER_KEY);
    startTransition(() => {
      if (storedTokens && storedUser) {
        setTokens(JSON.parse(storedTokens) as AuthTokens);
        setUser(normalizeUser(JSON.parse(storedUser) as Parameters<typeof normalizeUser>[0]));
      }
      setLoading(false);
    });
  }, []);

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const result = await authentificationService({ email, password });
    if (!result.ok || !result.data) {
      return { ok: false, message: result.message ?? "Identifiants incorrects" };
    }
    const tokens: AuthTokens = { accessToken: result.data.tokens.accessToken };
    persist(tokens, result.data.user);
    setTokens(tokens);
    setUser(result.data.user);
    return { ok: true };
  };

  const register = async (input: RegisterInput): Promise<AuthResult> => {
    const result = await inscriptionService(input);
    if (!result.ok || !result.data) {
      return { ok: false, message: result.message ?? "Inscription échouée" };
    }
    const tokens: AuthTokens = { accessToken: result.data.tokens.accessToken };
    persist(tokens, result.data.user);
    setTokens(tokens);
    setUser(result.data.user);
    return { ok: true };
  };

  const logout = () => {
    clear();
    setTokens(null);
    setUser(null);
  };

  const updateUser = (updated: User) => {
    setUser(updated);
    if (tokens) persist(tokens, updated);
  };

  return (
    <AuthContext.Provider value={{ user, tokens, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error("useAuth doit être utilisé dans AuthProvider");
  return authContext;
};
