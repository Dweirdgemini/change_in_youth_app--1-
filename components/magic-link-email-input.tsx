/**
 * Magic Link Email Input Component
 * 
 * Allows users to request a magic link by entering their email address.
 * Handles validation, loading states, and error messages.
 */

import React, { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

export interface MagicLinkEmailInputProps {
  onSuccess?: (email: string) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
}

export function MagicLinkEmailInput({
  onSuccess,
  onError,
  isLoading = false,
}: MagicLinkEmailInputProps) {
  const colors = useColors();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  };

  const handleRequestMagicLink = async () => {
    // Clear previous states
    setError(null);
    setSuccess(false);

    // Validate email
    if (!email.trim()) {
      setError("Please enter your email address");
      onError?.("Email is required");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      onError?.("Invalid email format");
      return;
    }

    setLoading(true);

    try {
      // Call backend API
      const response = await fetch("http://localhost:3000/api/auth/magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (data.code === "RATE_LIMITED") {
          const retryAfter = data.retryAfter || 3600;
          const minutes = Math.ceil(retryAfter / 60);
          setError(`Too many requests. Please try again in ${minutes} minutes.`);
          onError?.(`Rate limited. Retry after ${minutes} minutes.`);
        } else if (data.code === "INVALID_EMAIL") {
          setError("Invalid email format");
          onError?.("Invalid email format");
        } else {
          setError(data.error || "Failed to send magic link");
          onError?.(data.error || "Failed to send magic link");
        }
        return;
      }

      // Success
      setSuccess(true);
      setEmail("");
      onSuccess?.(email);

      // Show success message
      Alert.alert(
        "Check Your Email",
        `We've sent a login link to ${email}. Click the link to sign in.`,
        [{ text: "OK" }]
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="w-full gap-4">
      {/* Email Input */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-foreground">Email Address</Text>
        <TextInput
          className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-foreground"
          placeholder="you@example.com"
          placeholderTextColor={colors.muted}
          value={email}
          onChangeText={setEmail}
          editable={!loading && !isLoading}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="send"
          onSubmitEditing={handleRequestMagicLink}
        />
      </View>

      {/* Error Message */}
      {error && (
        <View className="rounded-lg bg-error/10 px-4 py-3">
          <Text className="text-sm text-error">{error}</Text>
        </View>
      )}

      {/* Success Message */}
      {success && (
        <View className="rounded-lg bg-success/10 px-4 py-3">
          <Text className="text-sm text-success">
            Check your email for the login link
          </Text>
        </View>
      )}

      {/* Request Button */}
      <TouchableOpacity
        onPress={handleRequestMagicLink}
        disabled={loading || isLoading || !email.trim()}
        className={cn(
          "w-full rounded-lg px-4 py-3 flex-row items-center justify-center gap-2",
          loading || isLoading
            ? "bg-primary/50"
            : email.trim()
            ? "bg-primary"
            : "bg-primary/30"
        )}
      >
        {loading || isLoading ? (
          <>
            <ActivityIndicator size="small" color={colors.background} />
            <Text className="font-semibold text-background">Sending...</Text>
          </>
        ) : (
          <Text className="font-semibold text-background">Send Magic Link</Text>
        )}
      </TouchableOpacity>

      {/* Info Text */}
      <Text className="text-xs text-muted text-center">
        We'll send you a secure link to sign in. No password needed.
      </Text>
    </View>
  );
}
