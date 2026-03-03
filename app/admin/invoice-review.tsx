import { View, Text, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { router } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function InvoiceReviewScreen() {
  const colors = useColors();
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [selectedInvoice, setSelectedInvoice] = useState<number | null>(null);
  const [adminComments, setAdminComments] = useState("");

  const { data: invoices, refetch } = (trpc.finance as any).getAllInvoices.useQuery({});
  const approveInvoice = trpc.invoiceSystem.approveInvoice.useMutation();
  const requestChanges = trpc.invoiceSystem.requestChanges.useMutation();

  const filteredInvoices = invoices?.filter((inv) => {
    if (statusFilter === "all") return true;
    return inv.status === statusFilter;
  });

  const handleApprove = async (invoiceId: number) => {
    try {
      await approveInvoice.mutateAsync({ invoiceId });
      Alert.alert("Success", "Invoice approved successfully");
      refetch();
      setSelectedInvoice(null);
      setAdminComments("");
    } catch (error) {
      Alert.alert("Error", "Failed to approve invoice");
      console.error(error);
    }
  };

  const handleRequestChanges = async (invoiceId: number) => {
    if (!adminComments.trim()) {
      Alert.alert("Error", "Please provide comments explaining what changes are needed");
      return;
    }

    try {
      await requestChanges.mutateAsync({
        invoiceId,
        comments: adminComments,
      });
      Alert.alert("Success", "Change request sent to team member");
      refetch();
      setSelectedInvoice(null);
      setAdminComments("");
    } catch (error) {
      Alert.alert("Error", "Failed to request changes");
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#22C55E";
      case "paid":
        return "#0EA5E9";
      case "pending":
        return "#F59E0B";
      case "rejected":
        return "#EF4444";
      default:
        return colors.muted;
    }
  };

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "paid", label: "Paid" },
    { value: "rejected", label: "Rejected" },
    { value: "all", label: "All" },
  ];

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header with Back Button */}
        <View className="mb-4">
          <View className="flex-row items-center mb-2">
            <Pressable
              onPress={() => router.back()}
              className="mr-3 p-2 -ml-2"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <IconSymbol name="chevron.left" size={28} color={colors.foreground} />
            </Pressable>
            <Text className="text-2xl font-bold text-foreground">Invoice Review</Text>
          </View>
          <Text className="text-base text-muted">
            {filteredInvoices?.length || 0} invoices
          </Text>
        </View>

        {/* Status Filter */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">Filter by Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {statusOptions.map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setStatusFilter(option.value)}
                  className={`px-4 py-2 rounded-full ${
                    statusFilter === option.value
                      ? "bg-primary"
                      : "bg-surface border border-border"
                  }`}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      statusFilter === option.value ? "text-background" : "text-foreground"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Invoices List */}
        <View className="gap-3 mb-4">
          {filteredInvoices && filteredInvoices.length > 0 ? (
            filteredInvoices.map((invoice) => (
              <View key={invoice.id} className="bg-surface rounded-xl p-4 border border-border">
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1 mr-3">
                    <Text className="text-lg font-semibold text-foreground">
                      {invoice.invoiceNumber}
                    </Text>
                    <Text className="text-sm text-muted leading-relaxed">
                      {/* Would show user name here */}
                      User ID: {invoice.userId}
                    </Text>
                    <Text className="text-xs text-muted leading-relaxed mt-1">
                      Submitted: {invoice.submittedAt ? new Date(invoice.submittedAt).toLocaleDateString() : "N/A"}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xl font-bold text-foreground">
                      £{parseFloat(invoice.totalAmount).toFixed(2)}
                    </Text>
                    <View
                      className="px-3 py-1 rounded-full mt-2"
                      style={{ backgroundColor: getStatusColor(invoice.status) + "20" }}
                    >
                      <Text
                        className="text-xs font-semibold capitalize"
                        style={{ color: getStatusColor(invoice.status) }}
                      >
                        {invoice.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {invoice.description && (
                  <Text className="text-sm text-muted mb-3">{invoice.description}</Text>
                )}

                {invoice.status === "pending" && (
                  <>
                    {selectedInvoice === invoice.id ? (
                      <View className="mt-3 pt-3 border-t border-border">
                        <Text className="text-sm font-semibold text-foreground mb-2">
                          Admin Comments (optional for approval, required for changes)
                        </Text>
                        <TextInput
                          className="bg-background rounded-lg p-3 text-foreground border border-border mb-3"
                          placeholder="Add comments or request specific changes..."
                          placeholderTextColor={colors.muted}
                          value={adminComments}
                          onChangeText={setAdminComments}
                          multiline
                          numberOfLines={3}
                        />
                        <View className="flex-row gap-2">
                          <Pressable
                            onPress={() => handleApprove(invoice.id)}
                            className="flex-1 bg-success rounded-lg p-3"
                            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                          >
                            <Text className="text-background font-semibold text-center">
                              Approve
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => handleRequestChanges(invoice.id)}
                            className="flex-1 bg-warning rounded-lg p-3"
                            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                          >
                            <Text className="text-background font-semibold text-center">
                              Request Changes
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => {
                              setSelectedInvoice(null);
                              setAdminComments("");
                            }}
                            className="bg-surface rounded-lg px-4 py-3 border border-border"
                            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                          >
                            <Text className="text-foreground font-semibold">Cancel</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => setSelectedInvoice(invoice.id)}
                        className="bg-primary rounded-lg p-3 mt-3"
                        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                      >
                        <Text className="text-background font-semibold text-center">
                          Review Invoice
                        </Text>
                      </Pressable>
                    )}
                  </>
                )}

                {invoice.adminComments && (
                  <View className="mt-3 pt-3 border-t border-border">
                    <Text className="text-xs font-semibold text-foreground mb-1">
                      Admin Comments:
                    </Text>
                    <Text className="text-sm text-muted leading-relaxed">{invoice.adminComments}</Text>
                  </View>
                )}

                {invoice.status === "approved" && (
                  <View className="mt-3 pt-3 border-t border-border">
                    <Text className="text-xs text-success">
                      Approved on {invoice.approvedAt ? new Date(invoice.approvedAt).toLocaleDateString() : "N/A"}
                    </Text>
                  </View>
                )}
              </View>
            ))
          ) : (
            <View className="bg-surface rounded-xl p-8 items-center border border-border">
              <Text className="text-lg font-semibold text-foreground mb-2 text-center">
                No Invoices Found
              </Text>
              <Text className="text-sm text-muted text-center">
                No invoices match the selected filter
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
