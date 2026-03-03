import { View, Text, ScrollView, Pressable, TextInput, Alert, Image } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";

type Participant = {
  name: string;
  present: boolean;
  notes: string;
};

export default function RegisterOCRScreen() {
  const colors = useColors();
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processImage = trpc.registerOCR.processRegisterImage.useMutation();
  const saveRegister = trpc.registerOCR.saveOCRRegister.useMutation();

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Camera permission is needed to take photos");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      await processRegister(result.assets[0].uri);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Photo library permission is needed");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      await processRegister(result.assets[0].uri);
    }
  };

  const processRegister = async (uri: string) => {
    setIsProcessing(true);
    try {
      // Upload image to S3 first (you would implement this)
      // For now, we'll use the local URI
      const result = await processImage.mutateAsync({
        imageUrl: uri,
        sessionId: parseInt(sessionId),
      });

      setParticipants(result.participants);
      Alert.alert("Success", `Extracted ${result.participants.length} participants from register`);
    } catch (error) {
      Alert.alert("Error", "Failed to process register image. Please try again.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (participants.length === 0) {
      Alert.alert("No Data", "Please capture a register image first");
      return;
    }

    try {
      await saveRegister.mutateAsync({
        sessionId: parseInt(sessionId),
        participants,
      });

      Alert.alert("Success", "Register saved successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", "Failed to save register");
      console.error(error);
    }
  };

  const updateParticipant = (index: number, field: keyof Participant, value: string | boolean) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    setParticipants(updated);
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const addParticipant = () => {
    setParticipants([...participants, { name: "", present: true, notes: "" }]);
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">Digitize Register</Text>
          <Text className="text-base text-muted">
            Take a photo of your handwritten register to automatically extract attendance
          </Text>
        </View>

        {/* Image Preview */}
        {imageUri && (
          <View className="mb-4">
            <Image source={{ uri: imageUri }} className="w-full h-64 rounded-xl" resizeMode="contain" />
          </View>
        )}

        {/* Capture Buttons */}
        {!imageUri && (
          <View className="gap-3 mb-4">
            <Pressable
              onPress={handleTakePhoto}
              className="bg-primary rounded-lg p-4"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className="text-background font-semibold text-center text-lg">Take Photo</Text>
            </Pressable>
            <Pressable
              onPress={handlePickImage}
              className="bg-surface rounded-lg p-4 border border-border"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className="text-foreground font-semibold text-center text-lg">Choose from Gallery</Text>
            </Pressable>
          </View>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <View className="bg-surface rounded-xl p-6 mb-4 items-center border border-border">
            <Text className="text-lg font-semibold text-foreground mb-2">Processing Register...</Text>
            <Text className="text-sm text-muted text-center">
              Using AI to extract names and attendance from your handwritten register
            </Text>
          </View>
        )}

        {/* Extracted Participants */}
        {participants.length > 0 && (
          <>
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-foreground">
                Participants ({participants.length})
              </Text>
              <Pressable
                onPress={addParticipant}
                className="bg-primary rounded-lg px-4 py-2"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text className="text-background font-semibold">Add</Text>
              </Pressable>
            </View>

            <View className="gap-3 mb-4">
              {participants.map((participant, index) => (
                <View key={index} className="bg-surface rounded-xl p-4 border border-border">
                  <View className="flex-row justify-between items-start mb-3">
                    <TextInput
                      className="flex-1 text-lg font-semibold text-foreground mr-2"
                      value={participant.name}
                      onChangeText={(text) => updateParticipant(index, "name", text)}
                      placeholder="Participant name"
                      placeholderTextColor={colors.muted}
                    />
                    <Pressable
                      onPress={() => removeParticipant(index)}
                      className="bg-error rounded-lg px-3 py-1"
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      <Text className="text-background font-semibold text-sm">Remove</Text>
                    </Pressable>
                  </View>

                  <View className="flex-row items-center mb-2">
                    <Pressable
                      onPress={() => updateParticipant(index, "present", !participant.present)}
                      className={`flex-row items-center px-4 py-2 rounded-lg ${
                        participant.present ? "bg-success" : "bg-error"
                      }`}
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      <Text className="text-background font-semibold">
                        {participant.present ? "Present" : "Absent"}
                      </Text>
                    </Pressable>
                  </View>

                  <TextInput
                    className="bg-background rounded-lg p-3 text-foreground border border-border"
                    value={participant.notes}
                    onChangeText={(text) => updateParticipant(index, "notes", text)}
                    placeholder="Notes (optional)"
                    placeholderTextColor={colors.muted}
                    multiline
                  />
                </View>
              ))}
            </View>

            {/* Save Button */}
            <Pressable
              onPress={handleSave}
              className="bg-primary rounded-lg p-4 mb-4"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              disabled={saveRegister.isPending}
            >
              <Text className="text-background font-semibold text-center text-lg">
                {saveRegister.isPending ? "Saving..." : "Save Register"}
              </Text>
            </Pressable>

            {/* Retake Button */}
            <Pressable
              onPress={() => {
                setImageUri(null);
                setParticipants([]);
              }}
              className="bg-surface rounded-lg p-4 border border-border"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text className="text-foreground font-semibold text-center text-lg">Retake Photo</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
