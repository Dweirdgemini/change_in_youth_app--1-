import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import { useState } from "react";

type BudgetLineCategory = "coordinator" | "delivery" | "venue_hire" | "evaluation_report" | "contingency" | "management_fee";

export default function MyInvoiceScreen() {
  const utils = trpc.useUtils();
  const colors = useColors();
  const [selectedCategory, setSelectedCategory] = useState<BudgetLineCategory | null>(null);

  const { data: draftInvoice, isLoading } = trpc.autoInvoices.getDraftInvoice.useQuery();

  const generateInvoice = trpc.autoInvoices.generateInvoice.useMutation({
    onSuccess: (data) => {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      utils.autoInvoices.getDraftInvoice.invalidate();
      
      if (Platform.OS === 'web') {
        const viewHistory = window.confirm(
          `Invoice Generated!\n\n${data.title} has been created and submitted to finance for approval. You'll be notified when it's processed.\n\nView invoice history now?`
        );
        if (viewHistory) {
          router.push("/invoice-history");
        }
      } else {
        Alert.alert(
          "Invoice Generated!",
          `${data.title} has been created and submitted to finance for approval. You'll be notified when it's processed.`,
          [
            {
              text: "View History",
              onPress: () => router.push("/invoice-history"),
            },
            { text: "OK" },
          ]
        );
      }
    },
    onError: (error) => {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      
      if (Platform.OS === 'web') {
        window.alert(`Error: ${error.message}`);
      } else {
        Alert.alert("Error", error.message);
      }
    },
  });

  const handleGenerateInvoice = () => {
    if (!draftInvoice || draftInvoice.activities.length === 0) {
      if (Platform.OS === 'web') {
        window.alert("You don't have any unpaid activities to invoice yet.");
      } else {
        Alert.alert("No Activities", "You don't have any unpaid activities to invoice yet.");
      }
      return;
    }

    if (!selectedCategory) {
      if (Platform.OS === 'web') {
        window.alert("Please select a budget line category for this invoice.");
      } else {
        Alert.alert("Select Budget Category", "Please select a budget line category for this invoice.");
      }
      return;
    }

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        `Generate Invoice #${draftInvoice.nextInvoiceNumber} for £${draftInvoice.totalAmount.toFixed(2)}?\n\nThis will submit it to finance for approval. You won't be able to edit it after generation.`
      );
      if (confirmed) {
        generateInvoice.mutate({ budgetLineCategory: selectedCategory });
      }
    } else {
      Alert.alert(
        "Generate Invoice?",
        `This will create Invoice #${draftInvoice.nextInvoiceNumber} for £${draftInvoice.totalAmount.toFixed(2)} and submit it to finance for approval. You won't be able to edit it after generation.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Generate",
            onPress: () => generateInvoice.mutate({ budgetLineCategory: selectedCategory }),
          },
        ]
      );
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  const totalHours = draftInvoice ? (draftInvoice.totalMinutes / 60).toFixed(2) : "0.00";
  const totalAmount = draftInvoice?.totalAmount || 0;

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-6">
        {/* Header with Back Button */}
        <View className="mb-4">
          
          <Text className="text-2xl font-bold text-foreground">My Invoice</Text>
          <Text className="text-sm text-muted mt-1">
            Your accumulated earnings ready to invoice
          </Text>
        </View>

        {/* Draft Invoice Summary */}
        <View className="bg-surface rounded-2xl p-6 mb-4 border border-border">
          <View className="flex-row justify-between items-start mb-4">
            <View>
              <Text className="text-sm text-muted leading-relaxed">Draft Invoice</Text>
              <Text className="text-lg font-semibold text-foreground mt-1">
                Invoice #{draftInvoice?.nextInvoiceNumber || "N/A"}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-2xl font-bold text-primary">
                £{totalAmount.toFixed(2)}
              </Text>
              <Text className="text-sm text-muted mt-1">{totalHours} hours</Text>
            </View>
          </View>

          <View className="bg-background rounded-lg p-4 mb-4">
            <Text className="text-sm text-muted leading-relaxed">
              {draftInvoice?.activities.length || 0}{" "}
              {draftInvoice?.activities.length === 1 ? "activity" : "activities"} ready to invoice
            </Text>
          </View>

          {/* Budget Line Category Selector */}
          {draftInvoice && draftInvoice.activities.length > 0 && (
            <View className="mb-4">
              <Text className="text-sm font-semibold text-foreground mb-2">Budget Line Category *</Text>
              <View className="gap-2">
                {[
                  { value: "delivery" as const, label: "👥 Facilitator Fee", desc: "Session delivery" },
                  { value: "coordinator" as const, label: "👨‍💼 Coordinator Fee", desc: "Project coordination" },
                  { value: "venue_hire" as const, label: "🏢 Venue Hire", desc: "Location costs" },
                  { value: "evaluation_report" as const, label: "📊 Monitoring & Evaluation", desc: "Reports & assessment" },
                  { value: "contingency" as const, label: "💰 Contingency", desc: "Other expenses" },
                  { value: "management_fee" as const, label: "⚙️ Management Fee", desc: "Admin & overhead" },
                ].map((category) => (
                  <TouchableOpacity
                    key={category.value}
                    className={`p-4 rounded-xl border ${
                      selectedCategory === category.value
                        ? "bg-primary/10 border-primary"
                        : "bg-surface border-border"
                    }`}
                    onPress={() => setSelectedCategory(category.value)}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className={`font-semibold ${
                          selectedCategory === category.value ? "text-primary" : "text-foreground"
                        }`}>
                          {category.label}
                        </Text>
                        <Text className="text-xs text-muted leading-relaxed mt-1">{category.desc}</Text>
                      </View>
                      {selectedCategory === category.value && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {draftInvoice && draftInvoice.activities.length > 0 ? (
            <TouchableOpacity
              className="bg-primary px-6 py-4 rounded-full active:opacity-80"
              onPress={handleGenerateInvoice}
              disabled={generateInvoice.isPending}
            >
              {generateInvoice.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-background font-bold text-center text-lg">
                  Generate Invoice
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <View className="bg-background rounded-lg p-4 items-center">
              <Text className="text-sm text-muted text-center">
                No unpaid activities yet. Complete sessions to start accumulating earnings.
              </Text>
            </View>
          )}
        </View>

        {/* Activity List */}
        {draftInvoice && draftInvoice.activities.length > 0 && (
          <View>
            <Text className="text-lg font-semibold text-foreground mb-3">
              Unpaid Activities
            </Text>
            <View className="gap-3">
              {draftInvoice.activities.map((activity: any) => {
                const joinedDate = activity.joinedAt ? new Date(activity.joinedAt) : null;
                const hours = ((activity.durationMinutes || 0) / 60).toFixed(2);
                const payment = parseFloat(activity.calculatedPayment || "0");

                return (
                  <View
                    key={activity.id}
                    className="bg-surface rounded-xl p-4 border border-border"
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1 mr-3">
                        <Text className="text-base font-semibold text-foreground">
                          {activity.sessionTitle || "Untitled Session"}
                        </Text>
                        <Text className="text-sm text-muted mt-1">
                          {activity.projectName || "Unknown Project"}
                        </Text>
                        {joinedDate && (
                          <Text className="text-xs text-muted leading-relaxed mt-1">
                            {joinedDate.toLocaleDateString()} at{" "}
                            {joinedDate.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        )}
                      </View>
                      <View className="items-end">
                        <Text className="text-lg font-bold text-primary">
                          £{payment.toFixed(2)}
                        </Text>
                        <Text className="text-xs text-muted leading-relaxed mt-1">{hours}h</Text>
                      </View>
                    </View>
                    {activity.isVirtual && (
                      <View className="bg-primary/10 rounded-lg px-3 py-1 self-start mt-2">
                        <Text className="text-xs font-semibold text-primary">
                          📹 Virtual Meeting
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* View History Button */}
        <TouchableOpacity
          className="mt-4 py-3"
          onPress={() => router.push("/invoice-history")}
        >
          <Text className="text-primary text-center font-semibold">
            View Invoice History →
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </ScreenContainer>
  );
}
