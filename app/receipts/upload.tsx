import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { EncodingType } from "expo-file-system/legacy";

type Receipt = {
  uri: string;
  description: string;
  amount: string;
  category: string;
};

const EXPENSE_CATEGORIES = [
  { id: "bus_travel", label: "Bus Travel", icon: "🚌" },
  { id: "mileage", label: "Mileage", icon: "🚗" },
  { id: "refreshment", label: "Refreshment", icon: "☕" },
  { id: "food", label: "Food", icon: "🍽️" },
  { id: "equipment", label: "Equipment", icon: "🔧" },
  { id: "project_materials", label: "Project Materials", icon: "📦" },
  { id: "other", label: "Other", icon: "📝" },
];

export default function UploadReceiptsScreen() {
  const colors = useColors();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: projects } = (trpc.invoiceSystem as any).getProjects.useQuery();
  const uploadMutation = (trpc.fileUpload as any).uploadFile.useMutation();
  const createExpenseMutation = (trpc.invoiceSystem as any).createExpense.useMutation();

  const addReceipt = async (source: "camera" | "gallery") => {
    let result;

    if (source === "camera") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Camera permission is needed");
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Photo library permission is needed");
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: true,
      });
    }

    if (!result.canceled && result.assets) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const newReceipts = result.assets.map((asset) => ({
        uri: asset.uri,
        description: "",
        amount: "",
        category: "other",
      }));
      setReceipts([...receipts, ...newReceipts]);
    }
  };

  const removeReceipt = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setReceipts(receipts.filter((_, i) => i !== index));
  };

  const updateReceipt = (index: number, field: keyof Receipt, value: string) => {
    const updated = [...receipts];
    updated[index][field] = value;
    setReceipts(updated);
  };

  const handleSubmitAll = async () => {
    if (!selectedProject) {
      Alert.alert("Select Project", "Please select a project for these receipts.");
      return;
    }

    if (receipts.length === 0) {
      Alert.alert("No Receipts", "Please add at least one receipt.");
      return;
    }

    // Validate all receipts have required fields
    const invalidReceipts = receipts.filter(
      (r) => !r.description.trim() || !r.amount || parseFloat(r.amount) <= 0
    );

    if (invalidReceipts.length > 0) {
      Alert.alert(
        "Incomplete Information",
        "Please fill in description and amount for all receipts."
      );
      return;
    }

    setIsUploading(true);

    try {
      // Upload all receipts and create expenses
      for (const receipt of receipts) {
        // Upload image to S3
        const base64 = await FileSystem.readAsStringAsync(receipt.uri, {
          encoding: EncodingType.Base64,
        });

        const uploadResult = await uploadMutation.mutateAsync({
          fileName: `receipt_${Date.now()}.jpg`,
          fileType: "image/jpeg",
          base64Data: base64,
        });

        // Create expense with receipt URL
        await createExpenseMutation.mutateAsync({
          projectId: selectedProject,
          budgetLineId: null, // Will be assigned by admin
          description: receipt.description.trim(),
          amount: parseFloat(receipt.amount),
          receiptUrl: uploadResult.url,
          expenseDate: new Date(),
        });
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Receipts Uploaded",
        `${receipts.length} receipt(s) uploaded successfully and submitted for approval.`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Upload Failed", error.message || "Failed to upload receipts");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Back Button */}
          

          {/* Header */}
          <View>
            <Text className="text-2xl font-bold text-foreground">Upload Receipts</Text>
            <Text className="text-base text-muted mt-1">
              Batch upload multiple receipts at once
            </Text>
          </View>

          {/* Project Selection */}
          <View>
            <Text className="text-base font-semibold text-foreground mb-3">
              Select Project
            </Text>
            {projects?.map((project) => (
              <TouchableOpacity
                key={project.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedProject(project.id);
                }}
                className={`p-4 rounded-xl mb-2 border ${
                  selectedProject === project.id
                    ? "bg-primary/10 border-primary"
                    : "bg-surface border-border"
                }`}
              >
                <Text
                  className={`text-base font-semibold ${
                    selectedProject === project.id ? "text-primary" : "text-foreground"
                  }`}
                >
                  {project.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Add Receipt Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={() => addReceipt("camera")}
              className="flex-1 bg-primary rounded-xl py-4 items-center active:opacity-80"
            >
              <Ionicons name="camera" size={24} color="#fff" />
              <Text className="text-white font-semibold mt-1">Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => addReceipt("gallery")}
              className="flex-1 bg-surface border border-border rounded-xl py-4 items-center active:opacity-80"
            >
              <Ionicons name="images" size={24} color={colors.primary} />
              <Text className="text-foreground font-semibold mt-1">Choose Photos</Text>
            </TouchableOpacity>
          </View>

          {/* Receipt Gallery */}
          {receipts.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">
                Receipts ({receipts.length})
              </Text>

              {receipts.map((receipt, index) => (
                <View key={index} className="bg-surface rounded-2xl p-4 border border-border">
                  {/* Receipt Image */}
                  <View className="relative mb-3">
                    <Image
                      source={{ uri: receipt.uri }}
                      className="w-full h-48 rounded-xl"
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      onPress={() => removeReceipt(index)}
                      className="absolute top-2 right-2 bg-error rounded-full p-2 active:opacity-80"
                    >
                      <Ionicons name="trash" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  {/* Description */}
                  <View className="mb-3">
                    <Text className="text-sm font-semibold text-foreground mb-2">
                      Description *
                    </Text>
                    <TextInput
                      value={receipt.description}
                      onChangeText={(text) => updateReceipt(index, "description", text)}
                      placeholder="e.g., Transport to venue"
                      placeholderTextColor={colors.muted}
                      className="bg-background border border-border rounded-xl p-3 text-foreground"
                    />
                  </View>

                  {/* Category */}
                  <View className="mb-3">
                    <Text className="text-sm font-semibold text-foreground mb-2">
                      Category *
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <TouchableOpacity
                          key={cat.id}
                          onPress={() => updateReceipt(index, "category", cat.id)}
                          className={`px-3 py-2 rounded-full border ${
                            receipt.category === cat.id
                              ? "bg-primary border-primary"
                              : "bg-background border-border"
                          }`}
                        >
                          <Text
                            className={`text-sm ${
                              receipt.category === cat.id
                                ? "text-background font-semibold"
                                : "text-foreground"
                            }`}
                          >
                            {cat.icon} {cat.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Amount */}
                  <View>
                    <Text className="text-sm font-semibold text-foreground mb-2">
                      Amount (£) *
                    </Text>
                    <TextInput
                      value={receipt.amount}
                      onChangeText={(text) => updateReceipt(index, "amount", text)}
                      placeholder="0.00"
                      placeholderTextColor={colors.muted}
                      keyboardType="decimal-pad"
                      className="bg-background border border-border rounded-xl p-3 text-foreground text-lg font-bold"
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Empty State */}
          {receipts.length === 0 && (
            <View className="bg-surface rounded-2xl p-8 border border-border items-center">
              <Ionicons name="receipt-outline" size={64} color={colors.muted} />
              <Text className="text-base text-muted text-center mt-4">
                No receipts added yet
              </Text>
              <Text className="text-sm text-muted text-center mt-1">
                Tap the buttons above to add receipts
              </Text>
            </View>
          )}

          {/* Submit Button */}
          {receipts.length > 0 && (
            <TouchableOpacity
              onPress={handleSubmitAll}
              disabled={isUploading}
              style={(({ pressed }) => ({
                transform: [{ scale: pressed ? 0.97 : 1 }] as any,
                opacity: isUploading ? 0.5 : 1,
              })) as any}
              className="bg-primary rounded-full py-4"
            >
              {isUploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-center text-white font-semibold text-base">
                  Submit {receipts.length} Receipt{receipts.length > 1 ? "s" : ""}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
