import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useState, useEffect } from "react";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";

export default function PostJobScreen() {
  const colors = useColors();
  const [whatsappText, setWhatsappText] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [applicationLink, setApplicationLink] = useState("");
  const [tags, setTags] = useState("");
  const [deadline, setDeadline] = useState("");

  const createJobMutation = trpc.jobs.createJob.useMutation();

  // Auto-parse WhatsApp message when pasted
  useEffect(() => {
    if (whatsappText.trim()) {
      parseWhatsAppMessage(whatsappText);
    }
  }, [whatsappText]);

  const parseWhatsAppMessage = (text: string) => {
    const lines = text.split("\n").filter(line => line.trim());
    
    // Extract title (first line, remove location hashtag)
    const firstLine = lines[0] || "";
    const titleMatch = firstLine.replace(/#\w+/g, "").trim();
    if (titleMatch) setTitle(titleMatch);

    // Extract location from hashtag in first line (e.g., #WoodGreen -> Wood Green)
    const locationMatch = firstLine.match(/#(\w+)/);
    if (locationMatch) {
      const loc = locationMatch[1]
        .replace(/([A-Z])/g, " $1") // Add space before capital letters
        .trim();
      setLocation(loc);
    }

    // Extract application link
    const linkMatch = text.match(/https?:\/\/[^\s]+/);
    if (linkMatch) setApplicationLink(linkMatch[0]);

    // Extract category hashtags (not location hashtags)
    const allHashtags = text.match(/#\w+/g) || [];
    const categoryTags = allHashtags
      .filter(tag => !firstLine.includes(tag)) // Exclude location hashtag from first line
      .join(" ");
    if (categoryTags) setTags(categoryTags);
  };

  const handlePost = async () => {
    // Validation
    if (!title.trim()) {
      if (Platform.OS === "web") {
        alert("Please enter a job title");
      } else {
        Alert.alert("Validation Error", "Please enter a job title");
      }
      return;
    }

    if (!location.trim()) {
      if (Platform.OS === "web") {
        alert("Please enter the job location");
      } else {
        Alert.alert("Validation Error", "Please enter the job location");
      }
      return;
    }

    if (!applicationLink.trim()) {
      if (Platform.OS === "web") {
        alert("Please enter the application link");
      } else {
        Alert.alert("Validation Error", "Please enter the application link");
      }
      return;
    }

    if (!deadline.trim()) {
      if (Platform.OS === "web") {
        alert("Please enter the application deadline (YYYY-MM-DD format)");
      } else {
        Alert.alert("Validation Error", "Please enter the application deadline (YYYY-MM-DD format)");
      }
      return;
    }

    try {
      await createJobMutation.mutateAsync({
        title: title.trim(),
        location: location.trim(),
        applicationLink: applicationLink.trim(),
        tags: tags.trim(),
        applicationDeadline: deadline.trim(),
      });

      if (Platform.OS === "web") {
        alert("Job posted successfully!");
      } else {
        Alert.alert("Success", "Job posted successfully!");
      }

      // Reset form
      setWhatsappText("");
      setTitle("");
      setLocation("");
      setApplicationLink("");
      setTags("");
      setDeadline("");

      // Navigate back
      router.back();
    } catch (error: any) {
      if (Platform.OS === "web") {
        alert(`Error posting job: ${error.message}`);
      } else {
        Alert.alert("Error", `Failed to post job: ${error.message}`);
      }
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Header */}
          <View>
            <Text className="text-2xl font-bold text-foreground">Post Job Opportunity</Text>
            <Text className="text-base text-muted mt-1">
              Paste job from WhatsApp and fields will auto-fill
            </Text>
          </View>

          {/* WhatsApp Paste Area */}
          <View>
            <Text className="text-base font-semibold text-foreground mb-2">
              📱 Paste from WhatsApp
            </Text>
            <TextInput
              value={whatsappText}
              onChangeText={setWhatsappText}
              placeholder={"Team Member with KFC in #WoodGreen\n\nInfo/Apply: https://ow.ly/EVaY50XQjbo\n\n#HospitalityJobs #CustomerServiceJobs"}
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              className="bg-surface border border-border rounded-xl p-4 text-base text-foreground"
              style={{ minHeight: 120 }}
            />
            <Text className="text-sm text-muted mt-1">
              💡 Copy the entire job message from WhatsApp and paste here
            </Text>
          </View>

          {/* Divider */}
          <View className="border-t border-border" />

          {/* Auto-filled Fields */}
          <Text className="text-lg font-semibold text-foreground -mb-3">
            Auto-filled Fields (Edit if needed)
          </Text>

          {/* Job Title */}
          <View>
            <Text className="text-base font-semibold text-foreground mb-2">Job Title *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Team Member with KFC"
              placeholderTextColor={colors.muted}
              className="bg-surface border border-border rounded-xl p-4 text-base text-foreground"
            />
          </View>

          {/* Location */}
          <View>
            <Text className="text-base font-semibold text-foreground mb-2">Location *</Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Wood Green"
              placeholderTextColor={colors.muted}
              className="bg-surface border border-border rounded-xl p-4 text-base text-foreground"
            />
          </View>

          {/* Application Link */}
          <View>
            <Text className="text-base font-semibold text-foreground mb-2">Application Link *</Text>
            <TextInput
              value={applicationLink}
              onChangeText={setApplicationLink}
              placeholder="https://..."
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              className="bg-surface border border-border rounded-xl p-4 text-base text-foreground"
            />
          </View>

          {/* Tags */}
          <View>
            <Text className="text-base font-semibold text-foreground mb-2">
              Category Tags (Optional)
            </Text>
            <TextInput
              value={tags}
              onChangeText={setTags}
              placeholder="#HospitalityJobs #CustomerServiceJobs"
              placeholderTextColor={colors.muted}
              className="bg-surface border border-border rounded-xl p-4 text-base text-foreground"
            />
          </View>

          {/* Application Deadline */}
          <View>
            <Text className="text-base font-semibold text-foreground mb-2">
              Application Deadline *
            </Text>
            <TextInput
              value={deadline}
              onChangeText={setDeadline}
              placeholder="YYYY-MM-DD (e.g., 2026-02-15)"
              placeholderTextColor={colors.muted}
              className="bg-surface border border-border rounded-xl p-4 text-base text-foreground"
            />
            <Text className="text-sm text-muted mt-1">
              Use format: YYYY-MM-DD (e.g., 2026-02-15)
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => router.back()}
              className="flex-1 bg-surface border border-border rounded-full py-4"
              activeOpacity={0.7}
            >
              <Text className="text-center text-foreground font-semibold text-base">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePost}
              className="flex-1 bg-primary rounded-full py-4"
              activeOpacity={0.7}
              disabled={createJobMutation.isPending}
            >
              <Text className="text-center text-white font-semibold text-base">
                {createJobMutation.isPending ? "Posting..." : "Post Job"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
