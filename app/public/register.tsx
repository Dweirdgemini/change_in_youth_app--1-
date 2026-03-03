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

export default function ParticipantRegistrationScreen() {
  const router = useRouter();
  const colors = useColors();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    ethnicity: "",
    postcode: "",
    referralSource: "",
  });

  const registerMutation = trpc.participants.register.useMutation();

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone) {
      Alert.alert("Error", "Please fill in all required fields (Name, Email, Phone)");
      return;
    }

    try {
      const result = await registerMutation.mutateAsync({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender || undefined,
        ethnicity: formData.ethnicity || undefined,
        postcode: formData.postcode || undefined,
        referralSource: formData.referralSource || undefined,
      });

      Alert.alert(
        "Registration Successful!",
        "Thank you for registering. A staff member will be in touch soon.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to register. Please try again.");
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

  return (
    <ScreenContainer>
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-border">
        
        <Text className="text-xl font-bold text-foreground flex-1">
          Participant Registration
        </Text>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Welcome Message */}
        <View className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-4">
          <Text className="text-base font-semibold text-foreground mb-2">
            Welcome to Change In Youth!
          </Text>
          <Text className="text-sm text-muted leading-relaxed">
            Please complete this registration form so we can better support you. All
            information is kept confidential and helps us improve our programs.
          </Text>
        </View>

        {/* Required Information */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Required Information
          </Text>

          <Text className="text-sm font-medium text-foreground mt-3 mb-1">
            Full Name *
          </Text>
          <TextInput
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter your full name"
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            placeholderTextColor={colors.muted}
          />

          <Text className="text-sm font-medium text-foreground mt-3 mb-1">
            Email Address *
          </Text>
          <TextInput
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="your.email@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            placeholderTextColor={colors.muted}
          />

          <Text className="text-sm font-medium text-foreground mt-3 mb-1">
            Phone Number *
          </Text>
          <TextInput
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="07XXX XXXXXX"
            keyboardType="phone-pad"
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            placeholderTextColor={colors.muted}
          />
        </View>

        {/* Optional Information */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Optional Information
          </Text>
          <Text className="text-sm text-muted mb-3">
            This helps us understand our participants better and track our impact.
          </Text>

          <Text className="text-sm font-medium text-foreground mt-3 mb-1">
            Date of Birth
          </Text>
          <TextInput
            value={formData.dateOfBirth}
            onChangeText={(text) => setFormData({ ...formData, dateOfBirth: text })}
            placeholder="DD/MM/YYYY"
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            placeholderTextColor={colors.muted}
          />

          <Text className="text-sm font-medium text-foreground mt-3 mb-1">
            Gender
          </Text>
          {renderChoice("gender", [
            { label: "Male", value: "male" },
            { label: "Female", value: "female" },
            { label: "Non-binary", value: "non-binary" },
            { label: "Prefer not to say", value: "prefer_not_to_say" },
          ])}

          <Text className="text-sm font-medium text-foreground mt-3 mb-1">
            Ethnicity
          </Text>
          {renderChoice("ethnicity", [
            { label: "White", value: "white" },
            { label: "Black", value: "black" },
            { label: "Asian", value: "asian" },
            { label: "Mixed", value: "mixed" },
            { label: "Other", value: "other" },
          ])}

          <Text className="text-sm font-medium text-foreground mt-3 mb-1">
            Postcode
          </Text>
          <TextInput
            value={formData.postcode}
            onChangeText={(text) =>
              setFormData({ ...formData, postcode: text.toUpperCase() })
            }
            placeholder="SW1A 1AA"
            autoCapitalize="characters"
            className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
            placeholderTextColor={colors.muted}
          />

          <Text className="text-sm font-medium text-foreground mt-3 mb-1">
            How did you hear about us?
          </Text>
          {renderChoice("referralSource", [
            { label: "School", value: "school" },
            { label: "Friend", value: "friend" },
            { label: "Social Media", value: "social_media" },
            { label: "Community Center", value: "community_center" },
            { label: "Other", value: "other" },
          ])}
        </View>

        {/* Consent */}
        <View className="bg-surface border border-border rounded-xl p-4 mb-4">
          <Text className="text-sm text-foreground">
            By submitting this form, you consent to Change In Youth CIC storing and
            processing your personal data in accordance with GDPR regulations. Your
            information will only be used to support your participation in our programs
            and will not be shared with third parties without your consent.
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={registerMutation.isPending}
          className="bg-primary rounded-lg py-4 mb-8"
          style={{ opacity: registerMutation.isPending ? 0.6 : 1 }}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {registerMutation.isPending ? "Registering..." : "Complete Registration"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
