import { View, Text, ScrollView, Pressable, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { router } from "expo-router";

export default function TeamDirectoryScreen() {
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState("");
  const [dbsFilter, setDbsFilter] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [projectFilter, setProjectFilter] = useState<number | null>(null);

  const { data: teamMembers } = (trpc.admin as any).getAllUsers.useQuery();
  const { data: projects } = trpc.projectAssignments.getMyProjects.useQuery();
  const { data: dbsRecords } = trpc.dbsTracking.getAllDbsRecords.useQuery();

  // Build team member data with DBS status
  const enrichedTeamMembers = teamMembers?.map((member) => {
    const dbsRecord = dbsRecords?.find((dbs) => dbs.userId === member.id);
    return {
      ...member,
      dbsStatus: dbsRecord?.status || "no_dbs",
      dbsExpiry: dbsRecord?.expiryDate,
    };
  });

  // Apply filters
  const filteredMembers = enrichedTeamMembers?.filter((member) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // DBS status filter
    if (dbsFilter && member.dbsStatus !== dbsFilter) {
      return false;
    }

    // Role filter
    if (roleFilter && member.role !== roleFilter) {
      return false;
    }

    // Project filter (would need to join with project assignments)
    // Simplified for now
    if (projectFilter) {
      // In real implementation, check if user is assigned to this project
    }

    return true;
  });

  const getDbsStatusColor = (status: string) => {
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

  const getDbsStatusLabel = (status: string) => {
    switch (status) {
      case "valid":
        return "Valid";
      case "expiring_soon":
        return "Expiring";
      case "expired":
        return "Expired";
      case "pending":
        return "Pending";
      default:
        return "No DBS";
    }
  };

  const dbsFilterOptions = [
    { value: null, label: "All" },
    { value: "valid", label: "Valid" },
    { value: "expiring_soon", label: "Expiring Soon" },
    { value: "expired", label: "Expired" },
    { value: "no_dbs", label: "No DBS" },
  ];

  const roleFilterOptions = [
    { value: null, label: "All Roles" },
    { value: "team_member", label: "Facilitator" },
    { value: "admin", label: "Admin" },
    { value: "finance", label: "Finance" },
  ];

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">Team Directory</Text>
          <Text className="text-base text-muted">
            {filteredMembers?.length || 0} team members
          </Text>
        </View>

        {/* Search Bar */}
        <View className="mb-4">
          <TextInput
            className="bg-surface rounded-lg p-4 text-foreground border border-border"
            placeholder="Search by name or email..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filters */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-2">DBS Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-2">
              {dbsFilterOptions.map((option) => (
                <Pressable
                  key={option.value || "all"}
                  onPress={() => setDbsFilter(option.value)}
                  className={`px-4 py-2 rounded-full ${
                    dbsFilter === option.value ? "bg-primary" : "bg-surface border border-border"
                  }`}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text
                    className={`text-sm font-semibold ${
                      dbsFilter === option.value ? "text-background" : "text-foreground"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <Text className="text-sm font-semibold text-foreground mb-2">Role</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {roleFilterOptions.map((option) => (
                <Pressable
                  key={option.value || "all"}
                  onPress={() => setRoleFilter(option.value)}
                  className={`px-4 py-2 rounded-full ${
                    roleFilter === option.value ? "bg-primary" : "bg-surface border border-border"
                  }`}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text
                    className={`text-sm font-semibold capitalize ${
                      roleFilter === option.value ? "text-background" : "text-foreground"
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Team Members List */}
        <View className="gap-3 mb-4">
          {filteredMembers && filteredMembers.length > 0 ? (
            filteredMembers.map((member) => (
              <Pressable
                key={member.id}
                onPress={() => router.push(`/team/${member.id}`)}
                className="bg-surface rounded-xl p-4 border border-border"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 mr-3">
                    <Text className="text-lg font-semibold text-foreground">{member.name}</Text>
                    <Text className="text-sm text-muted capitalize">{member.role}</Text>
                    <Text className="text-xs text-muted leading-relaxed mt-1">{member.email}</Text>
                  </View>
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: getDbsStatusColor(member.dbsStatus) + "20" }}
                  >
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: getDbsStatusColor(member.dbsStatus) }}
                    >
                      {getDbsStatusLabel(member.dbsStatus)}
                    </Text>
                  </View>
                </View>

                {member.dbsExpiry && member.dbsStatus !== "no_dbs" && (
                  <Text className="text-xs text-muted leading-relaxed">
                    DBS Expires: {new Date(member.dbsExpiry).toLocaleDateString()}
                  </Text>
                )}
              </Pressable>
            ))
          ) : (
            <View className="bg-surface rounded-xl p-8 items-center border border-border">
              <Text className="text-lg font-semibold text-foreground mb-2 text-center">
                No Team Members Found
              </Text>
              <Text className="text-sm text-muted text-center">
                Try adjusting your search or filters
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
