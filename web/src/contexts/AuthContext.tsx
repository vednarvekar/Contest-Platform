import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api, type AuthUser } from "@/lib/api";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  signup: (name: string, email: string, password: string, role: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function decodeToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.id || payload.userId || payload.sub,
      name: payload.name || "",
      email: payload.email || "",
      role: payload.role || "contestee",
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("token");
    if (stored) {
      const decoded = decodeToken(stored);
      if (decoded) {
        setUser(decoded);
        setToken(stored);
      } else {
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    const res = await api.login({ email, password });
    if (res.success && res.data) {
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
      setUser(decodeToken(res.data.token));
      return null;
    }
    return res.error || "LOGIN_FAILED";
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string, role: string): Promise<string | null> => {
    const res = await api.signup({ name, email, password, role });
    if (res.success && res.data) {
      // Auto login after signup
      return login(email, password);
    }
    return res.error || "SIGNUP_FAILED";
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
