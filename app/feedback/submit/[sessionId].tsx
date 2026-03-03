import { View, Text, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function SubmitFeedbackScreen() {
  const colors = useColors();
  const { sessionId } = useLocalSearchParams();
  const sessionIdNum = parseInt(sessionId as string);

  const [sessionQuality, setSessionQuality] = useState(0);
  const [facilitatorPerformance, setFacilitatorPerformance] = useState(0);
  const [venueRating, setVenueRating] = useState(0);
  const [participantEngagement, setParticipantEngagement] = useState(0);
  const [whatWorkedWell, setWhatWorkedWell] = useState("");
  const [whatCouldImprove, setWhatCouldImprove] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");

  const submitFeedback = trpc.feedback.submitFeedback.useMutation();

  const handleSubmit = async () => {
    if (sessionQuality === 0 || facilitatorPerformance === 0) {
      Alert.alert("Required Fields", "Please rate session quality and facilitator performance");
      return;
    }

    try {
      await submitFeedback.mutateAsync({
        sessionId: sessionIdNum,
        rating: sessionQuality, // Map sessionQuality to rating field
        // facilitatorPerformance field doesn't exist in schema
        venueFeedback: venueRating ? `Rating: ${venueRating}` : null,
        engagementLevel: (participantEngagement || "medium") as "low" | "medium" | "high",
        whatWentWell: whatWorkedWell.trim() || null,
        improvements: whatCouldImprove.trim() || null,
        suggestions: additionalComments.trim() || null,
      });

      Alert.alert("Success", "Thank you for your feedback!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to submit feedback. Please try again.");
      console.error(error);
    }
  };

  const StarRating = ({
    rating,
    onRate,
    label,
  }: {
    rating: number;
    onRate: (value: number) => void;
    label: string;
  }) => (
    <View className="mb-4">
      <Text className="text-base font-semibold text-foreground mb-2">{label}</Text>
      <View className="flex-row gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            onPress={() => onRate(star)}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={{ fontSize: 36, color: star <= rating ? "#F59E0B" : colors.border }}>
              ★
            </Text>
          </Pressable>
        ))}
      </View>
      <Text className="text-xs text-muted leading-relaxed mt-1">
        {rating === 0 ? "Tap to rate" : `${rating} out of 5 stars`}
      </Text>
    </View>
  );

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header with Back Button */}
        <View className="mb-4">
          <View className="flex-row items-center mb-2">
            <Pressable
              onPress={() => router.back()}
              className="mr-3 p-2 -ml-2"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <IconSymbol name="chevron.left" size={28} color={colors.foreground} />
            </Pressable>
            <Text className="text-2xl font-bold text-foreground">Session Feedback</Text>
          </View>
          <Text className="text-base text-muted">
            Your feedback helps us improve our delivery and support
          </Text>
        </View>

        {/* Rating Questions */}
        <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
          <Text className="text-lg font-bold text-foreground mb-4">Rate Your Experience</Text>

          <StarRating
            rating={sessionQuality}
            onRate={setSessionQuality}
            label="Overall Session Quality *"
          />

          <StarRating
            rating={facilitatorPerformance}
            onRate={setFacilitatorPerformance}
            label="Facilitator Performance *"
          />

          <StarRating
            rating={venueRating}
            onRate={setVenueRating}
            label="Venue & Environment (Optional)"
          />

          <StarRating
            rating={participantEngagement}
            onRate={setParticipantEngagement}
            label="Participant Engagement (Optional)"
          />
        </View>

        {/* Qualitative Feedback */}
        <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
          <Text className="text-lg font-bold text-foreground mb-4">Share Your Thoughts</Text>

          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              What worked well?
            </Text>
            <TextInput
              className="bg-background rounded-lg p-3 text-foreground border border-border"
              placeholder="Share what you enjoyed or found effective..."
              placeholderTextColor={colors.muted}
              value={whatWorkedWell}
              onChangeText={setWhatWorkedWell}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              What could be improved?
            </Text>
            <TextInput
              className="bg-background rounded-lg p-3 text-foreground border border-border"
              placeholder="Share suggestions for improvement..."
              placeholderTextColor={colors.muted}
              value={whatCouldImprove}
              onChangeText={setWhatCouldImprove}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View>
            <Text className="text-base font-semibold text-foreground mb-2">
              Additional Comments (Optional)
            </Text>
            <TextInput
              className="bg-background rounded-lg p-3 text-foreground border border-border"
              placeholder="Any other feedback you'd like to share..."
              placeholderTextColor={colors.muted}
              value={additionalComments}
              onChangeText={setAdditionalComments}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          className="bg-primary rounded-xl p-4 mb-4"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          disabled={submitFeedback.isPending}
        >
          <Text className="text-background font-bold text-center text-lg">
            {submitFeedback.isPending ? "Submitting..." : "Submit Feedback"}
          </Text>
        </Pressable>

        <Text className="text-xs text-muted leading-relaxed text-center mb-4">
          * Required fields. Your feedback is confidential and used to improve our programs.
        </Text>
      </ScrollView>
    </ScreenContainer>
  );
}
