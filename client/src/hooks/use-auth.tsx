import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, type User } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, otp: string) => Promise<{ success: boolean; message: string }>;
  sendOTP: (email: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize auth state from localStorage
    const currentUser = authService.getUser();
    setUser(currentUser);
    setIsLoading(false);
  }, []);

  const sendOTP = async (email: string) => {
    return await authService.sendOTP(email);
  };

  const login = async (email: string, otp: string) => {
    const result = await authService.verifyOTP(email, otp);
    if (result.success && result.data) {
      setUser(result.data.user);
    }
    return result;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    sendOTP,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
