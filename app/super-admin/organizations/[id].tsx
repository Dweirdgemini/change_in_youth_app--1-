import { View, Text, ScrollView, TouchableOpacity, Switch, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

export default function OrganizationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const orgId = parseInt(id);

  const { data: allOrgs } = trpc.organizations.getAllOrganizations.useQuery();
  const { data: packages } = trpc.organizations.getAvailablePackages.useQuery();
  
  const organization = (Array.isArray(allOrgs) ? allOrgs : [])?.find((org: any) => org.id === orgId);

  const enableFeature = trpc.organizations.enableFeature.useMutation({
    onSuccess: () => {
      Alert.alert("Success", "Feature enabled");
    },
  });

  const disableFeature = trpc.organizations.disableFeature.useMutation({
    onSuccess: () => {
      Alert.alert("Success", "Feature disabled");
    },
  });

  const handleToggleFeature = (featureSlug: string, currentlyEnabled: boolean) => {
    if (currentlyEnabled) {
      disableFeature.mutate({ organizationId: orgId, featureSlug });
    } else {
      enableFeature.mutate({ organizationId: orgId, featureSlug });
    }
  };

  if (!organization) {
    return (
      <ScreenContainer className="p-4">
        <Text className="text-foreground">Loading...</Text>
      </ScreenContainer>
    );
  }

  // Get enabled features for this org
  const enabledFeatures = new Set(
    (Array.isArray(packages) ? packages : [])
      ?.filter((pkg: any) => {
        // Check if this feature is enabled for the org
        // This is a simplified check - in production you'd query organization_features
        return true; // For now, show all packages
      })
      .map((pkg: any) => pkg.slug)
  );

  const tierColors: Record<string, string> = {
    starter: "#10B981",
    professional: "#3B82F6",
    enterprise: "#8B5CF6",
    custom: "#F59E0B",
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-4">
          

          <Text className="text-2xl font-bold text-foreground">{organization.name}</Text>
          <Text className="text-sm text-muted mt-1">@{organization.slug}</Text>
        </View>

        {/* Organization Info Card */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <Text className="text-base font-bold text-foreground mb-4">Organization Details</Text>
          
          <View className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-sm text-muted leading-relaxed">Subscription Tier</Text>
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: `${tierColors[organization.subscription_tier]}20` }}
              >
                <Text
                  className="text-xs font-semibold capitalize"
                  style={{ color: tierColors[organization.subscription_tier] }}
                >
                  {organization.subscription_tier}
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-sm text-muted leading-relaxed">Status</Text>
              <Text className="text-sm font-semibold text-foreground capitalize">
                {organization.subscription_status}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-sm text-muted leading-relaxed">Users</Text>
              <Text className="text-sm font-semibold text-foreground">
                {organization.user_count || 0} / {organization.max_users}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-sm text-muted leading-relaxed">Projects</Text>
              <Text className="text-sm font-semibold text-foreground">
                {organization.project_count || 0}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-sm text-muted leading-relaxed">Billing Email</Text>
              <Text className="text-sm font-semibold text-foreground">
                {organization.billing_email || "Not set"}
              </Text>
            </View>

            {organization.trial_ends_at && organization.subscription_status === "trial" && (
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted leading-relaxed">Trial Ends</Text>
                <Text className="text-sm font-semibold text-warning">
                  {new Date(organization.trial_ends_at).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Feature Packages */}
        <View className="mb-4">
          <Text className="text-lg font-bold text-foreground mb-4">Feature Packages</Text>
          
          <View className="gap-3">
            {(Array.isArray(packages) ? packages : [])?.map((pkg: any) => {
              const isEnabled = enabledFeatures.has(pkg.slug);
              
              return (
                <View
                  key={pkg.id}
                  className="bg-surface border border-border rounded-xl p-4"
                >
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1 mr-4">
                      <View className="flex-row items-center gap-2 mb-1">
                        <Text className="text-base font-bold text-foreground">{pkg.name}</Text>
                        {pkg.is_addon && (
                          <View className="bg-warning/20 px-2 py-1 rounded">
                            <Text className="text-xs font-semibold text-warning">Add-on</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-xs text-muted leading-relaxed">{pkg.description}</Text>
                      {pkg.is_addon && pkg.addon_price && (
                        <Text className="text-xs font-semibold text-primary mt-2">
                          £{pkg.addon_price}/month
                        </Text>
                      )}
                    </View>
                    <Switch
                      value={isEnabled}
                      onValueChange={() => handleToggleFeature(pkg.slug, isEnabled)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                      thumbColor={colors.background}
                    />
                  </View>

                  {/* Feature List */}
                  {pkg.features && (
                    <View className="mt-3 pt-3 border-t border-border">
                      <Text className="text-xs text-muted leading-relaxed mb-2">Includes:</Text>
                      <View className="flex-row flex-wrap gap-2">
                        {JSON.parse(pkg.features).map((feature: string, index: number) => (
                          <View key={index} className="bg-primary/10 px-2 py-1 rounded">
                            <Text className="text-xs text-primary capitalize">
                              {feature.replace(/_/g, " ")}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Actions */}
        <View className="gap-3 mb-8">
          <TouchableOpacity
            className="bg-primary py-4 rounded-xl active:opacity-70"
            onPress={() => Alert.alert("Coming Soon", "Organization settings editor")}
          >
            <Text className="text-background text-center font-bold">Edit Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-error/10 border border-error py-4 rounded-xl active:opacity-70"
            onPress={() => Alert.alert("Coming Soon", "Suspend organization")}
          >
            <Text className="text-error text-center font-bold">Suspend Organization</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
