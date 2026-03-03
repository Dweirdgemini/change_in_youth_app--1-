/**
 * App Configuration Constants
 * 
 * Centralized configuration for the app, including custom domain settings.
 */

import { getApiBaseUrl } from "./oauth";

/**
 * Get the base URL for the app.
 * 
 * Priority:
 * 1. CUSTOM_DOMAIN environment variable (for production with custom domain)
 * 2. Derived from current hostname (web) or environment variable
 */
export function getBaseUrl(): string {
  // Check for custom domain first (production)
  if (process.env.CUSTOM_DOMAIN) {
    return process.env.CUSTOM_DOMAIN;
  }
  
  // Use the same API base URL logic as tRPC client
  // This correctly derives port 3000 from port 8081 on web
  return getApiBaseUrl();
}

/**
 * Get the full URL for a consent form.
 * 
 * @param projectId - The project ID
 * @returns The full URL to the consent form
 */
export function getConsentFormUrl(projectId: number): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/consent/${projectId}`;
}
