/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// Extended types for API responses
export interface SessionWithFacilitators {
  id: number;
  organizationId: number;
  projectId: number;
  title: string;
  description: string | null;
  venue: string;
  startTime: Date;
  endTime: Date;
  sessionNumber: number | null;
  totalSessions: number | null;
  paymentPerFacilitator: string | null;
  isVirtualMeeting: boolean;
  meetingLink: string | null;
  meetingType: "zoom" | "google_meet" | "teams" | "other" | null;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  approvalStatus: "pending" | "approved" | "rejected";
  requestedBy: number | null;
  reviewedBy: number | null;
  reviewedAt: Date | null;
  requiredDeliverables: string[] | null;
  attendeeCount: number | null;
  createdAt: Date;
  updatedAt: Date;
  facilitators: Array<{
    id: number;
    name: string;
    email: string;
  }>;
  acceptanceStatus?: "pending" | "accepted" | "rejected";
}

// Pending request type (subset of session properties)
export interface PendingSessionRequest {
  id: number;
  title: string;
  venue: string;
  startTime: Date;
  endTime: Date;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  approvalStatus: "pending" | "approved" | "rejected";
  projectName: string;
  createdAt: Date;
  isPendingRequest: boolean;
  paymentPerFacilitator: string | null;
  sessionNumber?: number | null;
  totalSessions?: number | null;
  facilitators: Array<{
    id: number;
    name: string;
    email: string;
  }>;
  acceptanceStatus: "pending";
}

// Union type for all activities in the schedule
export type ScheduleActivity = SessionWithFacilitators | PendingSessionRequest;
