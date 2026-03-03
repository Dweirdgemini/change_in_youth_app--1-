import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";

type RegisterImage = {
  uri: string;
  sessionId: number;
  sessionTitle: string;
  status: "pending" | "processing" | "success" | "error";
  participantCount?: number;
  error?: string;
};

export default function BulkRegisterImportScreen() {
  const colors = useColors();
  const [images, setImages] = useState<RegisterImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: sessions } = (trpc.scheduling as any).getAllSessions.useQuery();
  const processImage = (trpc.registerOCR as any).processRegisterImage.useMutation();
  const saveRegister = (trpc.registerOCR as any).saveOCRRegister.useMutation();

  const handleSelectImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Photo library permission is needed");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      // Show session selector for each image
      Alert.alert(
        "Assign Sessions",
        `You selected ${result.assets.length} images. Please assign each to a session.`,
        [
          {
            text: "OK",
            onPress: () => {
              // For now, add images without session assignment
              // In a real app, you'd show a modal to select session for each image
              const newImages: RegisterImage[] = result.assets.map((asset, index) => ({
                uri: asset.uri,
                sessionId: 0, // Would be selected by user
                sessionTitle: "Unassigned",
                status: "pending",
              }));
              setImages([...images, ...newImages]);
            },
          },
        ]
      );
    }
  };

  const assignSession = (imageIndex: number, sessionId: number, sessionTitle: string) => {
    const updated = [...images];
    updated[imageIndex].sessionId = sessionId;
    updated[imageIndex].sessionTitle = sessionTitle;
    setImages(updated);
  };

  const processAllImages = async () => {
    // Check all images have sessions assigned
    const unassigned = images.filter((img) => img.sessionId === 0);
    if (unassigned.length > 0) {
      Alert.alert("Error", "Please assign all images to sessions before processing");
      return;
    }

    setIsProcessing(true);
    const updated = [...images];

    for (let i = 0; i < updated.length; i++) {
      updated[i].status = "processing";
      setImages([...updated]);

      try {
        // Process image with OCR
        const result = await processImage.mutateAsync({
          imageUrl: updated[i].uri,
          sessionId: updated[i].sessionId,
        });

        // Save register automatically
        await saveRegister.mutateAsync({
          sessionId: updated[i].sessionId,
          participants: result.participants,
        });

        updated[i].status = "success";
        updated[i].participantCount = result.participants.length;
      } catch (error) {
        updated[i].status = "error";
        updated[i].error = "Failed to process image";
        console.error(error);
      }

      setImages([...updated]);
    }

    setIsProcessing(false);

    const successCount = updated.filter((img) => img.status === "success").length;
    const errorCount = updated.filter((img) => img.status === "error").length;

    Alert.alert(
      "Bulk Import Complete",
      `Successfully processed ${successCount} registers. ${errorCount} failed.`,
      [
        {
          text: "OK",
          onPress: () => {
            if (errorCount === 0) {
              router.back();
            }
          },
        },
      ]
    );
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "#22C55E";
      case "error":
        return "#EF4444";
      case "processing":
        return "#F59E0B";
      default:
        return colors.muted;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "success":
        return "Success";
      case "error":
        return "Error";
      case "processing":
        return "Processing...";
      default:
        return "Pending";
    }
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">Bulk Register Import</Text>
          <Text className="text-base text-muted">
            Upload multiple register photos and process them all at once
          </Text>
        </View>

        {/* Summary Stats */}
        {images.length > 0 && (
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
              <Text className="text-2xl font-bold text-foreground">{images.length}</Text>
              <Text className="text-xs text-muted leading-relaxed mt-1">Total Images</Text>
            </View>
            <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
              <Text className="text-2xl font-bold text-success">
                {images.filter((img) => img.status === "success").length}
              </Text>
              <Text className="text-xs text-muted leading-relaxed mt-1">Processed</Text>
            </View>
            <View className="flex-1 bg-surface rounded-lg p-3 border border-border">
              <Text className="text-2xl font-bold text-error">
                {images.filter((img) => img.status === "error").length}
              </Text>
              <Text className="text-xs text-muted leading-relaxed mt-1">Failed</Text>
            </View>
          </View>
        )}

        {/* Add Images Button */}
        {!isProcessing && (
          <Pressable
            onPress={handleSelectImages}
            className="bg-primary rounded-lg p-4 mb-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text className="text-background font-semibold text-center text-lg">
              {images.length === 0 ? "Select Register Photos" : "Add More Photos"}
            </Text>
          </Pressable>
        )}

        {/* Image List */}
        {images.length > 0 && (
          <>
            <Text className="text-xl font-bold text-foreground mb-4">Registers to Process</Text>
            <View className="gap-3 mb-4">
              {images.map((image, index) => (
                <View key={index} className="bg-surface rounded-xl p-4 border border-border">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1 mr-3">
                      <Text className="text-base font-semibold text-foreground mb-1">
                        Register {index + 1}
                      </Text>
                      <Text className="text-sm text-muted leading-relaxed">{image.sessionTitle}</Text>
                      {image.participantCount !== undefined && (
                        <Text className="text-xs text-muted leading-relaxed mt-1">
                          {image.participantCount} participants extracted
                        </Text>
                      )}
                    </View>
                    <View
                      className="px-3 py-1 rounded-full"
                      style={{ backgroundColor: getStatusColor(image.status) + "20" }}
                    >
                      <Text className="text-xs font-semibold" style={{ color: getStatusColor(image.status) }}>
                        {getStatusLabel(image.status)}
                      </Text>
                    </View>
                  </View>

                  {image.status === "pending" && (
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => {
                          // Show session picker (simplified - in real app would be a modal)
                          if (sessions && sessions.length > 0) {
                            assignSession(index, sessions[0].id, sessions[0].title);
                          }
                        }}
                        className="flex-1 bg-primary rounded-lg p-2"
                        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                      >
                        <Text className="text-background font-semibold text-center text-sm">
                          {image.sessionId === 0 ? "Assign Session" : "Change Session"}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => removeImage(index)}
                        className="bg-error rounded-lg px-4 py-2"
                        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                      >
                        <Text className="text-background font-semibold text-sm">Remove</Text>
                      </Pressable>
                    </View>
                  )}

                  {image.status === "error" && image.error && (
                    <Text className="text-xs text-error mt-2">{image.error}</Text>
                  )}
                </View>
              ))}
            </View>

            {/* Process Button */}
            {!isProcessing && images.length > 0 && (
              <Pressable
                onPress={processAllImages}
                className="bg-success rounded-lg p-4 mb-4"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text className="text-background font-semibold text-center text-lg">
                  Process All Registers
                </Text>
              </Pressable>
            )}

            {isProcessing && (
              <View className="bg-surface rounded-xl p-6 mb-4 items-center border border-border">
                <Text className="text-lg font-semibold text-foreground mb-2">Processing Registers...</Text>
                <Text className="text-sm text-muted text-center">
                  Please wait while we extract attendance data from all images
                </Text>
              </View>
            )}
          </>
        )}

        {/* Empty State */}
        {images.length === 0 && (
          <View className="bg-surface rounded-xl p-8 items-center border border-border">
            <Text className="text-lg font-semibold text-foreground mb-2 text-center">
              No Registers Added
            </Text>
            <Text className="text-sm text-muted text-center">
              Select multiple register photos from your gallery to get started
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
