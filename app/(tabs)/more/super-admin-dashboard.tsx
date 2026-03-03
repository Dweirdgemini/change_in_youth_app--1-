import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { useAuth } from "@/hooks/use-auth";

export default function SuperAdminDashboardScreen() {
  const { user } = useAuth();
  const { data: organizations, isLoading } = trpc.organizations.getAllOrganizations.useQuery();

  // Only super admins can access this page
  if (user?.role !== "super_admin") {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text className="text-xl font-bold text-foreground mb-4">Access Denied</Text>
        <Text className="text-base text-muted text-center mb-4">
          Only super administrators can access this dashboard.
        </Text>
        
      </ScreenContainer>
    );
  }

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
      </ScreenContainer>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "trial":
        return "bg-blue-100 text-blue-800";
      case "past_due":
        return "bg-yellow-100 text-yellow-800";
      case "suspended":
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case "enterprise":
        return "bg-purple-100 text-purple-800";
      case "professional":
        return "bg-blue-100 text-blue-800";
      case "starter":
        return "bg-green-100 text-green-800";
      case "trial":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-6">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">
            Super Admin Dashboard
          </Text>
          <Text className="text-base text-muted">
            Manage all organizations on the platform
          </Text>
        </View>

        {/* Stats Overview */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1 bg-blue-50 rounded-2xl p-4 border border-blue-200">
            <Text className="text-2xl font-bold text-blue-900 mb-1">
              {Array.isArray(organizations) ? organizations.length : 0}
            </Text>
            <Text className="text-sm text-blue-800">Total Organizations</Text>
          </View>

          <View className="flex-1 bg-green-50 rounded-2xl p-4 border border-green-200">
            <Text className="text-2xl font-bold text-green-900 mb-1">
              {Array.isArray(organizations) ? organizations.filter((org: any) => org.subscription_status === "active").length : 0}
            </Text>
            <Text className="text-sm text-green-800">Active</Text>
          </View>

          <View className="flex-1 bg-yellow-50 rounded-2xl p-4 border border-yellow-200">
            <Text className="text-2xl font-bold text-yellow-900 mb-1">
              {Array.isArray(organizations) ? organizations.filter((org: any) => org.subscription_status === "trial").length : 0}
            </Text>
            <Text className="text-sm text-yellow-800">Trials</Text>
          </View>
        </View>

        {/* Organizations List */}
        <View className="mb-4">
          <Text className="text-xl font-semibold text-foreground mb-4">
            All Organizations
          </Text>

          {Array.isArray(organizations) && organizations.length > 0 ? (
            organizations.map((org: any) => (
              <View
                key={org.id}
                className="bg-surface rounded-2xl p-5 mb-3 border border-border"
              >
                {/* Organization Header */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-foreground mb-1">
                      {org.name}
                    </Text>
                    <Text className="text-sm text-muted leading-relaxed">/{org.slug}</Text>
                  </View>
                  <View className="flex-row gap-2">
                    <View className={`px-3 py-1 rounded-full ${getTierBadge(org.subscription_tier)}`}>
                      <Text className="text-xs font-semibold uppercase">
                        {org.subscription_tier}
                      </Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${getStatusColor(org.subscription_status)}`}>
                      <Text className="text-xs font-semibold uppercase">
                        {org.subscription_status}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Organization Stats */}
                <View className="flex-row gap-4 mb-3">
                  <View>
                    <Text className="text-sm text-muted leading-relaxed">Users</Text>
                    <Text className="text-base font-semibold text-foreground">
                      {org.user_count || 0} / {org.max_users}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-sm text-muted leading-relaxed">Projects</Text>
                    <Text className="text-base font-semibold text-foreground">
                      {org.project_count || 0}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-sm text-muted leading-relaxed">Created</Text>
                    <Text className="text-base font-semibold text-foreground">
                      {new Date(org.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>

                {/* Contact Info */}
                {org.billing_email && (
                  <View className="mb-3">
                    <Text className="text-sm text-muted leading-relaxed">Billing Email</Text>
                    <Text className="text-sm text-foreground">{org.billing_email}</Text>
                  </View>
                )}

                {/* Onboarding Status */}
                <View className="flex-row items-center gap-2 mb-3">
                  <Text className="text-sm text-muted leading-relaxed">Onboarding:</Text>
                  {org.onboarding_completed ? (
                    <View className="bg-green-100 px-3 py-1 rounded-full">
                      <Text className="text-xs font-semibold text-green-800">✓ Completed</Text>
                    </View>
                  ) : (
                    <View className="bg-yellow-100 px-3 py-1 rounded-full">
                      <Text className="text-xs font-semibold text-yellow-800">
                        Step {org.onboarding_step || 0}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Actions */}
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="flex-1 bg-primary rounded-xl p-3 items-center"
                    onPress={() => {
                      // TODO: Navigate to organization details
                      alert(`View details for ${org.name}`);
                    }}
                  >
                    <Text className="text-white font-semibold text-sm">View Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-surface border border-border rounded-xl p-3 items-center"
                    onPress={() => {
                      // TODO: Impersonate organization admin
                      alert(`Switch to ${org.name} context`);
                    }}
                  >
                    <Text className="text-foreground font-semibold text-sm">Switch Context</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-surface rounded-2xl p-8 items-center border border-border">
              <Text className="text-base text-muted text-center leading-relaxed">
                No organizations found. Create your first organization to get started.
              </Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="mb-4">
          <Text className="text-xl font-semibold text-foreground mb-4">
            Quick Actions
          </Text>

          <TouchableOpacity
            className="bg-primary rounded-2xl p-5 mb-3 items-center"
            onPress={() => router.push("/organization-signup")}
          >
            <Text className="text-white font-semibold text-base">
              + Create New Organization
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-surface border border-border rounded-2xl p-5 items-center"
            onPress={() => {
              // TODO: Export organizations data
              alert("Export feature coming soon");
            }}
          >
            <Text className="text-foreground font-semibold text-base">
              📊 Export Organizations Data
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
