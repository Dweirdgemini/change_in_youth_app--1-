import { useState, useEffect } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

export default function VideoCallScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const colors = useColors();
  const [attendanceId, setAttendanceId] = useState<number | null>(null);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const utils = trpc.useUtils();

  const startCallMutation = trpc.videoCalls.startCall.useMutation({
    onSuccess: (data) => {
      setAttendanceId(data.attendanceId);
      setCallStartTime(new Date(data.joinedAt as any));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
      router.back();
    },
  });

  const endCallMutation = trpc.videoCalls.endCall.useMutation({
    onSuccess: (data) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Call Ended",
        `Duration: ${data.durationMinutes} minutes\n\nYour attendance has been recorded and will be included in your next invoice.`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  // Start call on mount
  useEffect(() => {
    if (sessionId) {
      startCallMutation.mutate({ sessionId: parseInt(sessionId) });
    }
  }, [sessionId]);

  // Update elapsed time every minute
  useEffect(() => {
    if (!callStartTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - callStartTime.getTime()) / (1000 * 60));
      setElapsedMinutes(elapsed);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [callStartTime]);

  const handleEndCall = () => {
    if (!attendanceId) return;

    Alert.alert(
      "End Call",
      "Are you sure you want to end this call? Your attendance duration will be recorded.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "End Call",
          style: "destructive",
          onPress: () => {
            endCallMutation.mutate({ attendanceId });
          },
        },
      ]
    );
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (startCallMutation.isPending) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-foreground mt-4">Joining call...</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="bg-black">
      <View className="flex-1 items-center justify-center p-6">
        {/* Video Call Placeholder */}
        <View className="w-full aspect-video bg-surface rounded-2xl items-center justify-center mb-8">
          <Text className="text-6xl mb-4">📹</Text>
          <Text className="text-foreground font-semibold text-lg">Video Call Active</Text>
          <Text className="text-muted text-sm mt-2">
            In a real implementation, this would show the video feed
          </Text>
        </View>

        {/* Call Duration */}
        <View className="bg-surface/80 rounded-2xl p-6 mb-8 w-full">
          <Text className="text-center text-muted text-sm mb-2">Call Duration</Text>
          <Text className="text-center text-foreground font-bold text-4xl">
            {formatDuration(elapsedMinutes)}
          </Text>
          {callStartTime && (
            <Text className="text-center text-muted text-sm mt-2">
              Started at {callStartTime.toLocaleTimeString()}
            </Text>
          )}
        </View>

        {/* Attendance Info */}
        <View className="bg-primary/20 rounded-xl p-4 mb-8 w-full">
          <Text className="text-primary text-sm text-center">
            ✓ Your attendance is being tracked automatically
          </Text>
          <Text className="text-muted text-xs text-center mt-1">
            Payment will be calculated based on your actual call duration
          </Text>
        </View>

        {/* End Call Button */}
        <Pressable
          onPress={handleEndCall}
          disabled={endCallMutation.isPending}
          style={({ pressed }) => [
            {
              transform: [{ scale: pressed ? 0.95 : 1 }] as any,
              opacity: endCallMutation.isPending ? 0.5 : 1,
            },
          ]}
          className="bg-error rounded-full w-20 h-20 items-center justify-center"
        >
          {endCallMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-3xl">📞</Text>
          )}
        </Pressable>
        <Text className="text-white mt-3 font-semibold">End Call</Text>

        {/* Instructions */}
        <View className="mt-8 bg-surface/50 rounded-xl p-4 w-full">
          <Text className="text-foreground font-semibold mb-2">💡 How it works:</Text>
          <Text className="text-muted text-sm leading-relaxed">
            • Your join time is recorded when you enter{"\n"}
            • Duration is tracked automatically{"\n"}
            • Late arrivals are accounted for{"\n"}
            • Payment calculated on actual attendance{"\n"}
            • Added to your next invoice automatically
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
