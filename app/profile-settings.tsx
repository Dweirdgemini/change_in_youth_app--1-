import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { getRoleLabel } from "@/lib/role-formatter";
import { router } from "expo-router";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { trpc } from "@/lib/trpc";

export default function ProfileSettingsScreen() {
  const { user, isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const { data: profileData } = trpc.userProfile.getMyProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const uploadMutation = trpc.fileUpload.uploadProfileImage.useMutation();
  const updateProfileMutation = trpc.userProfile.updateProfile.useMutation();
  
  // Update local state when profile data loads
  useState(() => {
    if (profileData) {
      setName(profileData.name || "");
      setEmail(profileData.email || "");
      setProfileImage(profileData.profileImageUrl || null);
    }
  });

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="p-4 justify-center">
        <View className="items-center gap-4">
          <Text className="text-2xl font-bold text-foreground text-center leading-tight">
            Sign in to access profile settings
          </Text>
          <TouchableOpacity
            className="bg-primary px-6 py-4 rounded-full mt-4 active:opacity-80"
            onPress={() => router.push("/login" as any)}
          >
            <Text className="text-background font-semibold text-lg">Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your photo library to upload a profile picture.",
          [{ text: "OK" }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setProfileImage(uri);
        
        // Upload to server
        try {
          setUploading(true);
          
          // Read file as base64 using Expo FileSystem
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          // Add data URI prefix
          const base64data = `data:image/jpeg;base64,${base64}`;
          
          const uploadResult = await uploadMutation.mutateAsync({
            imageData: base64data,
            fileName: `profile-${Date.now()}.jpg`,
            contentType: "image/jpeg",
          });
          
          // Save the uploaded image URL to database
          await updateProfileMutation.mutateAsync({
            profileImageUrl: uploadResult.url,
          });
          
          // Refresh profile data
          utils.userProfile.getMyProfile.invalidate();
          
          setUploading(false);
          Alert.alert("Success", "Profile image uploaded successfully!");
        } catch (error: any) {
          console.error("Upload error:", error);
          setUploading(false);
          Alert.alert("Upload Failed", error.message || "Failed to upload image. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to your camera to take a profile picture.",
          [{ text: "OK" }]
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setProfileImage(uri);
        
        // Upload to server
        try {
          setUploading(true);
          
          // Read file as base64 using Expo FileSystem
          const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          
          // Add data URI prefix
          const base64data = `data:image/jpeg;base64,${base64}`;
          
          const uploadResult = await uploadMutation.mutateAsync({
            imageData: base64data,
            fileName: `profile-${Date.now()}.jpg`,
            contentType: "image/jpeg",
          });
          
          // Save the uploaded image URL to database
          await updateProfileMutation.mutateAsync({
            profileImageUrl: uploadResult.url,
          });
          
          // Refresh profile data
          utils.userProfile.getMyProfile.invalidate();
          
          setUploading(false);
          Alert.alert("Success", "Profile image uploaded successfully!");
        } catch (error: any) {
          console.error("Upload error:", error);
          setUploading(false);
          Alert.alert("Upload Failed", error.message || "Failed to upload image. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error taking photo:", error);
      Alert.alert("Error", "Failed to take photo. Please try again.");
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      await updateProfileMutation.mutateAsync({
        name: name || undefined,
        email: email || undefined,
      });
      
      // Refresh profile data
      utils.userProfile.getMyProfile.invalidate();
      
      setSaving(false);
      Alert.alert(
        "Success",
        "Profile settings saved successfully!",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error: any) {
      setSaving(false);
      Alert.alert("Error", error.message || "Failed to save profile settings");
    }
  };

  return (
    <ScreenContainer>
      <View className="flex-1 p-6 gap-4">
        {/* Header */}
        <View className="flex-row items-center justify-between">
          
          <Text className="text-2xl font-bold text-foreground">Profile Settings</Text>
          <View style={{ width: 60 }} />
        </View>

        {/* Profile Image */}
        <View className="items-center gap-4">
          <View className="relative">
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={{ width: 120, height: 120, borderRadius: 60 }}
              />
            ) : (
              <View className="w-30 h-30 rounded-full bg-primary/10 items-center justify-center">
                <Text className="text-5xl font-bold text-primary">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </Text>
              </View>
            )}
            <TouchableOpacity
              className="absolute bottom-0 right-0 bg-primary w-10 h-10 rounded-full items-center justify-center active:opacity-80"
              onPress={() => {
                Alert.alert(
                  "Change Profile Picture",
                  "Choose an option",
                  [
                    { text: "Take Photo", onPress: takePhoto },
                    { text: "Choose from Library", onPress: pickImage },
                    { text: "Cancel", style: "cancel" },
                  ]
                );
              }}
            >
              <Text className="text-background text-xl">📷</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-sm text-muted leading-relaxed">Tap camera icon to change photo</Text>
        </View>

        {/* Form Fields */}
        <View className="gap-4">
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Name</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              placeholderTextColor="#9BA1A6"
            />
          </View>

          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Email</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor="#9BA1A6"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Role</Text>
            <View className="bg-surface border border-border rounded-xl px-4 py-3">
              <Text className="text-foreground">{getRoleLabel(user?.role)}</Text>
            </View>
            <Text className="text-xs text-muted leading-relaxed mt-1">Contact admin to change your role</Text>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          className="bg-primary px-6 py-4 rounded-full active:opacity-80 mt-4"
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-background font-semibold text-lg text-center">
              Save Changes
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
