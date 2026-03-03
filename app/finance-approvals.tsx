import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/use-colors";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function FinanceApprovalsScreen() {
  const colors = useColors();
  const utils = trpc.useUtils();
  const [selectedInvoice, setSelectedInvoice] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  // ✅ FIXED: Use correct nested TRPC path
  const { data: pendingInvoices, isLoading, error } = trpc.autoInvoices.getPendingAutoInvoices.useQuery();

  const approveMutation = trpc.autoInvoices.approveAutoInvoice.useMutation({
    onSuccess: () => {
      Alert.alert("Success", "Invoice approved successfully");
      utils.autoInvoices.getPendingAutoInvoices.invalidate();
      setSelectedInvoice(null);
      setNotes("");
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const rejectMutation = trpc.autoInvoices.rejectAutoInvoice.useMutation({
    onSuccess: () => {
      Alert.alert("Success", "Invoice rejected");
      utils.autoInvoices.getPendingAutoInvoices.invalidate();
      setSelectedInvoice(null);
      setNotes("");
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleApprove = (invoiceId: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Alert.alert(
      "Approve Invoice",
      "Are you sure you want to approve this invoice?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Approve",
          onPress: () => {
            approveMutation.mutate({ invoiceId, notes });
          },
        },
      ]
    );
  };

  const handleReject = (invoiceId: number) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (!notes.trim()) {
      Alert.alert("Error", "Please provide a reason for rejection");
      return;
    }
    Alert.alert(
      "Reject Invoice",
      "Are you sure you want to reject this invoice?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: () => {
            rejectMutation.mutate({ invoiceId, notes });
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="mt-4 text-muted">Loading pending invoices...</Text>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center p-6">
        <Text className="text-error text-center mb-4">Error: {error.message}</Text>
        <TouchableOpacity
          onPress={() => utils.autoInvoices.getPendingAutoInvoices.invalidate()}
          className="bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-background font-semibold">Retry</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">Invoice Review</Text>
          <Text className="text-muted">{pendingInvoices?.length || 0} invoices</Text>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row mb-4 gap-2">
          <TouchableOpacity className="flex-1 bg-primary px-4 py-2 rounded-lg">
            <Text className="text-background font-semibold text-center">Approved</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-surface px-4 py-2 rounded-lg border border-border">
            <Text className="text-foreground text-center">Pending</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-surface px-4 py-2 rounded-lg border border-border">
            <Text className="text-foreground text-center">Rejected</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 bg-surface px-4 py-2 rounded-lg border border-border">
            <Text className="text-foreground text-center">All</Text>
          </TouchableOpacity>
        </View>

        {/* Invoice List */}
        {!pendingInvoices || pendingInvoices.length === 0 ? (
          <View className="flex-1 items-center justify-center py-12">
            <Text className="text-muted text-center">No Invoices Found</Text>
            <Text className="text-muted text-center text-sm mt-2">
              No invoices match the selected filter
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            {pendingInvoices.map((invoice: any) => (
              <View
                key={invoice.id}
                className="bg-surface rounded-xl p-4 border border-border"
              >
                {/* Invoice Header */}
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold text-base">
                      {invoice.userName || "Unknown User"}
                    </Text>
                    <Text className="text-muted text-sm">{invoice.userEmail}</Text>
                  </View>
                  <View className="bg-warning/20 px-3 py-1 rounded-full">
                    <Text className="text-warning font-semibold text-sm">
                      {invoice.status || "pending"}
                    </Text>
                  </View>
                </View>

                {/* Invoice Details */}
                <View className="border-t border-border pt-3 mb-3">
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-muted">Invoice Code:</Text>
                    <Text className="text-foreground font-semibold">
                      {invoice.invoiceCode || `#${invoice.invoiceNumber}`}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-muted">Project:</Text>
                    <Text className="text-foreground">{invoice.projectName || "N/A"}</Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-muted">Amount:</Text>
                    <Text className="text-foreground font-bold text-lg">
                      £{typeof invoice.amount === 'number' ? invoice.amount.toFixed(2) : invoice.amount}
                    </Text>
                  </View>
                  <View className="flex-row justify-between mb-2">
                    <Text className="text-muted">Submitted:</Text>
                    <Text className="text-foreground">
                      {invoice.submittedAt ? new Date(invoice.submittedAt).toLocaleDateString() : "N/A"}
                    </Text>
                  </View>
                  {invoice.activityCount && (
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-muted">Activities:</Text>
                      <Text className="text-foreground">{invoice.activityCount}</Text>
                    </View>
                  )}
                  {invoice.totalHours && (
                    <View className="flex-row justify-between">
                      <Text className="text-muted">Total Hours:</Text>
                      <Text className="text-foreground">{invoice.totalHours}</Text>
                    </View>
                  )}
                </View>

                {/* Expandable Notes Section */}
                {selectedInvoice === invoice.id && (
                  <View className="border-t border-border pt-3 mb-3">
                    <Text className="text-foreground font-semibold mb-2">Notes (optional):</Text>
                    <TextInput
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="Add notes or reason for rejection..."
                      placeholderTextColor={colors.muted}
                      multiline
                      numberOfLines={3}
                      className="bg-background border border-border rounded-lg p-3 text-foreground"
                      style={{ textAlignVertical: "top" }}
                    />
                  </View>
                )}

                {/* Action Buttons */}
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    onPress={() => {
                      if (selectedInvoice === invoice.id) {
                        setSelectedInvoice(null);
                        setNotes("");
                      } else {
                        setSelectedInvoice(invoice.id);
                      }
                    }}
                    className="flex-1 bg-surface border border-border px-4 py-3 rounded-lg"
                  >
                    <Text className="text-foreground font-semibold text-center">
                      {selectedInvoice === invoice.id ? "Cancel" : "Review"}
                    </Text>
                  </TouchableOpacity>

                  {selectedInvoice === invoice.id && (
                    <>
                      <TouchableOpacity
                        onPress={() => handleReject(invoice.id)}
                        disabled={rejectMutation.isPending}
                        className="flex-1 bg-error px-4 py-3 rounded-lg"
                      >
                        <Text className="text-background font-semibold text-center">
                          {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleApprove(invoice.id)}
                        disabled={approveMutation.isPending}
                        className="flex-1 bg-success px-4 py-3 rounded-lg"
                      >
                        <Text className="text-background font-semibold text-center">
                          {approveMutation.isPending ? "Approving..." : "Approve"}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
