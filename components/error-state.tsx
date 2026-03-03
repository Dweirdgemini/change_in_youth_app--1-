import { View, Text, TouchableOpacity } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

export interface ErrorStateProps {
  /**
   * SF Symbol icon name for the error state
   */
  icon: string;
  /**
   * Title text displayed to the user
   */
  title: string;
  /**
   * Description text providing more context about the error
   */
  description: string;
  /**
   * Optional label for the retry button
   * If not provided, no button is shown
   */
  retryLabel?: string;
  /**
   * Callback function when retry button is pressed
   */
  onRetry?: () => void;
  /**
   * Optional secondary action label (e.g., "Go Back")
   */
  secondaryLabel?: string;
  /**
   * Callback function for secondary action
   */
  onSecondary?: () => void;
}

/**
 * ErrorState Component
 *
 * Displays user-friendly error messages with optional retry and secondary action buttons.
 * Used when API calls fail, network is unavailable, or other error conditions occur.
 *
 * Features:
 * - Customizable icon, title, and description
 * - Optional retry button with haptic feedback
 * - Optional secondary action button
 * - Theme-aware colors (light/dark mode)
 * - Mobile-optimized centered layout
 *
 * Usage:
 * ```tsx
 * <ErrorState
 *   icon="exclamationmark.circle"
 *   title="Connection Error"
 *   description="Unable to load data. Please check your internet connection."
 *   retryLabel="Try Again"
 *   onRetry={() => refetch()}
 * />
 * ```
 */
export function ErrorState({
  icon,
  title,
  description,
  retryLabel,
  onRetry,
  secondaryLabel,
  onSecondary,
}: ErrorStateProps) {
  const colors = useColors();

  const handleRetry = () => {
    if (onRetry) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onRetry();
    }
  };

  const handleSecondary = () => {
    if (onSecondary) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSecondary();
    }
  };

  return (
    <View className="flex-1 justify-center items-center px-6 py-8 gap-4">
      {/* Error Icon */}
      <View className="mb-2">
        <IconSymbol
          name={icon as any}
          size={48}
          color={colors.error}
        />
      </View>

      {/* Title */}
      <Text className="text-lg font-semibold text-foreground text-center leading-tight">
        {title}
      </Text>

      {/* Description */}
      <Text className="text-sm text-muted text-center leading-relaxed">
        {description}
      </Text>

      {/* Action Buttons */}
      <View className="gap-3 w-full mt-4">
        {/* Retry Button */}
        {retryLabel && onRetry && (
          <TouchableOpacity
            className="bg-error rounded-full px-6 py-3 active:opacity-80"
            onPress={handleRetry}
          >
            <Text className="text-background font-semibold text-center">
              {retryLabel}
            </Text>
          </TouchableOpacity>
        )}

        {/* Secondary Action Button */}
        {secondaryLabel && onSecondary && (
          <TouchableOpacity
            className="bg-surface border border-border rounded-full px-6 py-3 active:opacity-70"
            onPress={handleSecondary}
          >
            <Text className="text-foreground font-semibold text-center">
              {secondaryLabel}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
