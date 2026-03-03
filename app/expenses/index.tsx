import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Image } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export default function ExpensesScreen() {
  const { user, loading: authLoading } = useAuth();
  const colors = useColors();
  
  const isAdmin = user?.role === "admin" || user?.role === "finance";
  
  // Fetch expenses based on role
  const { data: myExpenses, isLoading: loadingMy } = trpc.invoiceSystem.getMyExpenses.useQuery(
    undefined,
    { enabled: !isAdmin }
  );
  
  const { data: allExpenses, isLoading: loadingAll } = trpc.invoiceSystem.getAllExpenses.useQuery(
    undefined,
    { enabled: isAdmin }
  );

  const expenses = isAdmin ? allExpenses : myExpenses;
  const isLoading = isAdmin ? loadingAll : loadingMy;

  if (authLoading || isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "text-success bg-success/10";
      case "rejected":
        return "text-error bg-error/10";
      case "pending":
        return "text-warning bg-warning/10";
      default:
        return "text-muted bg-surface";
    }
  };

  const totalAmount = expenses?.reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0) || 0;
  const approvedAmount = expenses
    ?.filter((exp) => exp.status === "approved")
    .reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0) || 0;
  const pendingAmount = expenses
    ?.filter((exp) => exp.status === "pending")
    .reduce((sum, exp) => sum + parseFloat(exp.amount.toString()), 0) || 0;

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Back Button */}
          

          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-foreground">
                {isAdmin ? "All Expenses" : "My Expenses"}
              </Text>
              <Text className="text-base text-muted mt-1">
                {expenses?.length || 0} expense{expenses?.length !== 1 ? "s" : ""} submitted
              </Text>
            </View>
            {!isAdmin && (
              <TouchableOpacity
                className="bg-primary w-12 h-12 rounded-full items-center justify-center active:opacity-80"
                onPress={() => router.push("/expenses/create" as any)}
              >
                <Text className="text-background text-2xl font-bold">+</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Summary Cards */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-2xl font-bold text-foreground">£{totalAmount.toFixed(2)}</Text>
              <Text className="text-sm text-muted mt-1">Total</Text>
            </View>
            <View className="flex-1 bg-success/10 rounded-2xl p-4 border border-success/20">
              <Text className="text-2xl font-bold text-success">£{approvedAmount.toFixed(2)}</Text>
              <Text className="text-sm text-foreground mt-1">Approved</Text>
            </View>
            <View className="flex-1 bg-warning/10 rounded-2xl p-4 border border-warning/20">
              <Text className="text-2xl font-bold text-warning">£{pendingAmount.toFixed(2)}</Text>
              <Text className="text-sm text-foreground mt-1">Pending</Text>
            </View>
          </View>

          {/* Expenses List */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Recent Expenses</Text>
            {expenses && expenses.length > 0 ? (
              expenses.map((expense) => (
                <TouchableOpacity
                  key={expense.id}
                  className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
                  onPress={() => router.push(`/expenses/${expense.id}` as any)}
                >
                  <View className="flex-row gap-3">
                    {/* Receipt Thumbnail */}
                    {expense.receiptUrl ? (
                      <Image
                        source={{ uri: expense.receiptUrl }}
                        className="w-16 h-16 rounded-xl"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-16 h-16 rounded-xl bg-border items-center justify-center">
                        <Ionicons name="receipt-outline" size={24} color={colors.muted} />
                      </View>
                    )}

                    {/* Expense Details */}
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">
                        {expense.description}
                      </Text>
                      <Text className="text-sm text-muted mt-1">
                        {new Date(expense.expenseDate).toLocaleDateString()}
                      </Text>
                      <View
                        className={`px-3 py-1 rounded-full mt-2 self-start ${getStatusColor(
                          expense.status
                        )}`}
                      >
                        <Text className={`text-xs font-medium ${getStatusColor(expense.status)}`}>
                          {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                        </Text>
                      </View>
                    </View>

                    {/* Amount */}
                    <View className="items-end justify-center">
                      <Text className="text-lg font-bold text-foreground">
                        £{parseFloat(expense.amount.toString()).toFixed(2)}
                      </Text>
                      {expense.receiptUrl && (
                        <View className="flex-row items-center gap-1 mt-1">
                          <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                          <Text className="text-xs text-success">Receipt</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="bg-surface rounded-2xl p-8 border border-border items-center">
                <Ionicons name="receipt-outline" size={64} color={colors.muted} />
                <Text className="text-base text-muted text-center mt-4">No expenses submitted yet</Text>
                {!isAdmin && (
                  <TouchableOpacity
                    className="bg-primary px-6 py-3 rounded-full mt-4 active:opacity-80"
                    onPress={() => router.push("/expenses/create" as any)}
                  >
                    <Text className="text-background font-semibold">Submit Your First Expense</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Quick Actions */}
          {!isAdmin && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Quick Actions</Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 bg-primary rounded-xl py-4 items-center active:opacity-80"
                  onPress={() => router.push("/receipts/upload" as any)}
                >
                  <Ionicons name="camera" size={24} color="#fff" />
                  <Text className="text-white font-semibold mt-1">Upload Receipts</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-surface border border-border rounded-xl py-4 items-center active:opacity-80"
                  onPress={() => router.push("/expenses/create" as any)}
                >
                  <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
                  <Text className="text-foreground font-semibold mt-1">Add Expense</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
