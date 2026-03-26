import { createTRPCReact } from "@trpc/react-query";
import { httpBatchStreamLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers";
import { getApiBaseUrl } from "@/constants/oauth";
import * as Auth from "@/lib/_core/auth";
import { getItem, setItem } from './storage';

/**
 * tRPC React client for type-safe API calls.
 *
 * IMPORTANT (tRPC v11): The `transformer` must be inside `httpBatchStreamLink`,
 * NOT at the root createClient level. This ensures client and server
 * use the same serialization format (superjson).
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Creates the tRPC client with proper configuration.
 * Call this once in your app's root layout.
 */
export function createTRPCClient() {
  const apiBaseUrl = getApiBaseUrl();
  console.log('[tRPC] Creating client with base URL:', apiBaseUrl);
  
  return trpc.createClient({
    links: [
      httpBatchStreamLink({
        url: `${apiBaseUrl}/api/trpc`,
        // Put transformer back - removing it might cause other issues
        transformer: superjson as any,
        async headers() {
          const headers: Record<string, string> = {};
          
          // Add tRPC React Native source header
          headers['x-trpc-source'] = 'react-native';
          
          console.log('[tRPC] Request headers setup - starting');
          
          // DEV MODE BYPASS - Remove before production!
          // Check URL parameter first, then storage
          if (typeof window !== 'undefined' && window.location?.search) {
            const urlParams = new URLSearchParams(window.location.search);
            const devModeParam = urlParams.get('dev_mode');
            const devModeStorage = await getItem('dev_mode');
            const devMode = devModeParam || devModeStorage;
            
            console.log('[tRPC] Checking dev_mode - URL param:', devModeParam, 'storage:', devModeStorage);
            
            if (devMode === 'true') {
              headers['x-dev-mode'] = 'true';
              console.log('[tRPC] ✅ Dev mode header added to request');
              
              // Persist to storage for future requests
              if (!devModeStorage) {
                await setItem('dev_mode', 'true');
                console.log('[tRPC] Persisted dev_mode to storage');
              }
            } else {
              console.log('[tRPC] ❌ Dev mode NOT enabled');
            }
          }
          
          // Add Authorization header if we have a session token
          const token = await Auth.getSessionToken();
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('[tRPC] ✅ Authorization header added (token length:', token.length, ')');
          } else {
            console.log('[tRPC] ❌ No session token found');
          }
          
          console.log('[tRPC] Final headers:', Object.keys(headers));
          return headers;
        },
      }),
    ],
  });
}
