import { Text, View, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export default function InvoiceAnalyticsScreen() {
  const colors = useColors();
  const { data: analytics, isLoading } = trpc.analytics.getInvoiceAnalytics.useQuery();

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  const totalPaid = parseFloat(analytics?.totalPaid || "0");
  const totalPending = parseFloat(analytics?.totalPending || "0");
  const totalRejected = parseFloat(analytics?.totalRejected || "0");

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-6">
        {/* Header with Back Button */}
        <View className="flex-row items-center mb-4">
          
          <View className="flex-1">
            <Text className="text-2xl font-bold text-foreground">Invoice Analytics</Text>
            <Text className="text-sm text-muted mt-1">Financial insights & trends</Text>
          </View>
        </View>

        {/* Summary Cards */}
        <View className="gap-3 mb-4">
          <View className="bg-success/10 rounded-2xl p-4 border border-success/30">
            <Text className="text-sm text-success font-medium mb-1">Total Paid</Text>
            <Text className="text-2xl font-bold text-foreground">£{totalPaid.toFixed(2)}</Text>
            <Text className="text-xs text-muted leading-relaxed mt-1">{analytics?.paidCount || 0} invoices</Text>
          </View>

          <View className="bg-warning/10 rounded-2xl p-4 border border-warning/30">
            <Text className="text-sm text-warning font-medium mb-1">Pending Approval</Text>
            <Text className="text-2xl font-bold text-foreground">£{totalPending.toFixed(2)}</Text>
            <Text className="text-xs text-muted leading-relaxed mt-1">{analytics?.pendingCount || 0} invoices</Text>
          </View>

          <View className="bg-error/10 rounded-2xl p-4 border border-error/30">
            <Text className="text-sm text-error font-medium mb-1">Rejected</Text>
            <Text className="text-2xl font-bold text-foreground">£{totalRejected.toFixed(2)}</Text>
            <Text className="text-xs text-muted leading-relaxed mt-1">{analytics?.rejectedCount || 0} invoices</Text>
          </View>
        </View>

        {/* Payments by Project */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">Payments by Project</Text>
          {analytics?.byProject && analytics.byProject.length > 0 ? (
            <View className="gap-3">
              {analytics.byProject.map((project: any) => {
                const amount = parseFloat(project.totalAmount || "0");
                const percentage = totalPaid > 0 ? (amount / totalPaid) * 100 : 0;

                return (
                  <View key={project.projectId} className="bg-surface rounded-2xl p-4 border border-border">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-base font-semibold text-foreground flex-1">
                        {project.projectName || "Unknown Project"}
                      </Text>
                      <Text className="text-lg font-bold text-foreground">£{amount.toFixed(2)}</Text>
                    </View>
                    <View className="bg-border h-2 rounded-full overflow-hidden">
                      <View 
                        className="bg-primary h-full rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </View>
                    <Text className="text-xs text-muted leading-relaxed mt-1">
                      {project.invoiceCount} invoices • {percentage.toFixed(1)}% of total
                    </Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="bg-surface rounded-2xl p-6 items-center">
              <Text className="text-muted">No project data available</Text>
            </View>
          )}
        </View>

        {/* Team Member Earnings Leaderboard */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">Top Earners</Text>
          {analytics?.topEarners && analytics.topEarners.length > 0 ? (
            <View className="gap-3">
              {analytics.topEarners.map((member: any, index: number) => {
                const amount = parseFloat(member.totalEarnings || "0");
                const medals = ["🥇", "🥈", "🥉"];

                return (
                  <View key={member.userId} className="bg-surface rounded-2xl p-4 border border-border">
                    <View className="flex-row items-center gap-3">
                      <Text className="text-2xl">{medals[index] || "👤"}</Text>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">
                          {member.userName || "Unknown"}
                        </Text>
                        <Text className="text-xs text-muted leading-relaxed">{member.invoiceCount} invoices</Text>
                      </View>
                      <Text className="text-xl font-bold text-foreground">£{amount.toFixed(2)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="bg-surface rounded-2xl p-6 items-center">
              <Text className="text-muted">No earnings data available</Text>
            </View>
          )}
        </View>

        {/* Monthly Trends */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">Monthly Spending</Text>
          {analytics?.monthlyTrends && analytics.monthlyTrends.length > 0 ? (
            <View className="gap-3">
              {analytics.monthlyTrends.map((month: any) => {
                const amount = parseFloat(month.totalAmount || "0");

                return (
                  <View key={month.month} className="bg-surface rounded-2xl p-4 border border-border">
                    <View className="flex-row justify-between items-center">
                      <View>
                        <Text className="text-base font-semibold text-foreground">{month.month}</Text>
                        <Text className="text-xs text-muted leading-relaxed">{month.invoiceCount} invoices</Text>
                      </View>
                      <Text className="text-xl font-bold text-foreground">£{amount.toFixed(2)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="bg-surface rounded-2xl p-6 items-center">
              <Text className="text-muted">No monthly data available</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
