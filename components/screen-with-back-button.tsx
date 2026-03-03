import { View, ViewProps } from "react-native";
import { ScreenContainer, type ScreenContainerProps } from "./screen-container";
import { BackButton } from "./back-button";

interface ScreenWithBackButtonProps extends ScreenContainerProps {
  showBackButton?: boolean;
  onBackPress?: () => void;
  backButtonContainerClassName?: string;
}

/**
 * A ScreenContainer that automatically includes a back button at the top.
 * Use this for all detail screens, modal screens, and nested navigation.
 *
 * Usage:
 * ```tsx
 * <ScreenWithBackButton className="p-6">
 *   <Text>My Screen Content</Text>
 * </ScreenWithBackButton>
 * ```
 */
export function ScreenWithBackButton({
  children,
  showBackButton = true,
  onBackPress,
  backButtonContainerClassName = "px-6 pt-2",
  className,
  ...props
}: ScreenWithBackButtonProps) {
  return (
    <ScreenContainer {...props}>
      {showBackButton && (
        <BackButton
          onPress={onBackPress}
          containerClassName={backButtonContainerClassName}
        />
      )}
      <View className={className}>{children}</View>
    </ScreenContainer>
  );
}
