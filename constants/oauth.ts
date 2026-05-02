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
 * Get API base URL with Expo-compatible IP auto-detection.
 * Metro runs on 8081, API server runs on 3001 (with fallback to 3002).
 * Uses Metro Bundler's host URI to fix "Network request failed" errors on physical devices.
 */
export function getApiBaseUrl(): string {
  console.log('[getApiBaseUrl] Platform:', ReactNative.Platform.OS);
  console.log('[getApiBaseUrl] API_BASE_URL env:', API_BASE_URL);

  if (ReactNative.Platform.OS === "web") {
    const url = API_BASE_URL || "https://changeinyouthapp-1-production.up.railway.app";
    console.log('[getApiBaseUrl] Web resolved URL:', url);
    return url;
  }

  // Native: detect Metro host IP dynamically
  const metroHost = getMetroHostUri();
  const hostIp = metroHost ? metroHost.split(':')[0] : "192.168.1.10";
  console.log('[getApiBaseUrl] Metro host detected:', metroHost, 'IP:', hostIp);
  
  // Use environment variable for port, default to 3001
  const port = process.env.EXPO_PUBLIC_API_PORT || "3001";
  console.log('[getApiBaseUrl] Using port:', port);
  
  // Android emulator special case (10.0.2.2 maps to host machine)
  if (ReactNative.Platform.OS === "android") {
    const url = `http://10.0.2.2:${port}`;
    console.log('[getApiBaseUrl] Android emulator resolved URL:', url);
    return url;
  }
  
  const url = `http://${hostIp}:${port}`;
  console.log('[getApiBaseUrl] Native resolved URL:', url);
  return url;
}

/**
 * Get Metro Bundler's host URI for IP auto-detection.
 * This fixes "Network request failed" errors on physical devices and Expo Go.
 */
function getMetroHostUri(): string | null {
  try {
    const Constants = require('expo-constants').default ?? require('expo-constants');
    
    // Modern Expo SDK (49+)
    const hostUri = 
      Constants?.expoGoConfig?.debuggerHost ??
      Constants?.expoConfig?.hostUri ??
      Constants?.manifest2?.extra?.expoGo?.debuggerHost ??
      Constants?.manifest?.debuggerHost ??
      Constants?.manifest?.hostUri ??
      null;

    if (hostUri) {
      const ip = hostUri.split(':')[0];
      console.log('[API] Metro host detected:', ip);
      return hostUri;
    }

    // Temporary debug log — remove after fix is confirmed
    const Constants2 = require('expo-constants').default ?? require('expo-constants');
    console.warn('[API] No Metro host found. Constants dump:', JSON.stringify(Constants2, null, 2));
    return null;
  } catch (error) {
    console.warn('[API] Failed to get Metro host:', error);
    return null;
  }
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
