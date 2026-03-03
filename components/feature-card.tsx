import { View, Text, TouchableOpacity } from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: string;
  label: string;
  description?: string;
  onPress: () => void;
  variant?: "default" | "primary" | "success" | "warning" | "error";
  size?: "small" | "medium";
}

const VARIANT_STYLES = {
  default: "bg-surface border border-border",
  primary: "bg-primary/10 border border-primary/30",
  success: "bg-success/10 border border-success/30",
  warning: "bg-warning/10 border border-warning/30",
  error: "bg-error/10 border border-error/30",
};

const VARIANT_ICON_COLORS = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
};

export function FeatureCard({
  icon,
  label,
  description,
  onPress,
  variant = "default",
  size = "medium",
}: FeatureCardProps) {
  const colors = useColors();
  const iconColor =
    variant === "default"
      ? colors.foreground
      : variant === "primary"
        ? colors.primary
        : variant === "success"
          ? colors.success
          : variant === "warning"
            ? colors.warning
            : colors.error;

  return (
    <TouchableOpacity
      className={cn(
        "rounded-lg active:opacity-70",
        VARIANT_STYLES[variant],
        size === "small" ? "p-2" : "p-3"
      )}
      onPress={onPress}
    >
      <View className="flex-row items-start gap-2">
        <View
          className={cn(
            "rounded-lg items-center justify-center flex-shrink-0",
            size === "small" ? "w-7 h-7" : "w-9 h-9"
          )}
        >
          <IconSymbol
            name={icon as any}
            size={size === "small" ? 14 : 18}
            color={iconColor}
          />
        </View>
        <View className="flex-1">
          <Text
            className={cn(
              "font-semibold text-foreground leading-tight",
              size === "small" ? "text-xs" : "text-sm"
            )}
          >
            {label}
          </Text>
          {description && (
            <Text className="text-xs text-muted mt-0.5 leading-tight">
              {description}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}
