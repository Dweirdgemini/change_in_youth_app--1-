import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuthContext } from "@/contexts/auth-context";
import { useMemo } from "react";

export default function MyEarningsScreen() {
  const colors = useColors();
  const { user, isAuthenticated } = useAuthContext();

  const { data: invoices, isLoading } = (trpc.finance as any).getInvoices.useQuery(
    { userId: user?.id },
    { enabled: isAuthenticated && !!user?.id }
  );

  // Calculate earnings statistics
  const earnings = useMemo(() => {
    if (!invoices) return { lifetime: 0, ytd: 0, pending: 0, paid: 0, approved: 0 };

    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);

    let lifetime = 0;
    let ytd = 0;
    let pending = 0;
    let paid = 0;
    let approved = 0;

    invoices.forEach((invoice) => {
      const amount = parseFloat(invoice.totalAmount);
      lifetime += amount;

      const invoiceDate = new Date(invoice.createdAt);
      if (invoiceDate >= yearStart) {
        ytd += amount;
      }

      if (invoice.status === "pending") {
        pending += amount;
      } else if (invoice.status === "approved") {
        approved += amount;
      } else if (invoice.status === "paid") {
        paid += amount;
      }
    });

    return { lifetime, ytd, pending, paid, approved };
  }, [invoices]);

  // Group invoices by month for timeline
  const timeline = useMemo(() => {
    if (!invoices) return [];

    const grouped = invoices.reduce((acc, invoice) => {
      const date = new Date(invoice.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: date.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
          invoices: [],
          total: 0,
        };
      }

      acc[monthKey].invoices.push(invoice);
      acc[monthKey].total += parseFloat(invoice.totalAmount);
      
      return acc;
    }, {} as Record<string, { month: string; invoices: any[]; total: number }>);

    return Object.values(grouped).sort((a: any, b: any) => b.month.localeCompare(a.month));
  }, [invoices]);

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="p-4 justify-center">
        <Text className="text-xl text-foreground text-center">Please sign in to view earnings</Text>
      </ScreenContainer>
    );
  }

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="p-4 border-b border-border">
          <View className="flex-row items-center mb-2">
            <Pressable
              onPress={() => router.back()}
              className="mr-3 p-2 -ml-2"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <IconSymbol name="chevron.left" size={28} color={colors.foreground} />
            </Pressable>
            <Text className="text-2xl font-bold text-foreground">My Earnings</Text>
          </View>
          <Text className="text-base text-muted">
            Complete earnings history and payment tracking
          </Text>
        </View>

        <View className="p-4 gap-4">
          {/* Earnings Summary Cards */}
          <View className="gap-3">
            {/* Lifetime Earnings */}
            <View className="bg-primary/10 border border-primary/30 rounded-2xl p-4">
              <Text className="text-sm text-muted mb-1">Lifetime Earnings</Text>
              <Text className="text-2xl font-bold text-primary">
                £{earnings.lifetime.toFixed(2)}
              </Text>
              <Text className="text-xs text-muted leading-relaxed mt-2">
                Total across all projects and sessions
              </Text>
            </View>

            {/* Year to Date */}
            <View className="bg-success/10 border border-success/30 rounded-2xl p-4">
              <Text className="text-sm text-muted mb-1">Year to Date ({new Date().getFullYear()})</Text>
              <Text className="text-2xl font-bold text-success">
                £{earnings.ytd.toFixed(2)}
              </Text>
              <Text className="text-xs text-muted leading-relaxed mt-2">
                Earnings since January 1st
              </Text>
            </View>

            {/* Status Breakdown */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-base font-semibold text-foreground mb-3">
                Payment Status
              </Text>
              <View className="gap-3">
                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full bg-success" />
                    <Text className="text-sm text-foreground">Paid</Text>
                  </View>
                  <Text className="text-base font-semibold text-foreground">
                    £{earnings.paid.toFixed(2)}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full bg-primary" />
                    <Text className="text-sm text-foreground">Approved</Text>
                  </View>
                  <Text className="text-base font-semibold text-foreground">
                    £{earnings.approved.toFixed(2)}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center">
                  <View className="flex-row items-center gap-2">
                    <View className="w-3 h-3 rounded-full bg-warning" />
                    <Text className="text-sm text-foreground">Pending</Text>
                  </View>
                  <Text className="text-base font-semibold text-foreground">
                    £{earnings.pending.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Payment History Timeline */}
          <View className="mt-2">
            <Text className="text-xl font-bold text-foreground mb-3">Payment History</Text>
            
            {timeline.length > 0 ? (
              <View className="gap-3">
                {timeline.map((period, index) => (
                  <View key={index} className="bg-surface rounded-2xl p-4 border border-border">
                    <View className="flex-row justify-between items-center mb-3">
                      <Text className="text-base font-semibold text-foreground">
                        {(period as any).month}
                      </Text>
                      <Text className="text-lg font-bold text-primary">
                        £{(period as any).total.toFixed(2)}
                      </Text>
                    </View>

                    <View className="gap-2">
                      {(period as any).invoices.map((invoice: any) => (
                        <View
                          key={invoice.id}
                          className="bg-background rounded-xl p-3 border border-border/50"
                        >
                          <View className="flex-row justify-between items-start">
                            <View className="flex-1">
                              <Text className="text-sm font-medium text-foreground">
                                {invoice.description || invoice.invoiceNumber}
                              </Text>
                              <Text className="text-xs text-muted leading-relaxed mt-1">
                                {new Date(invoice.createdAt).toLocaleDateString("en-GB")}
                              </Text>
                            </View>
                            <View className="items-end">
                              <Text className="text-base font-semibold text-foreground">
                                £{parseFloat(invoice.totalAmount).toFixed(2)}
                              </Text>
                              <View
                                className={`px-2 py-1 rounded-full mt-1 ${
                                  invoice.status === "paid"
                                    ? "bg-success/10"
                                    : invoice.status === "approved"
                                    ? "bg-primary/10"
                                    : "bg-warning/10"
                                }`}
                              >
                                <Text
                                  className={`text-xs font-medium ${
                                    invoice.status === "paid"
                                      ? "text-success"
                                      : invoice.status === "approved"
                                      ? "text-primary"
                                      : "text-warning"
                                  }`}
                                >
                                  {invoice.status === "paid"
                                    ? "Paid"
                                    : invoice.status === "approved"
                                    ? "Approved"
                                    : "Pending"}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View className="bg-surface rounded-2xl p-6 border border-border items-center">
                <Text className="text-base text-muted text-center leading-relaxed">
                  No payment history yet
                </Text>
                <Text className="text-sm text-muted text-center mt-2">
                  Your invoices will appear here once submitted
                </Text>
              </View>
            )}
          </View>

          {/* Quick Action */}
          <Pressable
            onPress={() => router.push("/my-invoice" as any)}
            className="bg-primary rounded-xl p-4 mt-2"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text className="text-background font-bold text-center text-base">
              Submit New Invoice
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
