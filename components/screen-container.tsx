import { View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { usePathname } from "expo-router";

import { cn } from "@/lib/utils";
import { BackButton } from "./back-button";

export interface ScreenContainerProps extends ViewProps {
  /**
   * SafeArea edges to apply. Defaults to ["top", "left", "right"].
   * Bottom is typically handled by Tab Bar.
   */
  edges?: Edge[];
  /**
   * Tailwind className for the content area.
   */
  className?: string;
  /**
   * Additional className for the outer container (background layer).
   */
  containerClassName?: string;
  /**
   * Additional className for the SafeAreaView (content layer).
   */
  safeAreaClassName?: string;
  /**
   * Whether to show the back button. Auto-detected based on route.
   */
  showBackButton?: boolean;
  /**
   * Custom back button handler
   */
  onBackPress?: () => void;
}

/**
 * A container component that properly handles SafeArea and background colors.
 *
 * The outer View extends to full screen (including status bar area) with the background color,
 * while the inner SafeAreaView ensures content is within safe bounds.
 *
 * Automatically shows a back button for non-tab screens.
 *
 * Usage:
 * ```tsx
 * <ScreenContainer className="p-4">
 *   <Text className="text-2xl font-bold text-foreground">
 *     Welcome
 *   </Text>
 * </ScreenContainer>
 * ```
 */
export function ScreenContainer({
  children,
  edges = ["top", "left", "right"],
  className,
  containerClassName,
  safeAreaClassName,
  showBackButton,
  onBackPress,
  style,
  ...props
}: ScreenContainerProps) {
  const pathname = usePathname();
  
  // Auto-detect if we should show back button
  // Show for all non-tab screens
  const isTabScreen = pathname === "/" || pathname.startsWith("/(tabs)");
  const shouldShowBackButton = showBackButton !== undefined ? showBackButton : !isTabScreen;

  return (
    <View
      className={cn(
        "flex-1",
        "bg-background",
        containerClassName
      )}
      {...props}
    >
      <SafeAreaView
        edges={edges}
        className={cn("flex-1", safeAreaClassName)}
        style={style}
      >
        {shouldShowBackButton && (
          <BackButton
            onPress={onBackPress}
            containerClassName="px-6 pt-2"
          />
        )}
        <View className={cn("flex-1", className)}>{children}</View>
      </SafeAreaView>
    </View>
  );
}
