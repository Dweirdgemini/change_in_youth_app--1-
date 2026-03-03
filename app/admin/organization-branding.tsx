import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";

export default function OrganizationBrandingScreen() {
  const colors = useColors();
  const { data: org, isLoading } = trpc.organizations.getMyOrganization.useQuery();
  const updateMutation = trpc.organizations.updateOrganization.useMutation();

  const [logoUrl, setLogoUrl] = useState<string>(org?.logoUrl || "");
  const [primaryColor, setPrimaryColor] = useState<string>(org?.primaryColor || "#0a7ea4");
  const [uploading, setUploading] = useState(false);

  const handlePickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      try {
        // In production, upload to S3 or your storage service
        // For now, use a placeholder
        const uploadedUrl = result.assets[0].uri;
        setLogoUrl(uploadedUrl);
        Alert.alert("Success", "Logo uploaded successfully");
      } catch (error) {
        Alert.alert("Error", "Failed to upload logo");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        logoUrl,
        primaryColor,
      });
      Alert.alert("Success", "Branding updated successfully");
      router.back();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update branding");
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
        <View style={{ gap: 24 }}>
          {/* Header */}
          <View>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ marginBottom: 16 }}
            >
              <Text style={{ fontSize: 16, color: colors.primary }}>← Back</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 28, fontWeight: "bold", color: colors.foreground }}>
              Organization Branding
            </Text>
            <Text style={{ fontSize: 14, color: colors.muted, marginTop: 4 }}>
              Customize your organization's appearance
            </Text>
          </View>

          {/* Logo Upload */}
          <View
            style={{
              backgroundColor: colors.surface,
              padding: 20,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 16,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Organization Logo
            </Text>

            {logoUrl ? (
              <View style={{ alignItems: "center", gap: 12 }}>
                <View
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: colors.background,
                    borderWidth: 2,
                    borderColor: colors.border,
                    overflow: "hidden",
                  }}
                >
                  {/* In production, use <Image source={{ uri: logoUrl }} /> */}
                  <View
                    style={{
                      flex: 1,
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: primaryColor + "20",
                    }}
                  >
                    <Text style={{ fontSize: 40, color: primaryColor }}>
                      {org?.name?.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handlePickLogo}
                  disabled={uploading}
                  style={{
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    backgroundColor: colors.primary,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: colors.background, fontWeight: "600" }}>
                    {uploading ? "Uploading..." : "Change Logo"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handlePickLogo}
                disabled={uploading}
                style={{
                  padding: 40,
                  backgroundColor: colors.background,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: colors.border,
                  borderStyle: "dashed",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 40 }}>📷</Text>
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                  {uploading ? "Uploading..." : "Upload Logo"}
                </Text>
                <Text style={{ fontSize: 14, color: colors.muted }}>
                  Tap to select an image
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Primary Color */}
          <View
            style={{
              backgroundColor: colors.surface,
              padding: 20,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 16,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.foreground }}>
              Primary Color
            </Text>

            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: primaryColor,
                  borderWidth: 2,
                  borderColor: colors.border,
                }}
              />
              <TextInput
                value={primaryColor}
                onChangeText={setPrimaryColor}
                placeholder="#0a7ea4"
                placeholderTextColor={colors.muted}
                style={{
                  flex: 1,
                  padding: 16,
                  backgroundColor: colors.background,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  color: colors.foreground,
                  fontSize: 16,
                }}
              />
            </View>

            <Text style={{ fontSize: 12, color: colors.muted }}>
              Enter a hex color code (e.g., #0a7ea4)
            </Text>

            {/* Color Presets */}
            <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
              {["#0a7ea4", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981"].map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => setPrimaryColor(color)}
                  style={{
                    width: 50,
                    height: 50,
                    borderRadius: 25,
                    backgroundColor: color,
                    borderWidth: primaryColor === color ? 3 : 2,
                    borderColor: primaryColor === color ? colors.foreground : colors.border,
                  }}
                />
              ))}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={updateMutation.isPending}
            style={{
              padding: 18,
              backgroundColor: colors.primary,
              borderRadius: 12,
              alignItems: "center",
              opacity: updateMutation.isPending ? 0.6 : 1,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.background }}>
              {updateMutation.isPending ? "Saving..." : "Save Branding"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
