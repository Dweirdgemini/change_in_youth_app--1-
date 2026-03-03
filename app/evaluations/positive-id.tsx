import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function PositiveIdEvaluationScreen() {
  const router = useRouter();
  const colors = useColors();
  const [formData, setFormData] = useState({
    school: "",
    gender: "",
    age: "",
    feltSafe: "",
    helpedFeelBetter: "",
    comfortableAskingHelp: "",
    awareOfSupport: "",
    facilitatorsGoodJob: "",
    heritageImportant: "",
    heritageReason: "",
    wouldRecommend: "",
    enjoymentRating: 0,
    likedMost: "",
    improvements: "",
  });

  const submitMutation = trpc.positiveId.submitEvaluation.useMutation();

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.school || !formData.gender || !formData.age) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    if (formData.enjoymentRating === 0) {
      Alert.alert("Error", "Please rate your enjoyment");
      return;
    }

    try {
      await submitMutation.mutateAsync({
        school: formData.school,
        gender: formData.gender,
        age: parseInt(formData.age),
        feltSafe: formData.feltSafe as "agree" | "disagree",
        helpedFeelBetter: formData.helpedFeelBetter as "agree" | "disagree",
        comfortableAskingHelp: formData.comfortableAskingHelp as "agree" | "disagree",
        awareOfSupport: formData.awareOfSupport as "yes" | "no" | "maybe",
        facilitatorsGoodJob: formData.facilitatorsGoodJob as "agree" | "disagree",
        heritageImportant: formData.heritageImportant as "agree" | "disagree",
        heritageReason: formData.heritageReason,
        wouldRecommend: formData.wouldRecommend as "agree" | "disagree",
        enjoymentRating: formData.enjoymentRating,
        likedMost: formData.likedMost,
        improvements: formData.improvements,
      });

      Alert.alert("Success", "Thank you for your feedback!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to submit evaluation");
    }
  };

  const renderChoice = (
    field: keyof typeof formData,
    options: { label: string; value: string }[]
  ) => (
    <View className="flex-row flex-wrap gap-2 mt-2">
      {options.map((option) => (
        <TouchableOpacity
          key={option.value}
          onPress={() => setFormData({ ...formData, [field]: option.value })}
          className={`px-4 py-2 rounded-full border ${
            formData[field] === option.value
              ? "bg-primary border-primary"
              : "bg-surface border-border"
          }`}
        >
          <Text
            className={`font-medium ${
              formData[field] === option.value ? "text-white" : "text-foreground"
            }`}
          >
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderRating = () => (
    <View className="flex-row gap-2 mt-2">
      {[1, 2, 3, 4, 5].map((rating) => (
        <TouchableOpacity
          key={rating}
          onPress={() => setFormData({ ...formData, enjoymentRating: rating })}
        >
          <Ionicons
            name={formData.enjoymentRating >= rating ? "star" : "star-outline"}
            size={40}
            color={formData.enjoymentRating >= rating ? "#FFB800" : colors.muted}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-border">
        
        <Text className="text-xl font-bold text-foreground flex-1">
          Positive ID Evaluation
        </Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Demographics */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-2">
            About You
          </Text>

          <Text className="text-sm font-medium text-foreground mt-3 mb-1">
            School *
          </Text>
          <TextInput
            value={formData.school}
            onChangeText={(text) => setFormData({ ...formData, school: text })}
            placeholder="Enter your school name"
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            placeholderTextColor={colors.muted}
          />

          <Text className="text-sm font-medium text-foreground mt-3 mb-1">
            Gender *
          </Text>
          {renderChoice("gender", [
            { label: "Male", value: "male" },
            { label: "Female", value: "female" },
            { label: "Other", value: "other" },
            { label: "Prefer not to say", value: "prefer_not_to_say" },
          ])}

          <Text className="text-sm font-medium text-foreground mt-3 mb-1">
            Age *
          </Text>
          <TextInput
            value={formData.age}
            onChangeText={(text) => setFormData({ ...formData, age: text })}
            placeholder="Enter your age"
            keyboardType="numeric"
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            placeholderTextColor={colors.muted}
          />
        </View>

        {/* Safety & Support */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Safety & Support
          </Text>

          <Text className="text-sm text-foreground mb-1">
            I felt safe during the sessions
          </Text>
          {renderChoice("feltSafe", [
            { label: "Agree", value: "agree" },
            { label: "Disagree", value: "disagree" },
          ])}

          <Text className="text-sm text-foreground mt-4 mb-1">
            The sessions helped me feel better about myself
          </Text>
          {renderChoice("helpedFeelBetter", [
            { label: "Agree", value: "agree" },
            { label: "Disagree", value: "disagree" },
          ])}

          <Text className="text-sm text-foreground mt-4 mb-1">
            I felt comfortable asking for help when I needed it
          </Text>
          {renderChoice("comfortableAskingHelp", [
            { label: "Agree", value: "agree" },
            { label: "Disagree", value: "disagree" },
          ])}

          <Text className="text-sm text-foreground mt-4 mb-1">
            Are you aware of where to get support if you need it?
          </Text>
          {renderChoice("awareOfSupport", [
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
            { label: "Maybe", value: "maybe" },
          ])}
        </View>

        {/* Facilitators */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">
            About the Facilitators
          </Text>

          <Text className="text-sm text-foreground mb-1">
            The facilitators did a good job
          </Text>
          {renderChoice("facilitatorsGoodJob", [
            { label: "Agree", value: "agree" },
            { label: "Disagree", value: "disagree" },
          ])}
        </View>

        {/* Heritage */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Heritage & Identity
          </Text>

          <Text className="text-sm text-foreground mb-1">
            It's important to me to learn about my heritage
          </Text>
          {renderChoice("heritageImportant", [
            { label: "Agree", value: "agree" },
            { label: "Disagree", value: "disagree" },
          ])}

          <Text className="text-sm font-medium text-foreground mt-3 mb-1">
            Why is this important to you?
          </Text>
          <TextInput
            value={formData.heritageReason}
            onChangeText={(text) =>
              setFormData({ ...formData, heritageReason: text })
            }
            placeholder="Share your thoughts..."
            multiline
            numberOfLines={3}
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            placeholderTextColor={colors.muted}
            textAlignVertical="top"
          />
        </View>

        {/* Recommendation */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Recommendation
          </Text>

          <Text className="text-sm text-foreground mb-1">
            I would recommend this program to a friend
          </Text>
          {renderChoice("wouldRecommend", [
            { label: "Agree", value: "agree" },
            { label: "Disagree", value: "disagree" },
          ])}
        </View>

        {/* Overall Experience */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Overall Experience
          </Text>

          <Text className="text-sm font-medium text-foreground mb-1">
            How much did you enjoy the program? *
          </Text>
          {renderRating()}

          <Text className="text-sm font-medium text-foreground mt-4 mb-1">
            What did you like most?
          </Text>
          <TextInput
            value={formData.likedMost}
            onChangeText={(text) => setFormData({ ...formData, likedMost: text })}
            placeholder="Tell us what you enjoyed..."
            multiline
            numberOfLines={3}
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            placeholderTextColor={colors.muted}
            textAlignVertical="top"
          />

          <Text className="text-sm font-medium text-foreground mt-4 mb-1">
            What could we improve?
          </Text>
          <TextInput
            value={formData.improvements}
            onChangeText={(text) =>
              setFormData({ ...formData, improvements: text })
            }
            placeholder="Share your suggestions..."
            multiline
            numberOfLines={3}
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            placeholderTextColor={colors.muted}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitMutation.isPending}
          className="bg-primary rounded-lg py-4 mb-8"
          style={{ opacity: submitMutation.isPending ? 0.6 : 1 }}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {submitMutation.isPending ? "Submitting..." : "Submit Evaluation"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
