import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

export default function InvoicePreviewScreen() {
  const colors = useColors();
  const params = useLocalSearchParams<{
    projectId: string;
    sessionIds: string;
    expenseIds: string;
  }>();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const projectId = parseInt(params.projectId);
  const sessionIds = params.sessionIds ? params.sessionIds.split(",").map(Number) : [];
  const expenseIds = params.expenseIds ? params.expenseIds.split(",").map(Number) : [];

  const { data: project } = trpc.invoiceSystem.getProjects.useQuery();
  const { data: mySessions } = (trpc.scheduling as any).getMySessions.useQuery();
  const { data: myExpenses } = trpc.invoiceSystem.getMyExpenses.useQuery();

  const generateMutation = trpc.invoiceSystem.generateInvoice.useMutation({
    onSuccess: (data) => {
      setIsSubmitting(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Invoice Generated",
        "Your invoice has been created successfully and submitted for approval.",
        [
          {
            text: "View Invoice",
            onPress: () => {
              router.dismissAll();
              router.push(`/my-invoice` as any);
            },
          },
        ]
      );
    },
    onError: (error) => {
      setIsSubmitting(false);
      Alert.alert("Error", error.message);
    },
  });

  const selectedProject = project?.find((p) => p.id === projectId);
  const selectedSessions = mySessions?.filter((s) => sessionIds.includes(s.id)) || [];
  const selectedExpenses = myExpenses?.filter((e) => expenseIds.includes(e.id)) || [];

  const sessionTotal = selectedSessions.reduce(
    (sum, s) => sum + parseFloat(s.paymentPerFacilitator || "0"),
    0
  );
  const expenseTotal = selectedExpenses.reduce(
    (sum, e) => sum + parseFloat(e.amount.toString()),
    0
  );
  const grandTotal = sessionTotal + expenseTotal;

  const handleSubmit = () => {
    Alert.alert(
      "Confirm Submission",
      "Are you sure you want to submit this invoice for approval?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          style: "default",
          onPress: () => {
            setIsSubmitting(true);
            generateMutation.mutate({
              projectId,
              includeSessionIds: sessionIds,
              includeExpenseIds: expenseIds,
            });
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Back Button */}
          

          {/* Header */}
          <View>
            <Text className="text-2xl font-bold text-foreground">Invoice Preview</Text>
            <Text className="text-base text-muted mt-1">
              Review your invoice before submission
            </Text>
          </View>

          {/* Project Info */}
          <View className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
            <Text className="text-sm text-primary mb-1">Project</Text>
            <Text className="text-xl font-bold text-foreground">{selectedProject?.name}</Text>
            {selectedProject?.code && (
              <Text className="text-sm text-muted mt-1">
                Code: {selectedProject.code}
              </Text>
            )}
          </View>

          {/* Sessions Section */}
          {selectedSessions.length > 0 && (
            <View>
              <Text className="text-lg font-semibold text-foreground mb-3">
                Sessions ({selectedSessions.length})
              </Text>
              {selectedSessions.map((session) => (
                <View
                  key={session.id}
                  className="bg-surface rounded-xl p-4 mb-2 border border-border"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">
                        {session.title}
                      </Text>
                      <Text className="text-sm text-muted mt-1">
                        {new Date(session.sessionDate).toLocaleDateString()}
                      </Text>
                    </View>
                    <Text className="text-lg font-bold text-foreground">
                      £{parseFloat(session.paymentPerFacilitator || "0").toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
              <View className="bg-surface rounded-xl p-3 border border-border">
                <View className="flex-row justify-between">
                  <Text className="text-sm font-semibold text-muted">Sessions Subtotal</Text>
                  <Text className="text-base font-bold text-foreground">
                    £{sessionTotal.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Expenses Section */}
          {selectedExpenses.length > 0 && (
            <View>
              <Text className="text-lg font-semibold text-foreground mb-3">
                Expenses ({selectedExpenses.length})
              </Text>
              {selectedExpenses.map((expense) => (
                <View
                  key={expense.id}
                  className="bg-surface rounded-xl p-4 mb-2 border border-border"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">
                        {expense.description}
                      </Text>
                      <Text className="text-sm text-muted mt-1">
                        {new Date(expense.expenseDate).toLocaleDateString()}
                      </Text>
                      {expense.receiptUrl && (
                        <View className="flex-row items-center gap-1 mt-1">
                          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                          <Text className="text-xs text-success">Receipt attached</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-lg font-bold text-foreground">
                      £{parseFloat(expense.amount.toString()).toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
              <View className="bg-surface rounded-xl p-3 border border-border">
                <View className="flex-row justify-between">
                  <Text className="text-sm font-semibold text-muted">Expenses Subtotal</Text>
                  <Text className="text-base font-bold text-foreground">
                    £{expenseTotal.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Grand Total */}
          <View className="bg-primary rounded-2xl p-6">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-sm text-white/80 mb-1">Total Amount</Text>
                <Text className="text-2xl font-bold text-white">£{grandTotal.toFixed(2)}</Text>
              </View>
              <Ionicons name="cash-outline" size={48} color="rgba(255,255,255,0.3)" />
            </View>
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={(({ pressed }) => ({
                transform: [{ scale: pressed ? 0.97 : 1 }] as any,
                opacity: isSubmitting ? 0.5 : 1,
              })) as any}
              className="bg-primary rounded-full py-4"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-center text-white font-semibold text-base">
                  Submit Invoice for Approval
                </Text>
              )}
            </TouchableOpacity>

            
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
