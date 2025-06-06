import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

class AuthService {
  private token: string | null = null;
  private user: User | null = null;

  constructor() {
    // Load auth data from localStorage on initialization
    this.loadAuthData();
  }

  private loadAuthData() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('auth_user');
      if (userData) {
        try {
          this.user = JSON.parse(userData);
        } catch (error) {
          console.error('Error parsing user data from localStorage:', error);
          this.clearAuthData();
        }
      }
    }
  }

  private saveAuthData(token: string, user: User) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
    }
    this.token = token;
    this.user = user;
  }

  private clearAuthData() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }
    this.token = null;
    this.user = null;
  }

  async sendOTP(email: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiRequest('POST', '/api/auth/send-otp', { email });
      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to send OTP' };
    }
  }

  async verifyOTP(email: string, otp: string): Promise<{ success: boolean; message: string; data?: AuthResponse }> {
    try {
      const response = await apiRequest('POST', '/api/auth/verify-otp', { email, otp });
      const data: AuthResponse = await response.json();
      
      this.saveAuthData(data.token, data.user);
      
      return { success: true, message: 'Login successful', data };
    } catch (error: any) {
      return { success: false, message: error.message || 'OTP verification failed' };
    }
  }

  async createAdmin(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiRequest('POST', '/api/auth/create-admin', { email, password });
      const data = await response.json();
      return { success: true, message: data.message };
    } catch (error: any) {
      return { success: false, message: error.message || 'Failed to create admin account' };
    }
  }

  logout() {
    this.clearAuthData();
    // Redirect to login page
    window.location.href = '/login';
  }

  isAuthenticated(): boolean {
    return !!(this.token && this.user);
  }

  getToken(): string | null {
    return this.token;
  }

  getUser(): User | null {
    return this.user;
  }

  getAuthHeaders(): Record<string, string> {
    if (this.token) {
      return {
        'Authorization': `Bearer ${this.token}`,
      };
    }
    return {};
  }
}

export const authService = new AuthService();

// Helper function to check if user is authenticated and redirect if not
export function requireAuth(): boolean {
  if (!authService.isAuthenticated()) {
    window.location.href = '/login';
    return false;
  }
  return true;
}

// Helper function for making authenticated API requests
export async function authenticatedRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const headers = {
    ...authService.getAuthHeaders(),
    ...(data ? { "Content-Type": "application/json" } : {}),
  };

  const response = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  if (response.status === 401) {
    authService.logout();
    throw new Error('Authentication required');
  }

  if (!response.ok) {
    const text = (await response.text()) || response.statusText;
    throw new Error(`${response.status}: ${text}`);
  }

  return response;
}
