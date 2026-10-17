import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  loginUser,
  registerUser,
  googleAuthUser,
  fetchCurrentUser,
  forgotPasswordUser,
  resetPasswordUser,
  updateUserPreferences,
  uploadUserAvatar,
  removeUserAvatar
} from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('warranty_wallet_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('warranty_wallet_token') || null);
  const [loading, setLoading] = useState(true);

  // Validate session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      const storedToken = localStorage.getItem('warranty_wallet_token');
      if (storedToken) {
        try {
          const res = await fetchCurrentUser();
          if (res.success) {
            setUser(res.data);
            localStorage.setItem('warranty_wallet_user', JSON.stringify(res.data));
          } else {
            logout();
          }
        } catch (err) {
          console.error('Session validation error:', err);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuthStatus();
  }, []);

  const login = async (credentials) => {
    const res = await loginUser(credentials);
    if (res.success && res.data?.token) {
      setToken(res.data.token);
      setUser(res.data);
      localStorage.setItem('warranty_wallet_token', res.data.token);
      localStorage.setItem('warranty_wallet_user', JSON.stringify(res.data));
    }
    return res;
  };

  const loginWithGoogle = async (credential) => {
    const res = await googleAuthUser(credential);
    if (res.success && res.data?.token) {
      setToken(res.data.token);
      setUser(res.data);
      localStorage.setItem('warranty_wallet_token', res.data.token);
      localStorage.setItem('warranty_wallet_user', JSON.stringify(res.data));
    }
    return res;
  };

  const register = async (userData) => {
    const res = await registerUser(userData);
    if (res.success && res.data?.token) {
      setToken(res.data.token);
      setUser(res.data);
      localStorage.setItem('warranty_wallet_token', res.data.token);
      localStorage.setItem('warranty_wallet_user', JSON.stringify(res.data));
    }
    return res;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('warranty_wallet_token');
    localStorage.removeItem('warranty_wallet_user');
  };

  const forgotPassword = async (email) => {
    return await forgotPasswordUser(email);
  };

  const resetPassword = async (resetToken, password) => {
    const res = await resetPasswordUser(resetToken, password);
    if (res.success && res.data?.token) {
      setToken(res.data.token);
      setUser(res.data);
      localStorage.setItem('warranty_wallet_token', res.data.token);
      localStorage.setItem('warranty_wallet_user', JSON.stringify(res.data));
    }
    return res;
  };

  const updatePreferences = async (preferences) => {
    const res = await updateUserPreferences(preferences);
    if (res.success) {
      setUser((prev) => {
        const updated = {
          ...prev,
          reminderPreferences: res.data
        };
        localStorage.setItem('warranty_wallet_user', JSON.stringify(updated));
        return updated;
      });
    }
    return res;
  };

  const updateAvatar = async (formData) => {
    const res = await uploadUserAvatar(formData);
    if (res.success && res.data) {
      setUser((prev) => {
        const updated = {
          ...prev,
          avatar: res.data.avatar
        };
        localStorage.setItem('warranty_wallet_user', JSON.stringify(updated));
        return updated;
      });
    }
    return res;
  };

  const removeAvatar = async () => {
    const res = await removeUserAvatar();
    if (res.success) {
      setUser((prev) => {
        const updated = {
          ...prev,
          avatar: ''
        };
        localStorage.setItem('warranty_wallet_user', JSON.stringify(updated));
        return updated;
      });
    }
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        forgotPassword,
        resetPassword,
        updatePreferences,
        updateAvatar,
        removeAvatar
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
