import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi, api, setBusinessId, setCsrfToken, type ApiBusiness, type AuthUser } from "../services/api";

interface AuthContextValue {
  user: AuthUser | null;
  businesses: ApiBusiness[];
  activeBusiness: ApiBusiness | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshBusinesses: () => Promise<ApiBusiness[]>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [businesses, setBusinesses] = useState<ApiBusiness[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshBusinesses = useCallback(async () => {
    const result = await api.getMyBusinesses();
    setBusinesses(result);
    setBusinessId(result[0]?.id ?? null);
    return result;
  }, []);

  const adoptSession = useCallback(async (result: { user: AuthUser; csrf_token: string }) => {
    setCsrfToken(result.csrf_token);
    setUser(result.user);
    try {
      await refreshBusinesses();
    } catch (error) {
      setUser(null);
      setCsrfToken(null);
      setBusinessId(null);
      throw error;
    }
    return result.user;
  }, [refreshBusinesses]);

  useEffect(() => {
    let active = true;
    authApi.me()
      .then(async result => {
        if (!active) return;
        setCsrfToken(result.csrf_token);
        setUser(result.user);
        await refreshBusinesses();
      })
      .catch(() => {
        setCsrfToken(null);
        setBusinessId(null);
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [refreshBusinesses]);

  const login = useCallback(async (email: string, password: string) => {
    return adoptSession(await authApi.login({ email, password }));
  }, [adoptSession]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    return adoptSession(await authApi.register({ name, email, password }));
  }, [adoptSession]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setBusinesses([]);
      setCsrfToken(null);
      setBusinessId(null);
    }
  }, []);

  const value = useMemo(() => ({
    user,
    businesses,
    activeBusiness: businesses[0] ?? null,
    loading,
    login,
    register,
    logout,
    refreshBusinesses,
  }), [user, businesses, loading, login, register, logout, refreshBusinesses]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
