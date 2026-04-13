/**
 * Simple API client that bypasses tRPC library bug
 * Uses the exact format we confirmed works with direct API testing
 */

import { Platform } from "react-native";
import { getApiBaseUrl } from "@/constants/oauth";

// Use platform-aware URL for real devices vs localhost
const API_BASE_URL = Platform.select({
  ios: 'http://172.20.10.3:3001', // Real iOS device
  android: 'http://10.0.2.2:3001', // Android emulator
  default: 'http://localhost:3001' // Web and other platforms
});

export interface AuthResponse {
  success: boolean;
  user?: {
    id: string;
    openId?: string;
    name: string;
    email: string;
    role: string;
    loginMethod: string;
    lastSignedIn: string;
  };
  sessionToken?: string;
  error?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: string;
}

class SimpleApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;
    
    console.log(`[SimpleAPI] ${options.method} ${url}`);
    console.log(`[SimpleAPI] Platform: ${Platform.OS}`);
    console.log(`[SimpleAPI] Headers:`, {
      'Content-Type': 'application/json',
      ...options.headers,
    });
    
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    console.log(`[SimpleAPI] Response status: ${response.status} ${response.statusText}`);
    console.log(`[SimpleAPI] Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      // Read body once — response can only be consumed once
      const errorText = await response.text();
      console.log(`[SimpleAPI] Error response:`, errorText);
      
      // Try to parse tRPC error format for a meaningful message
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.error && errorData.error.json && errorData.error.json.message) {
          throw new Error(errorData.error.json.message);
        }
        // If parsed but no tRPC message, throw with status
        throw new Error(`Request failed: ${response.status}`);
      } catch (parseErr) {
        // If JSON.parse itself failed, throw with raw text
        if (parseErr instanceof SyntaxError) {
          throw new Error(errorText || `Request failed: ${response.status}`);
        }
        // Re-throw meaningful errors from above
        throw parseErr;
      }
    }

    const responseText = await response.text();
    console.log(`[SimpleAPI] Success response:`, responseText);
    
    // Try to parse tRPC success format
    try {
      const data = JSON.parse(responseText);
      return data.result || data; // Handle both tRPC and simple formats
    } catch (parseError) {
      console.log(`[SimpleAPI] Failed to parse response:`, parseError);
      throw new Error('Invalid response format');
    }
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      // Use REST endpoint instead of tRPC to avoid streaming issues
      const result = await this.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      
      return result;
    } catch (error: any) {
      console.error('[SimpleAPI] Login error:', error);
      
      return {
        success: false,
        user: undefined,
        sessionToken: undefined,
        error: error.message || 'Login failed'
      };
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      // Use REST endpoint instead of tRPC to avoid streaming issues
      const result = await this.request<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      return result;
    } catch (error: any) {
      console.error('[SimpleAPI] Register error:', error);
      return {
        success: false,
        user: undefined,
        sessionToken: undefined,
        error: error.message || 'Registration failed'
      };
    }
  }

  async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      return { success: true };
    } catch (error: any) {
      console.error('[SimpleAPI] Logout error:', error);
      return {
        success: false,
        error: error.message || 'Logout failed'
      };
    }
  }
}

// Export singleton instance
export const simpleApiClient = new SimpleApiClient();
