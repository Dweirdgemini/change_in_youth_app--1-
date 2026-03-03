import { RefreshControl as RNRefreshControl, type RefreshControlProps } from "react-native";
import { useColors } from "@/hooks/use-colors";

interface CustomRefreshControlProps extends Omit<RefreshControlProps, "tintColor"> {
  /**
   * Whether the refresh control is currently refreshing
   */
  refreshing: boolean;
  /**
   * Callback when user pulls to refresh
   */
  onRefresh: () => void;
}

/**
 * A themed RefreshControl component that matches the app's color scheme.
 * Use this in ScrollView or FlatList for pull-to-refresh functionality.
 *
 * Usage:
 * ```tsx
 * <ScrollView
 *   refreshControl={
 *     <RefreshControl
 *       refreshing={isRefreshing}
 *       onRefresh={handleRefresh}
 *     />
 *   }
 * >
 *   Content here
 * </ScrollView>
 * ```
 */
export function RefreshControl({
  refreshing,
  onRefresh,
  ...props
}: CustomRefreshControlProps) {
  const colors = useColors();

  return (
    <RNRefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.primary}
      progressBackgroundColor={colors.surface}
      {...props}
    />
  );
}
