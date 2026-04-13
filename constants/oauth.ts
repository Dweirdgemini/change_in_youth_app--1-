import * as Linking from "expo-linking";
import * as ReactNative from "react-native";

// Use the custom branded scheme from app.config.ts
// This must match the scheme in app.config.ts for deep links to work correctly
const customScheme = "changein";

const env = {
  portal: process.env.EXPO_PUBLIC_OAUTH_PORTAL_URL ?? "",
  server: process.env.EXPO_PUBLIC_OAUTH_SERVER_URL ?? "",
  appId: process.env.EXPO_PUBLIC_APP_ID ?? "",
  ownerId: process.env.EXPO_PUBLIC_OWNER_OPEN_ID ?? "",
  ownerName: process.env.EXPO_PUBLIC_OWNER_NAME ?? "",
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? "",
  deepLinkScheme: customScheme,
};

export const OAUTH_PORTAL_URL = env.portal;
export const OAUTH_SERVER_URL = env.server;
export const APP_ID = env.appId;
export const OWNER_OPEN_ID = env.ownerId;
export const OWNER_NAME = env.ownerName;
export const API_BASE_URL = env.apiBaseUrl;

/**
 * Get the API base URL, deriving from current hostname if not set.
 * Metro runs on 8081, API server runs on 3000.
 * URL pattern: https://PORT-sandboxid.region.domain
 */
export function getApiBaseUrl(): string {
  // If API_BASE_URL is set, use it (but fix localhost for native devices)
  if (API_BASE_URL) {
    const cleanUrl = API_BASE_URL.replace(/\/$/, "");
    
    // On native, localhost won't work — use machine's actual IP instead
    if (ReactNative.Platform.OS !== "web" && 
        (cleanUrl.includes("localhost") || cleanUrl.includes("127.0.0.1"))) {
      return "http://172.20.10.3:3001";
    }
    
    return cleanUrl;
  }

  // On web, derive from current hostname by replacing port 8081 with 3001
  if (ReactNative.Platform.OS === "web" && typeof window !== "undefined" && window.location) {
    const { protocol, hostname } = window.location;
    const apiHostname = hostname.replace(/^8081-/, "3001-");
    if (apiHostname !== hostname) {
      return `${protocol}//${apiHostname}`;
    }
  }

  // Fallback to production Railway backend
  return "https://changeinyouthapp-1-production.up.railway.app";
}

export const SESSION_TOKEN_KEY = "app_session_token";
export const USER_INFO_KEY = "manus-runtime-user-info";

const encodeState = (value: string) => {
  if (typeof globalThis.btoa === "function") {
    return globalThis.btoa(value);
  }
  const BufferImpl = (globalThis as Record<string, any>).Buffer;
  if (BufferImpl) {
    return BufferImpl.from(value, "utf-8").toString("base64");
  }
  return value;
};

export const getLoginUrl = () => {
  console.log("[OAuth] Generating login URL with environment:", {
    portal: OAUTH_PORTAL_URL,
    appId: APP_ID,
    apiBaseUrl: API_BASE_URL,
    hasPortal: !!OAUTH_PORTAL_URL,
    hasAppId: !!APP_ID
  });

  // Validate required environment variables
  if (!OAUTH_PORTAL_URL) {
    console.error("[OAuth] Missing EXPO_PUBLIC_OAUTH_PORTAL_URL");
    throw new Error("OAuth portal URL is not configured");
  }
  
  if (!APP_ID || APP_ID === 'your-app-id-here') {
    console.error("[OAuth] Missing or invalid EXPO_PUBLIC_APP_ID");
    throw new Error("App ID is not configured");
  }

  let redirectUri: string;
  let stateData: { redirectUri: string; deepLink?: string };

  if (ReactNative.Platform.OS === "web") {
    // Web platform: redirect to API server callback (not Metro bundler)
    // The API server will then redirect back to the frontend with the session token
    redirectUri = `${getApiBaseUrl()}/api/oauth/callback`;
    stateData = { redirectUri };
    console.log("[OAuth] Web platform: redirectUri =", redirectUri);
  } else {
    // Native platform: use mobile API endpoint
    // Encode deep link in state parameter (can't use query params in redirect_uri)
    redirectUri = `${getApiBaseUrl()}/api/oauth/mobile`;
    const deepLinkCallback = `${env.deepLinkScheme}://oauth/callback`;
    stateData = { redirectUri, deepLink: deepLinkCallback };
    console.log("[OAuth] Native platform: redirectUri =", redirectUri, "deepLink =", deepLinkCallback);
  }

  const state = encodeState(JSON.stringify(stateData));

  const url = new URL(`${OAUTH_PORTAL_URL}/app-auth`);
  url.searchParams.set("appId", APP_ID);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  const finalUrl = url.toString();
  console.log("[OAuth] Generated login URL:", finalUrl);
  
  return finalUrl;
};
