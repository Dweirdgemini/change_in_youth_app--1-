/**
 * Magic Link Verification Component
 * 
 * Handles the deep link callback and verifies the magic link token.
 * Shows loading state while verifying, then navigates to home on success.
 */

import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useRouter } from "expo-router";
import { ScreenContainer } from "./screen-container";
import { useColors } from "@/hooks/use-colors";

export interface MagicLinkVerificationProps {
  token?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function MagicLinkVerification({
  token,
  onSuccess,
  onError,
}: MagicLinkVerificationProps) {
  const colors = useColors();
  const router = useRouter();
  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No verification token provided");
      onError?.("No token");
      return;
    }

    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      setStatus("verifying");

      // Call backend to verify token
      const response = await fetch("http://localhost:3000/api/auth/verify-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        let message = "Verification failed";

        if (data.code === "LINK_EXPIRED") {
          message = "This link has expired. Please request a new one.";
        } else if (data.code === "LINK_INVALID") {
          message = "This link is invalid or has already been used.";
        } else if (data.code === "LINK_USED") {
          message = "This link has already been used. Please request a new one.";
        } else if (data.code === "NOT_FOUND") {
          message = "User not found. Please sign up first.";
        }

        setStatus("error");
        setErrorMessage(message);
        onError?.(message);
        return;
      }

      // Success - store session token
      const sessionToken = data.sessionToken;
      const userEmail = data.user?.email;

      await SecureStore.setItemAsync("sessionToken", sessionToken);
      if (userEmail) {
        await SecureStore.setItemAsync("userEmail", userEmail);
      }

      setStatus("success");
      onSuccess?.();

      // Navigate to home after brief delay
      setTimeout(() => {
        router.replace("/(tabs)/");
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error";
      setStatus("error");
      setErrorMessage(errorMessage);
      onError?.(errorMessage);
    }
  };

  if (status === "verifying") {
    return (
      <ScreenContainer className="items-center justify-center">
        <View className="items-center gap-4">
          <ActivityIndicator size="large" color={colors.primary} />
          <Text className="text-lg font-semibold text-foreground">
            Signing you in...
          </Text>
          <Text className="text-sm text-muted">
            Please wait while we verify your link
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  if (status === "success") {
    return (
      <ScreenContainer className="items-center justify-center">
        <View className="items-center gap-4">
          <View
            className="w-16 h-16 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.success }}
          >
            <Text className="text-3xl">✓</Text>
          </View>
          <Text className="text-lg font-semibold text-foreground">
            Sign in successful!
          </Text>
          <Text className="text-sm text-muted">
            Redirecting you to your dashboard...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  // Error state
  return (
    <ScreenContainer className="items-center justify-center p-6">
      <View className="items-center gap-4">
        <View
          className="w-16 h-16 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.error }}
        >
          <Text className="text-3xl">✕</Text>
        </View>
        <Text className="text-lg font-semibold text-foreground">
          Sign in failed
        </Text>
        <Text className="text-sm text-muted text-center">
          {errorMessage || "An error occurred while verifying your link"}
        </Text>
        <Text className="text-xs text-muted text-center mt-4">
          Please try requesting a new magic link or contact support.
        </Text>
      </View>
    </ScreenContainer>
  );
}
