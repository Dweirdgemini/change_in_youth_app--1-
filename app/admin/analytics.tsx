import { View, Text, ScrollView } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function OrganizationAnalyticsScreen() {
  const colors = useColors();

  const { data: sessions } = (trpc.scheduling as any).getAllSessions.useQuery();
  const { data: invoices } = (trpc.finance as any).getAllInvoices.useQuery();
  const { data: projects } = (trpc.invoiceSystem as any).getProjects.useQuery();
  const { data: participants } = (trpc.participantJourney as any).getStats.useQuery();

  // Calculate total hours delivered
  const totalHours = sessions?.reduce((sum, session) => {
    if (session.startTime && session.endTime) {
      const start = new Date(session.startTime);
      const end = new Date(session.endTime);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return sum + hours;
    }
    return sum;
  }, 0) || 0;

  // Calculate budget utilization by project
  const budgetUtilization = projects?.map((project) => {
    const projectInvoices = invoices?.filter((inv) => inv.projectId === project.id) || [];
    const spent = projectInvoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + parseFloat(inv.paidAmount || "0"), 0);
    const pending = projectInvoices
      .filter((inv) => inv.status === "approved" || inv.status === "pending")
      .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);
    const budget = parseFloat(project.budget || "0");
    const utilization = budget > 0 ? ((spent + pending) / budget) * 100 : 0;

    return {
      projectName: project.name,
      budget,
      spent,
      pending,
      remaining: budget - spent - pending,
      utilization,
    };
  }) || [];

  // Calculate total participants reached
  const totalParticipants = participants?.totalParticipants || 0;
  const activeParticipants = participants?.activeParticipants || 0;

  // Calculate total budget across all projects
  const totalBudget = projects?.reduce((sum, p) => sum + parseFloat(p.budget || "0"), 0) || 0;
  const totalSpent = invoices
    ?.filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + parseFloat(inv.paidAmount || "0"), 0) || 0;
  const totalPending = invoices
    ?.filter((inv) => inv.status === "approved" || inv.status === "pending")
    .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0) || 0;

  const overallUtilization = totalBudget > 0 ? ((totalSpent + totalPending) / totalBudget) * 100 : 0;

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">
            Organization Analytics
          </Text>
          <Text className="text-base text-muted">
            Overview of impact and performance across all projects
          </Text>
        </View>

        {/* Key Metrics Grid */}
        <View className="gap-3 mb-4">
          <View className="flex-row gap-3">
            <View className="flex-1 bg-primary rounded-xl p-4">
              <Text className="text-background/80 text-xs font-semibold mb-1">
                TOTAL HOURS
              </Text>
              <Text className="text-background text-3xl font-bold">
                {totalHours.toFixed(1)}
              </Text>
              <Text className="text-background/80 text-xs mt-1">Delivered</Text>
            </View>
            <View className="flex-1 bg-success rounded-xl p-4">
              <Text className="text-background/80 text-xs font-semibold mb-1">
                PARTICIPANTS
              </Text>
              <Text className="text-background text-3xl font-bold">
                {totalParticipants}
              </Text>
              <Text className="text-background/80 text-xs mt-1">
                {activeParticipants} active
              </Text>
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 bg-warning rounded-xl p-4">
              <Text className="text-background/80 text-xs font-semibold mb-1">
                SESSIONS
              </Text>
              <Text className="text-background text-3xl font-bold">
                {sessions?.length || 0}
              </Text>
              <Text className="text-background/80 text-xs mt-1">Total delivered</Text>
            </View>
            <View className="flex-1 bg-error rounded-xl p-4">
              <Text className="text-background/80 text-xs font-semibold mb-1">
                PROJECTS
              </Text>
              <Text className="text-background text-3xl font-bold">
                {projects?.length || 0}
              </Text>
              <Text className="text-background/80 text-xs mt-1">Active programs</Text>
            </View>
          </View>
        </View>

        {/* Overall Budget Utilization */}
        <View className="bg-surface rounded-xl p-4 border border-border mb-4">
          <Text className="text-lg font-bold text-foreground mb-3">
            Overall Budget Utilization
          </Text>
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm text-muted leading-relaxed">Total Budget</Text>
            <Text className="text-lg font-bold text-foreground">
              £{totalBudget.toFixed(2)}
            </Text>
          </View>
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm text-muted leading-relaxed">Spent</Text>
            <Text className="text-lg font-bold text-success">
              £{totalSpent.toFixed(2)}
            </Text>
          </View>
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm text-muted leading-relaxed">Pending</Text>
            <Text className="text-lg font-bold text-warning">
              £{totalPending.toFixed(2)}
            </Text>
          </View>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-sm text-muted leading-relaxed">Remaining</Text>
            <Text className="text-lg font-bold text-foreground">
              £{(totalBudget - totalSpent - totalPending).toFixed(2)}
            </Text>
          </View>

          {/* Utilization Bar */}
          <View className="h-4 bg-background rounded-full overflow-hidden mb-2">
            <View
              className="h-full bg-success"
              style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
            />
            <View
              className="h-full bg-warning absolute top-0"
              style={{
                left: `${(totalSpent / totalBudget) * 100}%`,
                width: `${Math.min((totalPending / totalBudget) * 100, 100 - (totalSpent / totalBudget) * 100)}%`,
              }}
            />
          </View>
          <Text className="text-sm text-muted text-center">
            {overallUtilization.toFixed(1)}% utilized
          </Text>
        </View>

        {/* Budget by Project */}
        <Text className="text-xl font-bold text-foreground mb-4">Budget by Project</Text>

        {budgetUtilization.length > 0 ? (
          <View className="gap-3 mb-4">
            {budgetUtilization.map((project, index) => (
              <View
                key={index}
                className="bg-surface rounded-xl p-4 border border-border"
              >
                <Text className="text-lg font-semibold text-foreground mb-3">
                  {project.projectName}
                </Text>

                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm text-muted leading-relaxed">Budget</Text>
                  <Text className="text-base font-bold text-foreground">
                    £{project.budget.toFixed(2)}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm text-muted leading-relaxed">Spent</Text>
                  <Text className="text-base font-bold text-success">
                    £{project.spent.toFixed(2)}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-sm text-muted leading-relaxed">Pending</Text>
                  <Text className="text-base font-bold text-warning">
                    £{project.pending.toFixed(2)}
                  </Text>
                </View>

                {/* Project Utilization Bar */}
                <View className="h-3 bg-background rounded-full overflow-hidden mb-2">
                  <View
                    className="h-full bg-success"
                    style={{ width: `${Math.min((project.spent / project.budget) * 100, 100)}%` }}
                  />
                  <View
                    className="h-full bg-warning absolute top-0"
                    style={{
                      left: `${(project.spent / project.budget) * 100}%`,
                      width: `${Math.min((project.pending / project.budget) * 100, 100 - (project.spent / project.budget) * 100)}%`,
                    }}
                  />
                </View>
                <View className="flex-row justify-between items-center">
                  <Text className="text-xs text-muted leading-relaxed">
                    {project.utilization.toFixed(1)}% utilized
                  </Text>
                  <Text className="text-xs text-muted leading-relaxed">
                    £{project.remaining.toFixed(2)} remaining
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-surface rounded-xl p-8 items-center border border-border mb-4">
            <Text className="text-lg font-semibold text-foreground mb-2 text-center">
              No Project Data
            </Text>
            <Text className="text-sm text-muted text-center">
              Budget utilization will appear here once projects have invoices
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
