import { useEffect, useState } from "react";
import { View, Text, Image, ActivityIndicator, TouchableOpacity, Platform, Dimensions } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { getLoginUrl } from "@/constants/oauth";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useAuthContext } from "@/contexts/auth-context";

/**
 * Web Login Screen - For QR Code Authentication
 * 
 * This screen is designed for desktop/web use:
 * 1. User opens this page on their computer
 * 2. Signs in with OAuth (Google/Microsoft/Apple)
 * 3. QR code is displayed with session token
 * 4. User scans QR code with mobile app
 * 5. Mobile app extracts token and logs in
 */
export default function WebLoginScreen() {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, loading: authLoading } = useAuthContext();

  // If already logged in, redirect to home
  useEffect(() => {
    if (user && !authLoading) {
      router.replace("/(tabs)");
    }
  }, [user, authLoading]);

  const handleWebLogin = async () => {
    try {
      setLoading(true);
      setError(null);

      // Open OAuth in browser
      const loginUrl = getLoginUrl();
      const result = await WebBrowser.openAuthSessionAsync(loginUrl, undefined);

      if (result.type === "success" && result.url) {
        // Extract session token from URL
        const url = new URL(result.url);
        const sessionToken = url.searchParams.get("sessionToken");

        if (sessionToken) {
          // Generate QR code with session token
          const response = await fetch(`/api/auth/generate-qr?token=${encodeURIComponent(sessionToken)}`);
          const data = await response.json();
          
          if (data.qrCode) {
            setQrCodeUrl(data.qrCode);
          } else {
            setError("Failed to generate QR code");
          }
        } else {
          setError("No session token received");
        }
      } else if (result.type === "cancel") {
        setError("Login cancelled");
      }
    } catch (err) {
      console.error("[WebLogin] Error:", err);
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (Platform.OS !== "web") {
    return (
      <ScreenContainer className="p-4 justify-center">
        <View className="items-center gap-4">
          <Text className="text-xl font-bold text-foreground text-center">
            This page is for desktop use only
          </Text>
          <Text className="text-muted text-center">
            Please open this page on your computer to generate a QR code for mobile login.
          </Text>
          
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4 justify-center">
      <View className="items-center gap-4 max-w-md self-center w-full">
        <Text className="text-2xl font-bold text-foreground text-center leading-tight">
          Sign In with QR Code
        </Text>

        {!qrCodeUrl && !loading && (
          <>
            <Text className="text-muted text-center">
              Click the button below to sign in. After authentication, a QR code will be displayed for you to scan with your mobile device.
            </Text>

            <TouchableOpacity
              onPress={handleWebLogin}
              className="bg-primary px-6 py-4 rounded-full mt-4"
            >
              <Text className="text-background font-semibold text-lg">
                Sign In
              </Text>
            </TouchableOpacity>
          </>
        )}

        {loading && (
          <View className="items-center gap-4">
            <ActivityIndicator size="large" color="#0a7ea4" />
            <Text className="text-muted">Signing in...</Text>
          </View>
        )}

        {qrCodeUrl && (
          <View className="items-center gap-4 bg-surface p-8 rounded-2xl">
            <Text className="text-lg font-semibold text-foreground">
              Scan this QR code with your mobile app
            </Text>
            
            <View className="bg-white p-4 rounded-xl">
              <Image
                source={{ uri: qrCodeUrl }}
                style={{ width: Math.min(300, Dimensions.get('window').width - 80), height: Math.min(300, Dimensions.get('window').width - 80) }}
                resizeMode="contain"
              />
            </View>

            <Text className="text-sm text-muted text-center mt-2">
              Open the mobile app and tap "Scan QR Code" to log in instantly
            </Text>

            <TouchableOpacity
              onPress={() => {
                setQrCodeUrl(null);
                handleWebLogin();
              }}
              className="mt-4 px-6 py-2 border border-border rounded-full"
            >
              <Text className="text-foreground">Generate New Code</Text>
            </TouchableOpacity>
          </View>
        )}

        {error && (
          <View className="bg-error/10 p-4 rounded-lg">
            <Text className="text-error text-center">{error}</Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}
