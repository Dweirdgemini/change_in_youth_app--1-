import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

export default function RecordingsScreen() {
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecording, setSelectedRecording] = useState<number | null>(null);

  const { data: recordings, isLoading } = trpc.meetingRecordings.getAllRecordings.useQuery();
  const { data: searchResults } = trpc.meetingRecordings.searchTranscripts.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 2 }
  );

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  const displayRecordings = searchQuery.length > 2 ? searchResults : recordings;

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">
            Meeting Recordings
          </Text>
          <Text className="text-sm text-muted leading-relaxed">
            Last 10 meetings with transcripts
          </Text>
        </View>

        {/* Search */}
        <View className="mb-4">
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search transcripts..."
            placeholderTextColor={colors.muted}
            className="bg-surface border border-border rounded-xl p-4 text-foreground"
          />
          {searchQuery.length > 0 && searchQuery.length <= 2 && (
            <Text className="text-xs text-muted leading-relaxed mt-2">
              Type at least 3 characters to search
            </Text>
          )}
        </View>

        {/* Recordings List */}
        {displayRecordings && displayRecordings.length > 0 ? (
          <View className="gap-4">
            {displayRecordings.map((recording) => (
              <View
                key={recording.sessionId}
                className="bg-surface rounded-xl p-4 border border-border"
              >
                {/* Recording Header */}
                <View className="flex-row items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground mb-1">
                      {recording.sessionTitle}
                    </Text>
                    <Text className="text-sm text-muted leading-relaxed">
                      {new Date(recording.sessionDate).toLocaleDateString()} •{" "}
                      {formatDuration(recording.duration)}
                    </Text>
                  </View>
                  <View className="bg-primary/20 px-3 py-1 rounded-full">
                    <Text className="text-xs font-semibold text-primary">
                      RECORDED
                    </Text>
                  </View>
                </View>

                {/* Transcript Preview */}
                {recording.transcript && (
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedRecording(
                        selectedRecording === recording.sessionId
                          ? null
                          : recording.sessionId
                      );
                    }}
                    style={({ pressed }) => [
                      {
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                    className="bg-background rounded-lg p-3 mb-3"
                  >
                    <View className="flex-row items-center justify-between mb-2">
                      <Text className="text-sm font-semibold text-foreground">
                        📝 Transcript
                      </Text>
                      <Text className="text-xs text-primary">
                        {selectedRecording === recording.sessionId ? "Hide" : "Show"}
                      </Text>
                    </View>
                    {selectedRecording === recording.sessionId && (
                      <Text className="text-sm text-muted leading-relaxed">
                        {recording.transcript}
                      </Text>
                    )}
                  </Pressable>
                )}

                {/* Action Buttons */}
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => {
                      // In a real app, this would play the recording
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }}
                    style={({ pressed }) => [
                      {
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                    className="flex-1 bg-primary rounded-xl py-3"
                  >
                    <Text className="text-center text-white font-semibold">
                      ▶️ Play Recording
                    </Text>
                  </Pressable>

                  {recording.transcriptUrl && (
                    <Pressable
                      onPress={() => {
                        // In a real app, this would download the transcript
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      }}
                      style={({ pressed }) => [
                        {
                          opacity: pressed ? 0.7 : 1,
                        },
                      ]}
                      className="bg-surface border border-border rounded-xl px-4 py-3"
                    >
                      <Text className="text-center text-foreground font-semibold">
                        📄
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="items-center justify-center py-12">
            <Text className="text-6xl mb-4">🎙️</Text>
            <Text className="text-base text-muted text-center leading-relaxed">
              {searchQuery ? "No recordings found" : "No recordings yet"}
            </Text>
            <Text className="text-sm text-muted text-center mt-2">
              {searchQuery
                ? "Try a different search term"
                : "Meeting recordings will appear here"}
            </Text>
          </View>
        )}

        {/* Info Box */}
        <View className="bg-primary/10 rounded-xl p-4 mt-4">
          <Text className="text-primary font-semibold mb-2">
            💡 How it works
          </Text>
          <Text className="text-muted text-sm leading-relaxed">
            • Meetings are automatically recorded{"\n"}
            • Transcripts are generated using speech-to-text{"\n"}
            • Only the last 10 recordings are kept{"\n"}
            • Search transcripts to find specific discussions{"\n"}
            • Download transcripts for your records
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
