// Primary config. app.json is intentionally minimal — do not add config there.
// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

// Bundle ID format: space.manus.<project_name_dots>.<timestamp>
// e.g., "my-app" created at 2024-01-15 10:30:45 -> "space.manus.my.app.t20240115103045"
const bundleId = "space.manus.change_in_youth_app.t20260109113652";
// Extract timestamp from bundle ID and prefix with "manus" for deep link scheme
// e.g., "space.manus.my.app.t20240115103045" -> "manus20240115103045"
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

const env = {
  // App branding - update these values directly (do not use env vars)
  appName: "Change In Youth",
  appSlug: "change_in_youth_app",
  // S3 URL of the app logo - set this to the URL returned by generate_image when creating custom logo
  // Leave empty to use the default icon from assets/images/icon.png
  logoUrl: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663243745579/qyEuSLNsHnIouZDk.png",
  // Custom branded deep link scheme (changein:// instead of manus://)
  scheme: "changein",
  iosBundleId: bundleId,
  androidPackage: bundleId,
  // Custom domain for consent forms and public links
  // Update this to your own domain (e.g., "https://app.changeinyouth.org")
  // Leave empty to use the default Manus development URL
  customDomain: process.env.CUSTOM_DOMAIN || "https://changein.youth",
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug.replace(/_/g, "-"),
  version: "1.0.1",
  orientation: "portrait",
  icon: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663243745579/ifkyaWOpttlyvroU.png",
  scheme: env.scheme,
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
  },
  android: {
    icon: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663243745579/ifkyaWOpttlyvroU.png",
    adaptiveIcon: null,
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    versionCode: 571105,
    permissions: ["POST_NOTIFICATIONS"],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: env.scheme,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663243745579/GKLaEMkXyosYAEHV.png",
    // Use the S3 logo URL for web branding
    logo: env.logoUrl || "https://files.manuscdn.com/user_upload_by_module/session_file/310519663243745579/ifkyaWOpttlyvroU.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-audio",
      {
        microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone.",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663243745579/LvMHTOXmDsvgJduX.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          image: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663243745579/LvMHTOXmDsvgJduX.png",
          backgroundColor: "#000000",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  // Ensure the app respects system theme preference
  userInterfaceStyle: "automatic",
  extra: {
    eas: {
      projectId: "df7710a8-5ae3-4e4f-9eb5-11b05f625179",
    },
  },
};

// Log configuration for debugging
if (process.env.NODE_ENV === "development") {
  console.log("App Config:", {
    name: config.name,
    slug: config.slug,
    scheme: env.scheme,
    logoUrl: env.logoUrl,
  });
}

export default config;
