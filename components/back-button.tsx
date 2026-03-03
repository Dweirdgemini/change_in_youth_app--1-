import { TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useHapticFeedback } from "@/hooks/use-haptic-feedback";

interface BackButtonProps {
  onPress?: () => void;
  size?: number;
  containerClassName?: string;
}

export function BackButton({
  onPress,
  size = 24,
  containerClassName = "mb-4",
}: BackButtonProps) {
  const router = useRouter();
  const colors = useColors();

  const { triggerLight } = useHapticFeedback();

  const handlePress = async () => {
    await triggerLight();
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <View className={containerClassName}>
      <TouchableOpacity
        onPress={handlePress}
        className="flex-row items-center gap-2 active:opacity-70"
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="chevron-back" size={size} color={colors.foreground} />
      </TouchableOpacity>
    </View>
  );
}
