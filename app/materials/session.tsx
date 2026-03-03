import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useLocalSearchParams, router } from "expo-router";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";

export default function SessionMaterialsScreen() {
  const params = useLocalSearchParams();
  const sessionId = Number(params.id);
  const [uploading, setUploading] = useState(false);

  const { data: materials, isLoading } = trpc.materials.getSessionMaterials.useQuery(
    { sessionId },
    { enabled: !!sessionId }
  );

  const utils = trpc.useUtils();
  const uploadRegister = trpc.materials.uploadPhotoRegister.useMutation({
    onSuccess: (data) => {
      utils.materials.getSessionMaterials.invalidate({ sessionId });
      Alert.alert(
        "Success",
        data.paymentEligible
          ? "Register uploaded! You are now eligible for payment."
          : "Register uploaded successfully."
      );
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const markEvaluation = trpc.materials.markEvaluationCompleted.useMutation({
    onSuccess: (data) => {
      utils.materials.getSessionMaterials.invalidate({ sessionId });
      Alert.alert(
        "Success",
        data.paymentEligible
          ? "Evaluation marked complete! You are now eligible for payment."
          : "Evaluation marked as completed."
      );
    },
  });

  const handlePhotoUpload = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Camera permission is needed to take photos.");
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        
        // In production, upload to S3 or file storage
        // For now, use a placeholder URL
        const photoUrl = result.assets[0].uri;
        
        await uploadRegister.mutateAsync({
          sessionId,
          photoUrl,
          notes: "Participant register photo",
        });
        
        setUploading(false);
      }
    } catch (error: any) {
      setUploading(false);
      Alert.alert("Error", error.message || "Failed to upload photo");
    }
  };

  const handleGalleryUpload = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Gallery permission is needed to select photos.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        const photoUrl = result.assets[0].uri;
        
        await uploadRegister.mutateAsync({
          sessionId,
          photoUrl,
          notes: "Participant register photo",
        });
        
        setUploading(false);
      }
    } catch (error: any) {
      setUploading(false);
      Alert.alert("Error", error.message || "Failed to upload photo");
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  if (!materials) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text className="text-foreground text-center">Session not found</Text>
        
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Header */}
          <View>
            
            <Text className="text-2xl font-bold text-foreground">{materials.session.title}</Text>
            <Text className="text-base text-muted mt-1">{materials.session.venue}</Text>
            <Text className="text-sm text-muted leading-relaxed">
              {new Date(materials.session.startTime).toLocaleString()}
            </Text>
          </View>

          {/* Payment Eligibility Status */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-3">Payment Eligibility</Text>
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted leading-relaxed">Clocked In</Text>
                <View
                  className={`px-3 py-1 rounded-full ${
                    materials.facilitatorStatus.clockedIn ? "bg-success/20" : "bg-error/20"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      materials.facilitatorStatus.clockedIn ? "text-success" : "text-error"
                    }`}
                  >
                    {materials.facilitatorStatus.clockedIn ? "✓ Done" : "✗ Pending"}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted leading-relaxed">Register Completed</Text>
                <View
                  className={`px-3 py-1 rounded-full ${
                    materials.facilitatorStatus.registerCompleted ? "bg-success/20" : "bg-error/20"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      materials.facilitatorStatus.registerCompleted ? "text-success" : "text-error"
                    }`}
                  >
                    {materials.facilitatorStatus.registerCompleted ? "✓ Done" : "✗ Pending"}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted leading-relaxed">Evaluations Completed</Text>
                <View
                  className={`px-3 py-1 rounded-full ${
                    materials.facilitatorStatus.evaluationsCompleted ? "bg-success/20" : "bg-error/20"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      materials.facilitatorStatus.evaluationsCompleted ? "text-success" : "text-error"
                    }`}
                  >
                    {materials.facilitatorStatus.evaluationsCompleted ? "✓ Done" : "✗ Pending"}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted leading-relaxed">Arrived On Time</Text>
                <View
                  className={`px-3 py-1 rounded-full ${
                    materials.facilitatorStatus.arrivedOnTime ? "bg-success/20" : "bg-error/20"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      materials.facilitatorStatus.arrivedOnTime ? "text-success" : "text-error"
                    }`}
                  >
                    {materials.facilitatorStatus.arrivedOnTime ? "✓ Done" : "✗ Pending"}
                  </Text>
                </View>
              </View>
            </View>
            {materials.facilitatorStatus.paymentEligible && (
              <View className="bg-success/10 rounded-lg p-3 mt-3">
                <Text className="text-success font-semibold text-center">
                  ✓ You are eligible for payment!
                </Text>
              </View>
            )}
          </View>

          {/* Upload Register Photo */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Upload Register</Text>
            <Text className="text-sm text-muted leading-relaxed">
              Take a photo of the participant register to complete this requirement.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-primary rounded-2xl p-4 active:opacity-80"
                onPress={handlePhotoUpload}
                disabled={uploading || materials.facilitatorStatus.registerCompleted}
              >
                <Text className="text-background font-semibold text-center">
                  {uploading ? "Uploading..." : "Take Photo"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-surface rounded-2xl p-4 border border-border active:opacity-70"
                onPress={handleGalleryUpload}
                disabled={uploading || materials.facilitatorStatus.registerCompleted}
              >
                <Text className="text-foreground font-semibold text-center">
                  Choose from Gallery
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Mark Evaluation Complete */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Evaluations</Text>
            <Text className="text-sm text-muted leading-relaxed">
              Mark as complete once all student evaluation forms are filled out.
            </Text>
            <TouchableOpacity
              className="bg-primary rounded-2xl p-4 active:opacity-80"
              onPress={() => markEvaluation.mutate({ sessionId })}
              disabled={materials.facilitatorStatus.evaluationsCompleted}
            >
              <Text className="text-background font-semibold text-center">
                {materials.facilitatorStatus.evaluationsCompleted
                  ? "✓ Evaluations Completed"
                  : "Mark Evaluations Complete"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Session Documents */}
          {materials.documents.sessionDocs.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Session Documents</Text>
              {materials.documents.sessionDocs.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
                >
                  <Text className="text-base font-semibold text-foreground">{doc.title}</Text>
                  <View className="bg-primary/10 px-3 py-1 rounded-full self-start mt-2">
                    <Text className="text-xs text-primary font-medium capitalize">{doc.type}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Project Documents */}
          {materials.documents.projectDocs.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Project Documents</Text>
              {materials.documents.projectDocs.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
                >
                  <Text className="text-base font-semibold text-foreground">{doc.title}</Text>
                  <View className="bg-primary/10 px-3 py-1 rounded-full self-start mt-2">
                    <Text className="text-xs text-primary font-medium capitalize">{doc.type}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Invoice Information */}
          <View className="bg-surface rounded-2xl p-4 border border-border gap-3">
            <Text className="text-lg font-semibold text-foreground">Invoice Information</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-muted leading-relaxed">Expected Amount</Text>
              <Text className="text-base font-semibold text-foreground">
                £{materials.invoiceInfo.expectedAmount}
              </Text>
            </View>
            {materials.invoiceInfo.deadline && (
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted leading-relaxed">Deadline</Text>
                <Text className="text-base font-semibold text-warning">
                  {new Date(materials.invoiceInfo.deadline).toLocaleDateString()}
                </Text>
              </View>
            )}
            {materials.invoiceInfo.submitted ? (
              <View className="bg-success/10 rounded-lg p-3">
                <Text className="text-success font-semibold text-center">
                  Invoice Submitted - Status: {materials.invoiceInfo.status}
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                className="bg-primary rounded-full p-3 active:opacity-80"
                onPress={() => router.push("/finance" as any)}
              >
                <Text className="text-background font-semibold text-center">Submit Invoice</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
