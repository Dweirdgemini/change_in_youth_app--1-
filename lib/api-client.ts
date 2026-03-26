/**
 * Direct fetch API client with TypeScript support
 * Replaces tRPC with simpler, more reliable approach
 */

import { Platform } from "react-native";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "./_core/auth";
import type { 
  ApiResponse, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse,
  User,
  WorkshopCount,
  CreateInvoiceRequest,
  Invoice,
  ScheduleSession
} from "./api-types";

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getApiBaseUrl();
  }

  private async getHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add Authorization header for native platforms
    if (Platform.OS !== "web") {
      const sessionToken = await Auth.getSessionToken();
      if (sessionToken) {
        headers["Authorization"] = `Bearer ${sessionToken}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    console.log(`[API] Response status: ${response.status} ${response.statusText}`);

    // Try to parse JSON response
    let data: any;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (error) {
      throw new ApiError(`Invalid JSON response: ${response.statusText}`, response.status);
    }

    if (!response.ok) {
      // Handle tRPC error format
      let errorMessage = data?.error?.json?.message || 
                     data?.error?.message || 
                     data?.message || 
                     response.statusText;
      
      throw new ApiError(errorMessage, response.status, data);
    }

    return data as T;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;
    const headers = await this.getHeaders();

    console.log(`[API] ${options.method || 'GET'} ${url}`);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
        credentials: Platform.OS === "web" ? "include" : undefined,
      });

      return await this.handleResponse<T>(response);
    } catch (error) {
      console.error(`[API] Request failed:`, error);
      throw error;
    }
  }

  // Auth endpoints - using tRPC API with correct format
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const result = await this.request<{ user: User; sessionToken: string }>("/trpc/auth.login", {
        method: "POST",
        body: JSON.stringify({
          json: credentials,
          meta: {}
        }),
      });

      return {
        success: true,
        user: result.user,
        sessionToken: result.sessionToken,
        error: undefined,
      };
    } catch (error) {
      console.error("[Login] Error:", error);
      return {
        success: false,
        user: undefined,
        sessionToken: undefined,
        error: error instanceof ApiError ? error.message : 'Login failed',
      };
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const result = await this.request<{ user: User; sessionToken: string }>("/trpc/auth.register", {
        method: "POST",
        body: JSON.stringify({
          json: userData,
          meta: {}
        }),
      });

      return {
        success: true,
        user: result.user,
        sessionToken: result.sessionToken,
        error: undefined,
      };
    } catch (error) {
      console.error("[Register] Error:", error);
      return {
        success: false,
        user: undefined,
        sessionToken: undefined,
        error: error instanceof ApiError ? error.message : 'Registration failed',
      };
    }
  }

  async logout(): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>("/trpc/auth.logout", {
      method: "POST",
      body: JSON.stringify({
        json: {},
        meta: {}
      }),
    });
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await this.request<User>("/trpc/auth.me");
      return response;
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        return null; // Not authenticated
      }
      throw error;
    }
  }

  // Admin endpoints
  async getWorkshopCount(): Promise<WorkshopCount> {
    return this.request<WorkshopCount>("/admin/workshop-count");
  }

  // Schedule endpoints
  async getSchedule(): Promise<ScheduleSession[]> {
    return this.request<ScheduleSession[]>("/schedule");
  }

  // Finance endpoints
  async submitInvoice(invoice: CreateInvoiceRequest): Promise<Invoice> {
    return this.request<Invoice>("/finance/invoices", {
      method: "POST",
      body: JSON.stringify(invoice),
    });
  }

  async getInvoices(): Promise<Invoice[]> {
    return this.request<Invoice[]>("/finance/invoices");
  }

  // Generic GET method for other endpoints
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  // Generic POST method for other endpoints
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Generic PUT method for other endpoints
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Generic DELETE method for other endpoints
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    });
  }
}

// Custom error class for API errors
class ApiError extends Error {
  public statusCode?: number;
  public details?: any;

  constructor(message: string, statusCode?: number, details?: any) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export { ApiError };

// Export types for convenience
export type {
  ApiResponse,
  ApiError as IApiError,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  WorkshopCount,
  CreateInvoiceRequest,
  Invoice,
  ScheduleSession,
};
