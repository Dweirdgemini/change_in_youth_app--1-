import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";
import * as Haptics from "expo-haptics";

export default function InvoicesScreen() {
  const router = useRouter();
  const colors = useColors();

  const { data: invoices, isLoading } = trpc.invoiceSystem.getMyInvoices.useQuery();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "text-muted";
      case "pending":
        return "text-warning";
      case "approved":
        return "text-success";
      case "paid":
        return "text-success";
      case "rejected":
        return "text-error";
      default:
        return "text-muted";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-muted/20";
      case "pending":
        return "bg-warning/20";
      case "approved":
        return "bg-success/20";
      case "paid":
        return "bg-success/20";
      case "rejected":
        return "bg-error/20";
      default:
        return "bg-muted/20";
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">My Invoices</Text>
          <Text className="text-sm text-muted leading-relaxed">
            View and manage your submitted invoices
          </Text>
        </View>

        {/* Generate New Invoice Button */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/invoices/generate");
          }}
          style={({ pressed }) => [
            {
              transform: [{ scale: pressed ? 0.97 : 1 }] as any,
            },
          ]}
          className="bg-primary rounded-full py-4 mb-4"
        >
          <Text className="text-center text-white font-semibold text-base">
            + Generate New Invoice
          </Text>
        </Pressable>

        {/* Invoice List */}
        {invoices && invoices.length > 0 ? (
          <View className="gap-3">
            {invoices.map((invoice) => (
              <Pressable
                key={invoice.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.push(`/invoices/${invoice.id}` as any);
                }}
                style={({ pressed }) => [
                  {
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                className="bg-surface rounded-xl p-4 border border-border"
              >
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      {invoice.invoiceNumber}
                    </Text>
                    <Text className="text-sm text-muted mt-1">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View className={`px-3 py-1 rounded-full ${getStatusBg(invoice.status)}`}>
                    <Text className={`text-xs font-semibold uppercase ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </Text>
                  </View>
                </View>

                <View className="flex-row justify-between items-center">
                  <Text className="text-sm text-muted leading-relaxed">Total Amount</Text>
                  <Text className="text-xl font-bold text-foreground">
                    £{parseFloat(invoice.totalAmount).toFixed(2)}
                  </Text>
                </View>

                {invoice.paidAmount && parseFloat(invoice.paidAmount) > 0 && (
                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-sm text-muted leading-relaxed">Paid Amount</Text>
                    <Text className="text-base font-semibold text-success">
                      £{parseFloat(invoice.paidAmount).toFixed(2)}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        ) : (
          <View className="items-center justify-center py-12">
            <Text className="text-base text-muted text-center mb-4">
              No invoices yet
            </Text>
            <Text className="text-sm text-muted text-center">
              Generate your first invoice to get started
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
