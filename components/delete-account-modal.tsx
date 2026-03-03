/**
 * Delete Account Modal Component
 * 
 * Displays a confirmation modal for account deletion with:
 * - Clear warning about irreversibility
 * - Email confirmation input
 * - Loading state during deletion
 * - Error handling
 * - Success confirmation
 */

import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { useAuth } from "@/hooks/use-auth";
import { apiCall } from "@/lib/_core/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SESSION_TOKEN_KEY } from "@/constants/oauth";

export interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DeleteAccountModal({
  visible,
  onClose,
  onSuccess,
}: DeleteAccountModalProps) {
  const { user } = useAuth();
  const [confirmEmail, setConfirmEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    if (!user?.email) {
      setError("Unable to verify your email address");
      return;
    }

    // Validate email confirmation
    if (!confirmEmail.trim()) {
      setError("Please enter your email to confirm");
      return;
    }

    if (confirmEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
      setError("Email does not match your account email");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Call delete account API
      const response = await apiCall<{
        status: string;
        deletedAt: string;
        message: string;
      }>("/api/v1/users/me", {
        method: "DELETE",
        body: JSON.stringify({ confirmEmail: confirmEmail.trim() }),
      });

      // Success - clear session and sign out
      await AsyncStorage.removeItem(SESSION_TOKEN_KEY);
      await AsyncStorage.removeItem("manus-runtime-user-info");

      Alert.alert(
        "Account Deleted",
        "Your account and personal data have been permanently deleted. You will be signed out.",
        [
          {
            text: "OK",
            onPress: () => {
              setIsLoading(false);
              onSuccess();
            },
          },
        ]
      );
    } catch (err) {
      setIsLoading(false);
      const errorMessage = err instanceof Error ? err.message : "Failed to delete account";

      if (errorMessage.includes("Email confirmation does not match")) {
        setError("Email does not match your account email");
      } else if (errorMessage.includes("Unauthorized")) {
        setError("You must be logged in to delete your account");
      } else {
        setError(errorMessage || "Failed to delete account. Please try again.");
      }
    }
  };

  const handleCancel = () => {
    setConfirmEmail("");
    setError(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View className="flex-1 bg-black/50 items-center justify-center p-4">
        <View className="bg-background rounded-2xl w-full max-w-sm p-6 gap-4">
          {/* Header */}
          <View className="gap-2">
            <Text className="text-2xl font-bold text-foreground">Delete account</Text>
            <Text className="text-sm text-muted leading-relaxed">
              This will permanently delete your account and all associated personal data. This
              action is irreversible.
            </Text>
          </View>

          {/* Warning Box */}
          <View className="bg-error/10 border border-error/30 rounded-lg p-3">
            <Text className="text-sm text-error font-semibold">⚠️ Warning</Text>
            <Text className="text-xs text-error/90 mt-1 leading-relaxed">
              Once deleted, your account cannot be recovered. All your data will be permanently
              removed.
            </Text>
          </View>

          {/* Email Confirmation Input */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">
              Confirm your email address
            </Text>
            <Text className="text-xs text-muted mb-2">
              Type your email address to confirm: {user?.email}
            </Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-base"
              placeholder="Enter your email"
              placeholderTextColor="#9BA1A6"
              value={confirmEmail}
              onChangeText={(text) => {
                setConfirmEmail(text);
                setError(null);
              }}
              editable={!isLoading}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-error/10 border border-error/30 rounded-lg p-3">
              <Text className="text-sm text-error">{error}</Text>
            </View>
          )}

          {/* Buttons */}
          <View className="flex-row gap-3 mt-4">
            <TouchableOpacity
              className="flex-1 bg-surface border border-border rounded-lg py-3 active:opacity-70"
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text className="text-foreground font-semibold text-center">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-error rounded-lg py-3 active:opacity-80"
              onPress={handleDeleteAccount}
              disabled={isLoading || !confirmEmail.trim()}
              style={{
                opacity: isLoading || !confirmEmail.trim() ? 0.6 : 1,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-background font-semibold text-center">Delete permanently</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Info Text */}
          <Text className="text-xs text-muted text-center leading-relaxed mt-2">
            If you have any questions, contact support@changeinyouth.org.uk
          </Text>
        </View>
      </View>
    </Modal>
  );
}
