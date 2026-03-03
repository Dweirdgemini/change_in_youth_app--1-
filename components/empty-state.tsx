import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * EmptyState component for displaying friendly messages when lists are empty.
 * Used across jobs, tasks, messages, schedule, and other list screens.
 */
export function EmptyState({
  icon = "inbox",
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  const colors = useColors();

  return (
    <View className={cn("flex-1 items-center justify-center gap-4 p-6", className)}>
      {/* Icon */}
      <View className="rounded-full bg-surface p-4">
        <MaterialIcons name={icon as any} size={48} color={colors.muted} />
      </View>

      {/* Title */}
      <Text className="text-xl font-semibold text-center text-foreground">{title}</Text>

      {/* Description */}
      <Text className="text-base text-center text-muted leading-relaxed max-w-xs">
        {description}
      </Text>

      {/* Action Button (Optional) */}
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          className="mt-4 px-6 py-3 rounded-full bg-primary"
          activeOpacity={0.8}
        >
          <Text className="text-base font-semibold text-background text-center">
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
