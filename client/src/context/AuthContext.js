/**
 * context/AuthContext.js
 * ADDED: loginWithToken method for Google OAuth callback
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Bootstrap — verify stored token on mount
  useEffect(() => {
    const init = async () => {
      const stored = localStorage.getItem("token");
      if (!stored) { setLoading(false); return; }
      try {
        api.defaults.headers.common["Authorization"] = `Bearer ${stored}`;
        const { data } = await api.get("/auth/me");
        setUser(data.data.user);
      } catch {
        localStorage.removeItem("token");
        delete api.defaults.headers.common["Authorization"];
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    const { token, user: u } = data.data;
    localStorage.setItem("token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await api.post("/auth/register", payload);
    const { token, user: u } = data.data;
    localStorage.setItem("token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(u);
    return u;
  }, []);

  // ── NEW: Called by GoogleCallback page after OAuth redirect ───────────────
  const loginWithToken = useCallback(async (token) => {
    localStorage.setItem("token", token);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    const { data } = await api.get("/auth/me");
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithToken, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export default AuthContext;