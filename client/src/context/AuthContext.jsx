import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('student_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('student_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize and verify authentication on app load
  useEffect(() => {
    const verifyUser = async () => {
      const storedToken = localStorage.getItem('student_token');
      if (storedToken) {
        try {
          const res = await authAPI.getMe();
          if (res.user) {
            setUser(res.user);
            localStorage.setItem('student_user', JSON.stringify(res.user));
          }
        } catch (err) {
          console.warn('[AuthContext] Verification failed, clearing stale session');
          logout();
        }
      }
      setLoading(false);
    };

    verifyUser();

    // Listen for global unauthorized events from apiFetch
    const handleUnauthorized = () => logout();
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    if (res.token && res.user) {
      localStorage.setItem('student_token', res.token);
      localStorage.setItem('student_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const register = async (formData) => {
    const res = await authAPI.register(formData);
    if (res.token && res.user) {
      localStorage.setItem('student_token', res.token);
      localStorage.setItem('student_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
    }
    return res;
  };

  const logout = () => {
    localStorage.removeItem('student_token');
    localStorage.removeItem('student_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('student_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isAdmin: user?.role === 'admin',
        isStudent: user?.role === 'student',
        loading,
        login,
        register,
        logout,
        updateUser
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
