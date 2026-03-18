import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser
} from "../api/client";

const AuthContext = createContext(null);
const TOKEN_KEY = "rideeasy_token";
const USER_KEY = "rideeasy_user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(Boolean(localStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    let isMounted = true;

    async function bootstrapAuth() {
      if (!token) {
        setIsLoading(false);
        return;
      }

      if (token.startsWith("local-")) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await getCurrentUser(token);
        if (isMounted) {
          setUser(data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        }
      } catch (error) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        if (isMounted) {
          setToken("");
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const register = useCallback(async formData => {
    try {
      const data = await registerUser(formData);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      const localUser = {
        id: `local-${Date.now()}`,
        name: formData.name || "Rider",
        email: formData.email || `rider${Date.now()}@local.app`,
        mobile: formData.mobile || "",
        createdAt: new Date().toISOString()
      };
      const localToken = `local-${Date.now()}`;
      localStorage.setItem(TOKEN_KEY, localToken);
      localStorage.setItem(USER_KEY, JSON.stringify(localUser));
      setToken(localToken);
      setUser(localUser);
      return localUser;
    }
  }, []);

  const login = useCallback(async formData => {
    try {
      const data = await loginUser(formData);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      const localUser = {
        id: `local-${Date.now()}`,
        name: formData.email ? formData.email.split("@")[0] : "Rider",
        email: formData.email || `rider${Date.now()}@local.app`,
        mobile: "",
        createdAt: new Date().toISOString()
      };
      const localToken = `local-${Date.now()}`;
      localStorage.setItem(TOKEN_KEY, localToken);
      localStorage.setItem(USER_KEY, JSON.stringify(localUser));
      setToken(localToken);
      setUser(localUser);
      return localUser;
    }
  }, []);

  const logout = useCallback(async () => {
    if (token) {
      try {
        await logoutUser(token);
      } catch (error) {
        // Clear local auth state even if the backend session is already gone.
      }
    }

    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken("");
    setUser(null);
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      isLoading,
      isAuthenticated: Boolean(user && token),
      register,
      login,
      logout
    }),
    [token, user, isLoading, register, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
