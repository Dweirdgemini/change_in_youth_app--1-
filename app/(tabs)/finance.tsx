import { Text, View, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from "react-native";
import { SmoothScrollView } from "@/components/smooth-scroll-view";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { RefreshControl } from "@/components/refresh-control";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

type DateRange = "this_month" | "this_quarter" | "this_year" | "all_time";

export default function FinanceScreen() {
  const { user, isAuthenticated, loading } = useAuth();
  const [selectedTab, setSelectedTab] = useState<"overview" | "invoices" | "budget">("overview");
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>("this_month");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "finance";
  const colors = useColors();

  // Export budget report
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchProjects()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = async (format: "pdf" | "excel") => {
    try {
      Alert.alert("Exporting...", "Generating budget report");
      
      // For now, show placeholder - actual implementation would use budgetExport API
      setTimeout(() => {
        Alert.alert(
          "Export Complete",
          `Budget report exported as ${format.toUpperCase()}. In production, this would download the file.`
        );
      }, 1000);
    } catch (error) {
      Alert.alert("Error", "Failed to export budget report");
    }
  };

  // Admin queries - get all projects and budget lines
  const { data: projects, isLoading: loadingProjects, refetch: refetchProjects, error: projectsError } = (trpc.finance as any).getProjects.useQuery(
    undefined,
    { enabled: isAuthenticated && isAdmin }
  );

  const { data: budgetLines, isLoading: loadingBudget, error: budgetError } = (trpc.finance as any).getBudgetLines.useQuery(
    undefined,
    { enabled: isAuthenticated && isAdmin }
  );

  const { data: allInvoices, isLoading: loadingAllInvoices, error: invoicesError } = (trpc.finance as any).getInvoices.useQuery(
    {},
    { enabled: isAuthenticated && isAdmin }
  );

  // Team member queries - personal earnings only
  const { data: myInvoices, isLoading: loadingMyInvoices, error: myInvoicesError } = (trpc.finance as any).getMyInvoices.useQuery(
    undefined,
    { enabled: isAuthenticated && !isAdmin }
  );

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="p-4 justify-center">
        <View className="items-center gap-4">
          <Text className="text-2xl font-bold text-foreground text-center leading-tight">
            Sign in to view finance
          </Text>
          <TouchableOpacity
            className="bg-primary px-6 py-4 rounded-full mt-4 active:opacity-80"
            onPress={() => router.push("/login" as any)}
          >
            <Text className="text-background font-semibold text-lg">Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  // TEAM MEMBER VIEW - Personal Earnings Only
  if (!isAdmin) {
    const totalEarnings = myInvoices?.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0) || 0;
    const paidEarnings = myInvoices?.filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0) || 0;
    const pendingEarnings = myInvoices?.filter((inv) => inv.status === "pending" || inv.status === "approved")
      .reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0) || 0;

    return (
      <ScreenContainer>
        <SmoothScrollView
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
        >
          <View className="p-6 gap-4">
            {/* Header */}
            <View>
              <Text className="text-2xl font-bold text-foreground">My Earnings</Text>
              <Text className="text-base text-muted mt-1">Track your income</Text>
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-primary px-4 py-3 rounded-xl active:opacity-80"
                onPress={() => router.push("/receipts/upload" as any)}
              >
                <Text className="text-background font-semibold text-center">📸 Upload Receipts</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-surface border border-border px-4 py-3 rounded-xl active:opacity-80"
                onPress={() => router.push("/invoices/generate" as any)}
              >
                <Text className="text-foreground font-semibold text-center">📄 Generate Invoice</Text>
              </TouchableOpacity>
            </View>

            {/* Total Earnings Card */}
            <View className="bg-primary/10 rounded-2xl p-6 border border-primary/20">
              <Text className="text-sm text-primary mb-2">Total Earnings</Text>
              <Text className="text-2xl font-bold text-foreground">£{totalEarnings.toFixed(2)}</Text>
              <View className="flex-row gap-4 mt-4">
                <View className="flex-1">
                  <Text className="text-sm text-muted leading-relaxed">Paid</Text>
                  <Text className="text-lg font-semibold text-success">£{paidEarnings.toFixed(2)}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm text-muted leading-relaxed">Pending</Text>
                  <Text className="text-lg font-semibold text-warning">£{pendingEarnings.toFixed(2)}</Text>
                </View>
              </View>
            </View>

            {/* Invoice Stats */}
            <View className="flex-row gap-3">
              <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
                <Text className="text-2xl font-bold text-foreground">{myInvoices?.length || 0}</Text>
                <Text className="text-sm text-muted mt-1">Total Invoices</Text>
              </View>
              <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
                <Text className="text-2xl font-bold text-success">
                  {myInvoices?.filter((inv) => inv.status === "paid").length || 0}
                </Text>
                <Text className="text-sm text-muted mt-1">Paid</Text>
              </View>
              <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
                <Text className="text-2xl font-bold text-warning">
                  {myInvoices?.filter((inv) => inv.status === "pending").length || 0}
                </Text>
                <Text className="text-sm text-muted mt-1">Pending</Text>
              </View>
            </View>

            {/* My Invoices */}
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">My Invoices</Text>
              {myInvoicesError ? (
                <ErrorState
                  icon="exclamationmark.circle"
                  title="Failed to load invoices"
                  description="An error occurred while loading your invoices. Please try again."
                  retryLabel="Retry"
                  onRetry={() => {}}
                />
              ) : loadingMyInvoices ? (
                <ActivityIndicator />
              ) : myInvoices && myInvoices.length > 0 ? (
                myInvoices.map((invoice) => (
                  <TouchableOpacity
                    key={invoice.id}
                    className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
                    onPress={() => router.push(`/finance/invoice/${invoice.id}` as any)}
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">
                          {invoice.description || "Invoice"}
                        </Text>
                        {invoice.invoiceNumber && (
                          <Text className="text-xs text-muted leading-relaxed mt-1">#{invoice.invoiceNumber}</Text>
                        )}
                        <Text className="text-sm text-muted mt-1">
                          {invoice.submittedAt ? new Date(invoice.submittedAt).toLocaleDateString() : 'N/A'}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-lg font-bold text-foreground">
                          £{parseFloat(invoice.totalAmount).toFixed(2)}
                        </Text>
                        <View
                          className={`px-3 py-1 rounded-full mt-1 ${
                            invoice.status === "approved"
                              ? "bg-success/10"
                              : invoice.status === "rejected"
                              ? "bg-error/10"
                              : invoice.status === "paid"
                              ? "bg-primary/10"
                              : "bg-warning/10"
                          }`}
                        >
                          <Text
                            className={`text-xs font-medium ${
                              invoice.status === "approved"
                                ? "text-success"
                                : invoice.status === "rejected"
                                ? "text-error"
                                : invoice.status === "paid"
                                ? "text-primary"
                                : "text-warning"
                            }`}
                          >
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <EmptyState
                  icon="doc.text"
                  title="No invoices yet"
                  description="Submit your first invoice to track earnings"
                  actionLabel="Submit Invoice"
                  onAction={() => router.push("/my-invoice" as any)}
                />
              )}
            </View>
          </View>
        </SmoothScrollView>
      </ScreenContainer>
    );
  }

  // ADMIN VIEW - Full Budget Overview
  // Filter budget lines by selected project
  const filteredBudgetLines = selectedProjectId
    ? budgetLines?.filter((line) => line.projectId === selectedProjectId)
    : budgetLines;

  const selectedProject = projects?.find((p) => p.id === selectedProjectId);

  const totalBudget = filteredBudgetLines?.reduce((sum, line) => sum + parseFloat(line.allocatedAmount), 0) || 0;
  const totalSpent = filteredBudgetLines?.reduce((sum, line) => sum + parseFloat(line.spentAmount || "0"), 0) || 0;
  const totalRemaining = totalBudget - totalSpent;

  const pendingInvoices = allInvoices?.filter((inv) => inv.status === "pending").length || 0;
  const approvedInvoices = allInvoices?.filter((inv) => inv.status === "approved").length || 0;

  return (
    <ScreenContainer>
      <SmoothScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-foreground">Finance</Text>
              <Text className="text-base text-muted mt-1">Budget & Invoices</Text>
            </View>
          </View>

          {/* Project Selector */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Select Project</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6">
              <View className="flex-row gap-2 px-6 pr-12">
                <TouchableOpacity
                  className={`px-4 py-2 rounded-full ${
                    selectedProjectId === null ? "bg-primary" : "bg-surface border border-border"
                  }`}
                  onPress={() => setSelectedProjectId(null)}
                >
                  <Text
                    className={`font-medium ${
                      selectedProjectId === null ? "text-background" : "text-foreground"
                    }`}
                  >
                    All Projects
                  </Text>
                </TouchableOpacity>
                {projects?.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    className={`px-4 py-2 rounded-full ${
                      selectedProjectId === project.id ? "bg-primary" : "bg-surface border border-border"
                    }`}
                    onPress={() => setSelectedProjectId(project.id)}
                  >
                    <Text
                      className={`font-medium ${
                        selectedProjectId === project.id ? "text-background" : "text-foreground"
                      }`}
                    >
                      {project.code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            {selectedProject && (
              <View className="bg-surface rounded-xl p-3 border border-border">
                <Text className="text-sm font-semibold text-foreground">{selectedProject.name}</Text>
                <Text className="text-xs text-muted leading-relaxed mt-1">{selectedProject.description}</Text>
              </View>
            )}
          </View>

          {/* Tab Navigation */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              className={`flex-1 py-3 rounded-xl ${
                selectedTab === "overview" ? "bg-primary" : "bg-surface border border-border"
              }`}
              onPress={() => setSelectedTab("overview")}
            >
              <Text
                className={`text-center font-semibold ${
                  selectedTab === "overview" ? "text-background" : "text-foreground"
                }`}
              >
                Overview
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-xl ${
                selectedTab === "invoices" ? "bg-primary" : "bg-surface border border-border"
              }`}
              onPress={() => setSelectedTab("invoices")}
            >
              <Text
                className={`text-center font-semibold ${
                  selectedTab === "invoices" ? "text-background" : "text-foreground"
                }`}
              >
                Invoices
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 rounded-xl ${
                selectedTab === "budget" ? "bg-primary" : "bg-surface border border-border"
              }`}
              onPress={() => setSelectedTab("budget")}
            >
              <Text
                className={`text-center font-semibold ${
                  selectedTab === "budget" ? "text-background" : "text-foreground"
                }`}
              >
                Budget
              </Text>
            </TouchableOpacity>
          </View>

          {/* Overview Tab */}
          {selectedTab === "overview" && (
            <View className="gap-4">
              {/* Total Budget Card */}
              <View className="bg-surface rounded-2xl p-6 border border-border">
                <Text className="text-sm text-muted mb-2">Total Budget</Text>
                <Text className="text-2xl font-bold text-foreground">£{totalBudget.toFixed(2)}</Text>
                <View className="flex-row gap-4 mt-4">
                  <View className="flex-1">
                    <Text className="text-sm text-muted leading-relaxed">Spent</Text>
                    <Text className="text-lg font-semibold text-error">£{totalSpent.toFixed(2)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm text-muted leading-relaxed">Remaining</Text>
                    <Text className="text-lg font-semibold text-success">£{totalRemaining.toFixed(2)}</Text>
                  </View>
                </View>
                {/* Progress Bar */}
                <View className="mt-4 bg-border h-2 rounded-full overflow-hidden">
                  <View
                    className="bg-primary h-full"
                    style={{ width: `${totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0}%` }}
                  />
                </View>
                <Text className="text-xs text-muted leading-relaxed mt-2 text-center">
                  {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(1) : 0}% of budget used
                </Text>
              </View>

              {/* Invoice Stats */}
              <View className="flex-row gap-3">
                <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
                  <Text className="text-2xl font-bold text-warning">{pendingInvoices}</Text>
                  <Text className="text-sm text-muted mt-1">Pending</Text>
                </View>
                <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
                  <Text className="text-2xl font-bold text-success">{approvedInvoices}</Text>
                  <Text className="text-sm text-muted mt-1">Approved</Text>
                </View>
              </View>

              {/* Admin Quick Actions */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 bg-primary rounded-xl p-4 active:opacity-70"
                  onPress={() => router.push("/admin/import-historical-data" as any)}
                >
                  <Text className="text-background font-bold text-center text-sm">📊 Import Data</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-success rounded-xl p-4 active:opacity-70"
                  onPress={() => router.push("/admin/budget-management" as any)}
                >
                  <Text className="text-background font-bold text-center text-sm">💰 Budget</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-warning rounded-xl p-4 active:opacity-70"
                  onPress={() => router.push("/admin/invoice-review" as any)}
                >
                  <Text className="text-background font-bold text-center text-sm">✓ Review</Text>
                </TouchableOpacity>
              </View>

              {/* Recent Activity */}
              <View className="gap-3">
                <Text className="text-lg font-semibold text-foreground">Recent Invoices</Text>
                {loadingAllInvoices ? (
                  <ActivityIndicator />
                ) : allInvoices && allInvoices.length > 0 ? (
                  allInvoices.slice(0, 5).map((invoice) => (
                    <TouchableOpacity
                      key={invoice.id}
                      className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
                      onPress={() => router.push(`/finance/invoice/${invoice.id}` as any)}
                    >
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-foreground">
                            {invoice.description || "Invoice"}
                          </Text>
                          <Text className="text-sm text-muted mt-1">
                            {new Date(invoice.submittedAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-lg font-bold text-foreground">
                            £{parseFloat(invoice.amount).toFixed(2)}
                          </Text>
                          <View
                            className={`px-3 py-1 rounded-full mt-1 ${
                              invoice.status === "approved"
                                ? "bg-success/10"
                                : invoice.status === "rejected"
                                ? "bg-error/10"
                                : invoice.status === "paid"
                                ? "bg-primary/10"
                                : "bg-warning/10"
                            }`}
                          >
                            <Text
                              className={`text-xs font-medium ${
                                invoice.status === "approved"
                                  ? "text-success"
                                  : invoice.status === "rejected"
                                  ? "text-error"
                                  : invoice.status === "paid"
                                  ? "text-primary"
                                  : "text-warning"
                              }`}
                            >
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <EmptyState
                    icon="doc.text"
                    title="No invoices"
                    description="No invoices have been submitted yet"
                  />
                )}
              </View>
            </View>
          )}

          {/* Invoices Tab */}
          {selectedTab === "invoices" && (
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-semibold text-foreground">All Invoices</Text>
                <TouchableOpacity
                  className="bg-primary px-4 py-2 rounded-full active:opacity-80"
                  onPress={() => router.push("/finance-approvals" as any)}
                >
                  <Text className="text-background font-semibold text-sm">Review Pending</Text>
                </TouchableOpacity>
              </View>
              {loadingAllInvoices ? (
                <ActivityIndicator />
              ) : allInvoices && allInvoices.length > 0 ? (
                allInvoices.map((invoice) => (
                  <TouchableOpacity
                    key={invoice.id}
                    className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
                    onPress={() => router.push(`/finance/invoice/${invoice.id}` as any)}
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">
                          {invoice.description || "Invoice"}
                        </Text>
                        {invoice.invoiceNumber && (
                          <Text className="text-xs text-muted leading-relaxed mt-1">#{invoice.invoiceNumber}</Text>
                        )}
                        <Text className="text-sm text-muted mt-1">
                          {invoice.submittedAt ? new Date(invoice.submittedAt).toLocaleDateString() : 'N/A'}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-lg font-bold text-foreground">
                          £{parseFloat(invoice.totalAmount).toFixed(2)}
                        </Text>
                        <View
                          className={`px-3 py-1 rounded-full mt-1 ${
                            invoice.status === "approved"
                              ? "bg-success/10"
                              : invoice.status === "rejected"
                              ? "bg-error/10"
                              : invoice.status === "paid"
                              ? "bg-primary/10"
                              : "bg-warning/10"
                          }`}
                        >
                          <Text
                            className={`text-xs font-medium ${
                              invoice.status === "approved"
                                ? "text-success"
                                : invoice.status === "rejected"
                                ? "text-error"
                                : invoice.status === "paid"
                                ? "text-primary"
                                : "text-warning"
                            }`}
                          >
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <EmptyState
                  icon="doc.text"
                  title="No invoices"
                  description="No invoices have been submitted yet"
                />
              )}
            </View>
          )}

          {/* Budget Tab */}
          {selectedTab === "budget" && (
            <View className="gap-3">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg font-semibold text-foreground">Budget Breakdown</Text>
                  {selectedProject && (
                    <View className="bg-primary/10 px-3 py-1 rounded-full">
                      <Text className="text-xs font-semibold text-primary">{selectedProject.code}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  className="bg-primary px-4 py-2 rounded-full flex-row items-center gap-2"
                  onPress={() => {
                    Alert.alert(
                      "Export Budget Report",
                      "Choose export format:",
                      [
                        {
                          text: "Cancel",
                          style: "cancel",
                        },
                        {
                          text: "PDF",
                          onPress: () => handleExport("pdf"),
                        },
                        {
                          text: "Excel",
                          onPress: () => handleExport("excel"),
                        },
                      ]
                    );
                  }}
                >
                  <Ionicons name="download-outline" size={16} color="#fff" />
                  <Text className="text-background font-semibold text-sm">Export</Text>
                </TouchableOpacity>
              </View>

              {/* Date Range Filter */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6">
                <View className="flex-row gap-2 px-6 pr-12">
                  {[
                    { value: "this_month" as const, label: "This Month" },
                    { value: "this_quarter" as const, label: "This Quarter" },
                    { value: "this_year" as const, label: "This Year" },
                    { value: "all_time" as const, label: "All Time" },
                  ].map((range) => (
                    <TouchableOpacity
                      key={range.value}
                      className={`px-4 py-2 rounded-full ${
                        dateRange === range.value
                          ? "bg-primary"
                          : "bg-surface border border-border"
                      }`}
                      onPress={() => setDateRange(range.value)}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          dateRange === range.value ? "text-background" : "text-foreground"
                        }`}
                      >
                        {range.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              {loadingBudget ? (
                <ActivityIndicator />
              ) : filteredBudgetLines && filteredBudgetLines.length > 0 ? (
                filteredBudgetLines.map((line) => {
                  const allocated = parseFloat(line.allocatedAmount);
                  const spent = parseFloat(line.spentAmount || "0");
                  const variance = allocated - spent;
                  const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;

                  // Category display names
                  const categoryIcons: Record<string, string> = {
                    coordinator: "👨‍💼",
                    delivery: "👥",
                    venue_hire: "🏢",
                    evaluation_report: "📊",
                    contingency: "💰",
                    management_fee: "⚙️",
                    equipment_materials: "🔧"
                  };

                  // Budget alert logic
                  const isOverBudget = percentage >= 100;
                  const isNearLimit = percentage >= 80 && percentage < 100;

                  return (
                    <View key={line.id} className="bg-surface rounded-2xl p-4 border border-border">
                      <View className="flex-row items-center gap-2 mb-2">
                        <Text className="text-xl">{categoryIcons[line.category as keyof typeof categoryIcons] || "📋"}</Text>
                        <Text className="text-base font-bold text-foreground flex-1">{line.name}</Text>
                        {isOverBudget && (
                          <View className="bg-error/10 px-2 py-1 rounded-full flex-row items-center gap-1">
                            <Ionicons name="alert-circle" size={14} color="#EF4444" />
                            <Text className="text-xs font-bold text-error">Over Budget</Text>
                          </View>
                        )}
                        {isNearLimit && (
                          <View className="bg-warning/10 px-2 py-1 rounded-full flex-row items-center gap-1">
                            <Ionicons name="warning" size={14} color="#F59E0B" />
                            <Text className="text-xs font-bold text-warning">80%+</Text>
                          </View>
                        )}
                      </View>
                      {line.description && (
                        <Text className="text-xs text-muted leading-relaxed mt-1 mb-3">{line.description}</Text>
                      )}
                      
                      {/* Budget Line Table */}
                      <View className="bg-background rounded-lg p-3">
                        <View className="flex-row justify-between mb-2">
                          <Text className="text-xs font-semibold text-muted">Total Budget</Text>
                          <Text className="text-sm font-bold text-foreground">£{allocated.toFixed(2)}</Text>
                        </View>
                        <View className="flex-row justify-between mb-2">
                          <Text className="text-xs font-semibold text-muted">Spend So Far</Text>
                          <Text className="text-sm font-bold text-error">£{spent.toFixed(2)}</Text>
                        </View>
                        <View className="h-px bg-border my-2" />
                        <View className="flex-row justify-between">
                          <Text className="text-xs font-semibold text-muted">Variance (Remaining)</Text>
                          <Text className={`text-sm font-bold ${
                            variance < 0 ? "text-error" : "text-success"
                          }`}>
                            £{variance.toFixed(2)}
                          </Text>
                        </View>
                      </View>

                      {/* Progress Bar */}
                      <View className="mt-3 bg-border h-3 rounded-full overflow-hidden">
                        <View
                          className={`h-full ${
                            percentage >= 95 ? "bg-error" : percentage >= 80 ? "bg-warning" : "bg-success"
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </View>
                      <Text className={`text-xs font-medium mt-1 text-right ${
                        percentage >= 95 ? "text-error" : percentage >= 80 ? "text-warning" : "text-success"
                      }`}>
                        {percentage.toFixed(1)}% utilized
                      </Text>
                    </View>
                  );
                })
              ) : (
                <EmptyState
                  icon="chart.bar"
                  title="No budget lines"
                  description="No budget lines have been configured yet"
                />
              )}
            </View>
          )}
        </View>
      </SmoothScrollView>
    </ScreenContainer>
  );
}