import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

/**
 * Provides haptic feedback for navigation and user interactions.
 * Only triggers on native platforms (iOS/Android), not on web.
 */
export function useHapticFeedback() {
  const triggerLight = async () => {
    if (Platform.OS !== "web") {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (error) {
        // Silently fail if haptics not available
        console.debug("Haptics not available:", error);
      }
    }
  };

  const triggerMedium = async () => {
    if (Platform.OS !== "web") {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (error) {
        console.debug("Haptics not available:", error);
      }
    }
  };

  const triggerSuccess = async () => {
    if (Platform.OS !== "web") {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (error) {
        console.debug("Haptics not available:", error);
      }
    }
  };

  return {
    triggerLight,
    triggerMedium,
    triggerSuccess,
  };
}
