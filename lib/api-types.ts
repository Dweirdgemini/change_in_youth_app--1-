/**
 * TypeScript types for API requests and responses
 * Replaces tRPC with direct fetch + type safety
 */

export type UserRole = 
  | "super_admin" 
  | "admin" 
  | "finance" 
  | "safeguarding" 
  | "team_member" 
  | "student" 
  | "social_media_manager";

export interface User {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: UserRole;
  loginMethod: string;
  lastSignedIn: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  sessionToken?: string;
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Workshop types
export interface Workshop {
  id: number;
  title: string;
  description?: string;
  date: string;
  location?: string;
  facilitatorId: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkshopCount {
  total: number;
  thisMonth: number;
  thisYear: number;
}

// Schedule types
export interface ScheduleSession {
  id: number;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  facilitatorId: number;
  facilitator?: {
    name: string;
    email: string;
  };
  attendees?: User[];
}

// Finance types
export interface Invoice {
  id: number;
  userId: number;
  amount: number;
  description: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: number;
  notes?: string;
}

export interface CreateInvoiceRequest {
  amount: number;
  description: string;
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}
