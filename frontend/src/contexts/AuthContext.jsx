import React, { createContext, useContext, useEffect, useState } from "react";
import {
  AUTH_LOGIN_URL,
  AUTH_REGISTER_URL,
  USER_PROFILE_URL,
  API_ORIGIN,
} from "@/lib/apiConfig";
import { normalizeMode } from "@/lib/historyStorage";
import i18n from "@/i18n/index.js";

const AuthContext = createContext();

const loadStoredUser = () => {
  try {
    const raw = localStorage.getItem("devinspect-user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentMode, setCurrentMode] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = loadStoredUser();
      const token = localStorage.getItem("devinspect-token");

      if (storedUser && token) {
        setCurrentUser(storedUser);
        setCurrentMode(normalizeMode(storedUser.currentMode));
      }

      // Apply saved language on every app load
      const savedLang = localStorage.getItem("devinspect-lang") || 'en';
      if (i18n.language !== savedLang) {
        i18n.changeLanguage(savedLang);
      }

      setInitialLoading(false);
    };

    initAuth();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem("devinspect-token");

    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  };

  const login = async (email, password) => {
    setError("");

    const response = await fetch(AUTH_LOGIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    if (!data.token) {
      throw new Error("Token missing from backend response");
    }

    const mappedUser = {
      id: data._id,
      email: data.email,
      name: data.name,
      role: data.role || 'user',
      currentMode: data.currentMode || 'developer',
    };

    // SAVE TOKEN
    localStorage.setItem("devinspect-token", data.token);
    localStorage.setItem("devinspect-user", JSON.stringify(mappedUser));
    localStorage.setItem("devinspect-mode", mappedUser.currentMode);

    setCurrentUser(mappedUser);
    setCurrentMode(normalizeMode(mappedUser.currentMode));

    // Apply saved language after login
    const savedLang = localStorage.getItem("devinspect-lang") || 'en';
    i18n.changeLanguage(savedLang);

    return mappedUser;
  };

  const signup = async (email, password, name) => {
    const res = await fetch(AUTH_REGISTER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Signup failed");
    }

    return login(email, password);
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentMode(null);
    localStorage.removeItem("devinspect-token");
    localStorage.removeItem("devinspect-user");
    localStorage.removeItem("devinspect-mode");
    // Hard redirect — bypasses AnimatePresence blank-screen flash
    window.location.replace("/login");
  };

  const deleteAccountOnBackend = async () => {
    const token = localStorage.getItem("devinspect-token");
    const response = await fetch(`${USER_PROFILE_URL}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Failed to delete account');
    }
  };

  const switchMode = (mode) => {
    const normalized = normalizeMode(mode);
    setCurrentMode(normalized);
    localStorage.setItem("devinspect-mode", normalized);
  };

  /**
   * Update profile on backend — used by SettingsPage
   */
  const updateProfileOnBackend = async (payload) => {
    const token = localStorage.getItem("devinspect-token");
    const response = await fetch(`${API_ORIGIN}/api/user/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
      },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Failed to update profile");

    // Sync stored user
    const updated = {
      ...currentUser,
      name: data.name || currentUser?.name,
      apiKey: data.apiKey || currentUser?.apiKey,
    };
    setCurrentUser(updated);
    localStorage.setItem("devinspect-user", JSON.stringify(updated));
    return data;
  };

  /**
   * Save user preferences — used by SettingsPage
   */
  const updateUserPreferences = async (prefs) => {
    const token = localStorage.getItem("devinspect-token");
    try {
      const response = await fetch(`${API_ORIGIN}/api/user/preferences`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(prefs),
      });
      // Persist locally regardless of backend response
      localStorage.setItem("devinspect-preferences", JSON.stringify(prefs));
      if (response.ok) return response.json();
    } catch {
      // Fallback: local only
      localStorage.setItem("devinspect-preferences", JSON.stringify(prefs));
    }
    return prefs;
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentMode,
        isAuthenticated: !!currentUser,
        initialLoading,
        error,
        login,
        signup,
        logout,
        switchMode,
        getAuthHeaders,
        deleteAccountOnBackend,
        updateProfileOnBackend,
        updateUserPreferences,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);