import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

export default function CreateExpenseScreen() {
  const router = useRouter();
  const colors = useColors();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedBudgetLine, setSelectedBudgetLine] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { data: projects } = trpc.invoiceSystem.getProjects.useQuery();
  const { data: budgetLines } = trpc.invoiceSystem.getBudgetLines.useQuery(
    { projectId: selectedProject! },
    { enabled: !!selectedProject }
  );

  const createExpenseMutation = trpc.invoiceSystem.createExpense.useMutation({
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Expense Submitted",
        "Your expense has been submitted for admin approval.",
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant camera roll permissions to upload receipts."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setReceiptUri(result.assets[0].uri);
      
      // Simulate OCR scanning
      setIsScanning(true);
      setTimeout(() => {
        // In a real app, you would call an OCR API here
        // For now, we'll just set a placeholder
        setIsScanning(false);
        Alert.alert(
          "Receipt Scanned",
          "Please verify the extracted amount and adjust if needed."
        );
      }, 2000);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission Required",
        "Please grant camera permissions to take photos of receipts."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setReceiptUri(result.assets[0].uri);
      
      // Simulate OCR scanning
      setIsScanning(true);
      setTimeout(() => {
        setIsScanning(false);
        Alert.alert(
          "Receipt Scanned",
          "Please verify the extracted amount and adjust if needed."
        );
      }, 2000);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProject) {
      Alert.alert("Select Project", "Please select a project for this expense.");
      return;
    }

    if (!selectedBudgetLine) {
      Alert.alert("Select Budget Line", "Please select a budget line.");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Description Required", "Please enter a description.");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Amount Required", "Please enter a valid amount.");
      return;
    }

    setIsUploading(true);

    // In a real app, you would upload the receipt image to S3 here
    const receiptUrl = receiptUri || undefined;

    createExpenseMutation.mutate({
      projectId: selectedProject,
      budgetLineId: selectedBudgetLine,
      description: description.trim(),
      amount: parseFloat(amount),
      receiptUrl,
      expenseDate: new Date(),
    });
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">
            Submit Expense
          </Text>
          <Text className="text-sm text-muted leading-relaxed">
            Upload receipt and provide expense details
          </Text>
        </View>

        {/* Receipt Upload */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-foreground mb-3">
            Receipt Photo
          </Text>
          
          {receiptUri ? (
            <View className="relative">
              <Image
                source={{ uri: receiptUri }}
                className="w-full h-64 rounded-xl"
                resizeMode="cover"
              />
              {isScanning && (
                <View className="absolute inset-0 bg-black/50 rounded-xl items-center justify-center">
                  <ActivityIndicator size="large" color="#fff" />
                  <Text className="text-white mt-2">Scanning receipt...</Text>
                </View>
              )}
              <Pressable
                onPress={() => setReceiptUri(null)}
                style={({ pressed }) => [
                  {
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                className="absolute top-2 right-2 bg-error rounded-full p-2"
              >
                <Text className="text-white font-semibold">Remove</Text>
              </Pressable>
            </View>
          ) : (
            <View className="gap-2">
              <Pressable
                onPress={takePhoto}
                style={({ pressed }) => [
                  {
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                className="bg-primary rounded-xl py-4"
              >
                <Text className="text-center text-white font-semibold">
                  📷 Take Photo
                </Text>
              </Pressable>
              <Pressable
                onPress={pickImage}
                style={({ pressed }) => [
                  {
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                className="bg-surface border border-border rounded-xl py-4"
              >
                <Text className="text-center text-foreground font-semibold">
                  📁 Choose from Gallery
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Project Selection */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-foreground mb-3">
            Project
          </Text>
          {projects?.map((project) => (
            <Pressable
              key={project.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedProject(project.id);
                setSelectedBudgetLine(null);
              }}
              style={({ pressed }) => [
                {
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
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
            </Pressable>
          ))}
        </View>

        {/* Budget Line Selection */}
        {selectedProject && budgetLines && budgetLines.length > 0 && (
          <View className="mb-4">
            <Text className="text-base font-semibold text-foreground mb-3">
              Budget Line
            </Text>
            {budgetLines.map((line) => (
              <Pressable
                key={line.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedBudgetLine(line.id);
                }}
                style={({ pressed }) => [
                  {
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                className={`p-4 rounded-xl mb-2 border ${
                  selectedBudgetLine === line.id
                    ? "bg-primary/10 border-primary"
                    : "bg-surface border-border"
                }`}
              >
                <Text
                  className={`text-base font-semibold ${
                    selectedBudgetLine === line.id ? "text-primary" : "text-foreground"
                  }`}
                >
                  {line.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Description */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-foreground mb-3">
            Description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="e.g., Transport to workshop venue"
            placeholderTextColor={colors.muted}
            className="bg-surface border border-border rounded-xl p-4 text-foreground"
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Amount */}
        <View className="mb-4">
          <Text className="text-base font-semibold text-foreground mb-3">
            Amount (£)
          </Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={colors.muted}
            keyboardType="decimal-pad"
            className="bg-surface border border-border rounded-xl p-4 text-foreground text-xl font-bold"
          />
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit}
          disabled={isUploading}
          style={({ pressed }) => [
            {
              transform: [{ scale: pressed ? 0.97 : 1 }] as any,
              opacity: isUploading ? 0.5 : 1,
            },
          ]}
          className="bg-primary rounded-full py-4 mb-8"
        >
          {isUploading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-center text-white font-semibold text-base">
              Submit Expense
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </ScreenContainer>
  );
}
