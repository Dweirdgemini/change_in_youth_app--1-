import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useColors } from "@/hooks/use-colors";

export default function OrganizationsManagementScreen() {
  const colors = useColors();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrg, setNewOrg] = useState({
    name: "",
    slug: "",
    subscriptionTier: "professional" as "starter" | "professional" | "enterprise" | "custom",
    billingEmail: "",
    maxUsers: 25,
  });

  const { data: organizations, refetch } = trpc.organizations.getAllOrganizations.useQuery();
  const createOrg = trpc.organizations.createOrganization.useMutation({
    onSuccess: () => {
      Alert.alert("Success", "Organization created successfully");
      setShowCreateModal(false);
      setNewOrg({ name: "", slug: "", subscriptionTier: "professional", billingEmail: "", maxUsers: 25 });
      refetch();
    },
    onError: (error) => {
      Alert.alert("Error", error.message);
    },
  });

  const handleCreateOrganization = () => {
    if (!newOrg.name || !newOrg.slug || !newOrg.billingEmail) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    createOrg.mutate(newOrg);
  };

  const tierColors: Record<string, string> = {
    starter: "#10B981",
    professional: "#3B82F6",
    enterprise: "#8B5CF6",
    custom: "#F59E0B",
  };

  const statusColors: Record<string, string> = {
    active: "#10B981",
    trial: "#F59E0B",
    suspended: "#EF4444",
    cancelled: "#6B7280",
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className="text-2xl font-bold text-foreground">Organizations</Text>
            <Text className="text-sm text-muted mt-1">Manage all tenant organizations</Text>
          </View>
          <TouchableOpacity
            className="bg-primary px-4 py-2 rounded-lg active:opacity-70"
            onPress={() => setShowCreateModal(true)}
          >
            <Text className="text-background font-semibold">+ New Org</Text>
          </TouchableOpacity>
        </View>

        {/* Organizations List */}
        <View className="gap-4">
          {(Array.isArray(organizations) ? organizations : [])?.map((org: any) => (
            <TouchableOpacity
              key={org.id}
              className="bg-surface border border-border rounded-2xl p-4"
              onPress={() => router.push(`/super-admin/organizations/${org.id}` as any)}
            >
              <View className="flex-row items-start justify-between mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-foreground">{org.name}</Text>
                  <Text className="text-xs text-muted leading-relaxed mt-1">@{org.slug}</Text>
                </View>
                <View className="gap-2">
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${tierColors[org.subscription_tier]}20` }}
                  >
                    <Text
                      className="text-xs font-semibold capitalize"
                      style={{ color: tierColors[org.subscription_tier] }}
                    >
                      {org.subscription_tier}
                    </Text>
                  </View>
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: `${statusColors[org.subscription_status]}20` }}
                  >
                    <Text
                      className="text-xs font-semibold capitalize"
                      style={{ color: statusColors[org.subscription_status] }}
                    >
                      {org.subscription_status}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-row gap-4 mt-2">
                <View className="flex-1">
                  <Text className="text-xs text-muted leading-relaxed">Users</Text>
                  <Text className="text-base font-semibold text-foreground mt-1">
                    {org.user_count || 0} / {org.max_users}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted leading-relaxed">Projects</Text>
                  <Text className="text-base font-semibold text-foreground mt-1">
                    {org.project_count || 0}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-xs text-muted leading-relaxed">Created</Text>
                  <Text className="text-base font-semibold text-foreground mt-1">
                    {new Date(org.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {org.trial_ends_at && org.subscription_status === "trial" && (
                <View className="mt-3 pt-3 border-t border-border">
                  <Text className="text-xs text-warning">
                    Trial ends: {new Date(org.trial_ends_at).toLocaleDateString()}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Create Organization Modal */}
        <Modal visible={showCreateModal} animationType="slide" transparent>
          <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
            <View className="bg-background rounded-t-3xl p-6" style={{ maxHeight: "90%" }}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-foreground">Create Organization</Text>
                <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                  <Text className="text-muted text-lg">✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="gap-4">
                  {/* Organization Name */}
                  <View>
                    <Text className="text-sm font-semibold text-foreground mb-2">Organization Name *</Text>
                    <TextInput
                      className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                      placeholder="e.g., Account Hackney"
                      placeholderTextColor={colors.muted}
                      value={newOrg.name}
                      onChangeText={(text) => {
                        setNewOrg({ ...newOrg, name: text });
                        // Auto-generate slug
                        if (!newOrg.slug || newOrg.slug === newOrg.name.toLowerCase().replace(/\s+/g, "-")) {
                          setNewOrg({ ...newOrg, name: text, slug: text.toLowerCase().replace(/\s+/g, "-") });
                        }
                      }}
                    />
                  </View>

                  {/* Slug */}
                  <View>
                    <Text className="text-sm font-semibold text-foreground mb-2">Slug (URL identifier) *</Text>
                    <TextInput
                      className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                      placeholder="e.g., account-hackney"
                      placeholderTextColor={colors.muted}
                      value={newOrg.slug}
                      onChangeText={(text) => setNewOrg({ ...newOrg, slug: text.toLowerCase().replace(/\s+/g, "-") })}
                      autoCapitalize="none"
                    />
                  </View>

                  {/* Billing Email */}
                  <View>
                    <Text className="text-sm font-semibold text-foreground mb-2">Billing Email *</Text>
                    <TextInput
                      className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                      placeholder="admin@organization.com"
                      placeholderTextColor={colors.muted}
                      value={newOrg.billingEmail}
                      onChangeText={(text) => setNewOrg({ ...newOrg, billingEmail: text })}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>

                  {/* Subscription Tier */}
                  <View>
                    <Text className="text-sm font-semibold text-foreground mb-2">Subscription Tier</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {(["starter", "professional", "enterprise", "custom"] as const).map((tier) => (
                        <TouchableOpacity
                          key={tier}
                          className={`px-4 py-2 rounded-lg border ${
                            newOrg.subscriptionTier === tier ? "border-primary" : "border-border"
                          }`}
                          style={{
                            backgroundColor: newOrg.subscriptionTier === tier ? `${tierColors[tier]}20` : colors.surface,
                          }}
                          onPress={() => setNewOrg({ ...newOrg, subscriptionTier: tier })}
                        >
                          <Text
                            className="text-sm font-semibold capitalize"
                            style={{ color: newOrg.subscriptionTier === tier ? tierColors[tier] : colors.foreground }}
                          >
                            {tier}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Max Users */}
                  <View>
                    <Text className="text-sm font-semibold text-foreground mb-2">Max Users</Text>
                    <TextInput
                      className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
                      placeholder="25"
                      placeholderTextColor={colors.muted}
                      value={String(newOrg.maxUsers)}
                      onChangeText={(text) => setNewOrg({ ...newOrg, maxUsers: parseInt(text) || 25 })}
                      keyboardType="number-pad"
                    />
                  </View>

                  {/* Create Button */}
                  <TouchableOpacity
                    className="bg-primary py-4 rounded-xl mt-4 active:opacity-70"
                    onPress={handleCreateOrganization}
                    disabled={createOrg.isPending}
                  >
                    <Text className="text-background text-center font-bold text-base">
                      {createOrg.isPending ? "Creating..." : "Create Organization"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </ScreenContainer>
  );
}
