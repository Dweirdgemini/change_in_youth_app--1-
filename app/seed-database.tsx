import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function SeedDatabaseScreen() {
  const [isSeeding, setIsSeeding] = useState(false);
  const seedMutation = trpc.seed.seedDatabase.useMutation();

  const handleSeed = async () => {
    try {
      setIsSeeding(true);
      const result = await seedMutation.mutateAsync();
      
      Alert.alert(
        "Success!",
        `Database populated with:\n\n` +
        `• ${result.summary.projects} projects\n` +
        `• ${result.summary.budgetLines} budget lines\n` +
        `• ${result.summary.sessions} sessions\n` +
        `• ${result.summary.documents} documents\n` +
        `• ${result.summary.trainingModules} training modules\n\n` +
        `You can now explore all the features!`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Failed to seed database. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <ScreenContainer>
      <View className="flex-1 p-6 justify-center items-center gap-4">
        <View className="items-center gap-4 max-w-md">
          <Text className="text-2xl font-bold text-foreground text-center leading-tight">
            Populate Database
          </Text>
          <Text className="text-base text-muted text-center leading-relaxed">
            This will add sample data to the app including:
          </Text>
          <View className="w-full bg-surface rounded-2xl p-4 gap-2">
            <Text className="text-sm text-foreground">✅ 5 sample projects (Positive ID, Social Media Preneur, etc.)</Text>
            <Text className="text-sm text-foreground">✅ Budget lines and financial tracking</Text>
            <Text className="text-sm text-foreground">✅ Upcoming workshop sessions</Text>
            <Text className="text-sm text-foreground">✅ Documents and resources</Text>
            <Text className="text-sm text-foreground">✅ Training modules</Text>
          </View>
          <Text className="text-sm text-warning text-center">
            Note: This is for testing purposes only. You can run this multiple times.
          </Text>
        </View>

        <TouchableOpacity
          className="bg-primary px-6 py-4 rounded-full active:opacity-80 min-w-[200px]"
          onPress={handleSeed}
          disabled={isSeeding}
        >
          {isSeeding ? (
            <View className="flex-row items-center justify-center gap-2">
              <ActivityIndicator color="#fff" />
              <Text className="text-background font-semibold text-lg">Populating...</Text>
            </View>
          ) : (
            <Text className="text-background font-semibold text-lg text-center">
              Populate Now
            </Text>
          )}
        </TouchableOpacity>

        
      </View>
    </ScreenContainer>
  );
}
