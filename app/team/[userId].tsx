import { View, Text, ScrollView, Pressable } from "react-native";
import { ScreenWithBackButton } from "@/components/screen-with-back-button";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useLocalSearchParams, router } from "expo-router";

export default function TeamMemberProfileScreen() {
  const colors = useColors();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  
  const { data: user } = (trpc.admin as any).getUser.useQuery({ userId: parseInt(userId) });
  const { data: dbsRecord } = trpc.dbsTracking.getDbsRecord.useQuery({ userId: parseInt(userId) });
  const { data: projects } = (trpc.projectAssignments as any).getMyProjects.useQuery({ userId: parseInt(userId) });
  const { data: sessions } = (trpc.scheduling as any).getSessions.useQuery({ facilitatorId: parseInt(userId) });
  const { data: invoices } = (trpc.invoiceSystem as any).getMyInvoices.useQuery({ userId: parseInt(userId) });

  if (!user) {
    return (
      <ScreenWithBackButton>
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted">Loading...</Text>
        </View>
      </ScreenWithBackButton>
    );
  }

  const getDbsStatusColor = (status?: string) => {
    switch (status) {
      case "valid":
        return "#22C55E";
      case "expiring_soon":
        return "#F59E0B";
      case "expired":
        return "#EF4444";
      default:
        return colors.muted;
    }
  };

  const getDbsStatusLabel = (status?: string) => {
    switch (status) {
      case "valid":
        return "Valid";
      case "expiring_soon":
        return "Expiring Soon";
      case "expired":
        return "Expired";
      case "pending":
        return "Pending";
      default:
        return "No DBS";
    }
  };

  const totalPaid = invoices?.filter((inv) => inv.status === "paid").reduce((sum, inv) => sum + Number(inv.totalAmount), 0) || 0;
  const totalPending = invoices?.filter((inv) => inv.status === "pending").reduce((sum, inv) => sum + Number(inv.totalAmount), 0) || 0;

  return (
    <ScreenWithBackButton>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">{user.name}</Text>
          <Text className="text-base text-muted capitalize">{user.role}</Text>
          <Text className="text-sm text-muted mt-1">{user.email}</Text>
        </View>

        {/* DBS Status Card */}
        <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-foreground">DBS Status</Text>
            <View
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: getDbsStatusColor(dbsRecord?.status) + "20" }}
            >
              <Text className="text-xs font-semibold" style={{ color: getDbsStatusColor(dbsRecord?.status) }}>
                {getDbsStatusLabel(dbsRecord?.status)}
              </Text>
            </View>
          </View>

          {dbsRecord ? (
            <View className="gap-2">
              <View className="flex-row">
                <Text className="text-sm text-muted w-32">Certificate:</Text>
                <Text className="text-sm text-foreground flex-1">{dbsRecord.certificateNumber}</Text>
              </View>
              <View className="flex-row">
                <Text className="text-sm text-muted w-32">Expiry Date:</Text>
                <Text className="text-sm text-foreground flex-1">
                  {new Date(dbsRecord.expiryDate).toLocaleDateString()}
                </Text>
              </View>
              <View className="flex-row">
                <Text className="text-sm text-muted w-32">Type:</Text>
                <Text className="text-sm text-foreground flex-1 capitalize">{dbsRecord.dbsType}</Text>
              </View>
            </View>
          ) : (
            <Text className="text-sm text-muted leading-relaxed">No DBS record on file</Text>
          )}
        </View>

        {/* Assigned Projects */}
        <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-3">Assigned Projects</Text>
          {projects && projects.length > 0 ? (
            <View className="gap-2">
              {projects.map((project) => (
                <View key={project.projectId} className="flex-row items-center">
                  <View className="w-2 h-2 rounded-full bg-primary mr-2" />
                  <Text className="text-sm text-foreground flex-1">{project.projectName}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-muted leading-relaxed">No projects assigned</Text>
          )}
        </View>

        {/* Payment Summary */}
        <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-3">Payment Summary</Text>
          <View className="flex-row gap-3">
            <View className="flex-1 bg-background rounded-lg p-3 border border-border">
              <Text className="text-2xl font-bold text-success">£{totalPaid.toFixed(2)}</Text>
              <Text className="text-xs text-muted leading-relaxed mt-1">Total Paid</Text>
            </View>
            <View className="flex-1 bg-background rounded-lg p-3 border border-border">
              <Text className="text-2xl font-bold text-warning">£{totalPending.toFixed(2)}</Text>
              <Text className="text-xs text-muted leading-relaxed mt-1">Pending</Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push(`/invoices?userId=${userId}`)}
            className="bg-primary rounded-lg p-3 mt-3"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text className="text-background font-semibold text-center">View All Invoices</Text>
          </Pressable>
        </View>

        {/* Recent Sessions */}
        <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-foreground">Recent Sessions</Text>
            <Text className="text-sm text-muted leading-relaxed">{sessions?.length || 0} total</Text>
          </View>
          {sessions && sessions.length > 0 ? (
            <View className="gap-3">
              {sessions.slice(0, 5).map((session) => (
                <View key={session.id} className="bg-background rounded-lg p-3 border border-border">
                  <Text className="text-sm font-semibold text-foreground">{session.title}</Text>
                  <Text className="text-xs text-muted leading-relaxed mt-1">
                    {new Date(session.startTime).toLocaleDateString()} at{" "}
                    {new Date(session.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-muted leading-relaxed">No sessions found</Text>
          )}
        </View>

        {/* Contact Information */}
        <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-3">Contact Information</Text>
          <View className="gap-2">
            <View className="flex-row">
              <Text className="text-sm text-muted w-24">Email:</Text>
              <Text className="text-sm text-foreground flex-1">{user.email}</Text>
            </View>
            {user.phone && (
              <View className="flex-row">
                <Text className="text-sm text-muted w-24">Phone:</Text>
                <Text className="text-sm text-foreground flex-1">{user.phone}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View className="gap-3 mb-4">
          <Pressable
            onPress={() => router.push(`/admin/participant-journey?userId=${userId}`)}
            className="bg-primary rounded-lg p-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text className="text-background font-semibold text-center">View Activity Timeline</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push(`/messages/${userId}`)}
            className="bg-surface rounded-lg p-4 border border-border"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text className="text-foreground font-semibold text-center">Send Message</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenWithBackButton>
  );
}
