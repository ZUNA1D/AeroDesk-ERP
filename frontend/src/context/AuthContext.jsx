import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth.api.js';
import { settingsApi } from '../api/settings.api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);

  const fetchSettings = async () => {
    try {
      const data = await settingsApi.get();
      setSettings(data.settings);
    } catch (_) {}
  };

  const checkAuth = async () => {
    try {
      setLoading(true);
      // Check if setup is required
      const status = await authApi.checkStatus();
      if (status.setupRequired) {
        setSetupRequired(true);
        setUser(null);
        setLoading(false);
        return;
      }
      setSetupRequired(false);

      // Fetch user profile
      const data = await authApi.getMe();
      setUser(data.user);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
      fetchSettings();
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (credentials) => {
    const data = await authApi.login(credentials);
    setUser(data.user);
    await fetchSettings();
    return data;
  };

  const setup = async (setupData) => {
    const data = await authApi.setup(setupData);
    setUser(data.user);
    setSetupRequired(false);
    await fetchSettings();
    return data;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      settings,
      loading,
      setupRequired,
      login,
      setup,
      logout,
      checkAuth,
      refreshSettings: fetchSettings
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
