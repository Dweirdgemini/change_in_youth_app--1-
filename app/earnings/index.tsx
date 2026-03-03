import { View, Text, ScrollView } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

export default function EarningsDashboardScreen() {
  const colors = useColors();

  const { data: invoices } = trpc.invoiceSystem.getMyInvoices.useQuery();
  const { data: projects } = trpc.invoiceSystem.getProjects.useQuery();

  // Calculate earnings by project
  const earningsByProject = projects?.map((project) => {
    const projectInvoices = invoices?.filter((inv) => inv.projectId === project.id) || [];
    
    const totalEarned = projectInvoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + parseFloat(inv.paidAmount || "0"), 0);
    
    const pending = projectInvoices
      .filter((inv) => inv.status === "approved" || inv.status === "pending")
      .reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);
    
    return {
      projectId: project.id,
      projectName: project.name,
      totalEarned,
      pending,
      total: totalEarned + pending,
    };
  });

  // Calculate totals
  const totalEarned = earningsByProject?.reduce((sum, p) => sum + p.totalEarned, 0) || 0;
  const totalPending = earningsByProject?.reduce((sum, p) => sum + p.pending, 0) || 0;
  const grandTotal = totalEarned + totalPending;

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">My Earnings</Text>
          <Text className="text-base text-muted">Track your income across all projects</Text>
        </View>

        {/* Total Earnings Card */}
        <View className="bg-primary rounded-2xl p-6 mb-4">
          <Text className="text-background/80 text-sm font-semibold mb-2">TOTAL EARNINGS</Text>
          <Text className="text-background text-4xl font-bold mb-4">
            £{grandTotal.toFixed(2)}
          </Text>
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-background/80 text-xs mb-1">Paid</Text>
              <Text className="text-background text-xl font-semibold">
                £{totalEarned.toFixed(2)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-background/80 text-xs mb-1">Pending</Text>
              <Text className="text-background text-xl font-semibold">
                £{totalPending.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Earnings by Project */}
        <Text className="text-xl font-bold text-foreground mb-4">Earnings by Project</Text>
        
        {earningsByProject && earningsByProject.length > 0 ? (
          <View className="gap-3 mb-4">
            {earningsByProject.map((project) => (
              <View
                key={project.projectId}
                className="bg-surface rounded-xl p-4 border border-border"
              >
                <Text className="text-lg font-semibold text-foreground mb-3">
                  {project.projectName}
                </Text>
                
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm text-muted leading-relaxed">Total Earned</Text>
                  <Text className="text-lg font-bold text-success">
                    £{project.totalEarned.toFixed(2)}
                  </Text>
                </View>
                
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-sm text-muted leading-relaxed">Pending Payment</Text>
                  <Text className="text-lg font-bold text-warning">
                    £{project.pending.toFixed(2)}
                  </Text>
                </View>
                
                <View className="h-px bg-border my-2" />
                
                <View className="flex-row justify-between items-center">
                  <Text className="text-sm font-semibold text-foreground">Project Total</Text>
                  <Text className="text-xl font-bold text-foreground">
                    £{project.total.toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View className="bg-surface rounded-xl p-8 items-center border border-border mb-4">
            <Text className="text-lg font-semibold text-foreground mb-2 text-center">
              No Earnings Yet
            </Text>
            <Text className="text-sm text-muted text-center">
              Complete sessions and submit invoices to start tracking your earnings
            </Text>
          </View>
        )}

        {/* Recent Invoices */}
        <Text className="text-xl font-bold text-foreground mb-4">Recent Invoices</Text>
        
        {invoices && invoices.length > 0 ? (
          <View className="gap-3 mb-4">
            {invoices.slice(0, 5).map((invoice) => {
              const project = projects?.find((p) => p.id === invoice.projectId);
              const statusColor = 
                invoice.status === "paid" ? "#22C55E" :
                invoice.status === "approved" ? "#0EA5E9" :
                invoice.status === "pending" ? "#F59E0B" :
                colors.muted;
              
              return (
                <View
                  key={invoice.id}
                  className="bg-surface rounded-xl p-4 border border-border"
                >
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 mr-3">
                      <Text className="text-base font-semibold text-foreground">
                        {invoice.invoiceNumber}
                      </Text>
                      <Text className="text-sm text-muted leading-relaxed">{project?.name || "Unknown Project"}</Text>
                      <Text className="text-xs text-muted leading-relaxed mt-1">
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-lg font-bold text-foreground">
                        £{parseFloat(invoice.totalAmount).toFixed(2)}
                      </Text>
                      <View
                        className="px-3 py-1 rounded-full mt-1"
                        style={{ backgroundColor: statusColor + "20" }}
                      >
                        <Text
                          className="text-xs font-semibold capitalize"
                          style={{ color: statusColor }}
                        >
                          {invoice.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View className="bg-surface rounded-xl p-8 items-center border border-border">
            <Text className="text-lg font-semibold text-foreground mb-2 text-center">
              No Invoices Yet
            </Text>
            <Text className="text-sm text-muted text-center">
              Submit your first invoice to start tracking payments
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
