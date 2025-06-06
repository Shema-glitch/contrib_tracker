import { apiRequest } from "./queryClient";

export interface AuthUser {
  email: string;
  name: string;
  isActive: boolean;
}

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async sendOtp(email: string): Promise<{ success: boolean; message?: string }> {
    try {
      await apiRequest("POST", "/api/auth/send-otp", { email });
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message || "Failed to send OTP" 
      };
    }
  }

  async verifyOtp(email: string, token: string): Promise<{ success: boolean; message?: string }> {
    try {
      await apiRequest("POST", "/api/auth/verify-otp", { email, token });
      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message || "Invalid or expired OTP" 
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch (error) {
      // Continue with logout even if server request fails
      console.error("Logout error:", error);
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      // Try to fetch dashboard stats to verify authentication
      await apiRequest("GET", "/api/dashboard/stats");
      // If successful, we're authenticated
      // In a real app, you'd have a proper user endpoint
      return {
        email: "admin@example.com",
        name: "Admin User", 
        isActive: true
      };
    } catch (error) {
      return null;
    }
  }

  async requireOtpForSensitiveOperation(
    operation: string,
    email: string
  ): Promise<{ success: boolean; token?: string; message?: string }> {
    try {
      // Send OTP for sensitive operation
      await this.sendOtp(email);
      return { 
        success: true, 
        message: "OTP sent for verification" 
      };
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message || "Failed to send OTP for verification" 
      };
    }
  }

  async verifyOtpForSensitiveOperation(
    email: string,
    token: string,
    operation: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const result = await this.verifyOtp(email, token);
      if (result.success) {
        return { 
          success: true, 
          message: `${operation} authorized successfully` 
        };
      }
      return result;
    } catch (error: any) {
      return { 
        success: false, 
        message: error.message || "OTP verification failed" 
      };
    }
  }

  // Utility methods for checking permissions
  canPerformSensitiveOperation(): boolean {
    // In a real app, you'd check user permissions here
    return true;
  }

  requiresOtpVerification(operation: string): boolean {
    const sensitiveOperations = [
      "delete_member",
      "waive_penalty",
      "modify_loan",
      "export_sensitive_data",
      "change_settings"
    ];
    
    return sensitiveOperations.includes(operation);
  }
}

export const authService = AuthService.getInstance();
