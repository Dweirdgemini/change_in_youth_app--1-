import { View, Text, ScrollView, Pressable, TextInput, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { router } from "expo-router";

export default function DbsComplianceScreen() {
  const colors = useColors();
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: dbsRecords, refetch } = trpc.dbsTracking.getAllDbsRecords.useQuery();
  const { data: stats } = trpc.dbsTracking.getComplianceStats.useQuery();
  const deleteRecord = trpc.dbsTracking.deleteDbsRecord.useMutation();
  const updateStatuses = trpc.dbsTracking.updateStatuses.useMutation();

  const handleDelete = (recordId: number) => {
    Alert.alert("Delete DBS Record", "Are you sure you want to delete this DBS record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteRecord.mutateAsync({ recordId });
          refetch();
        },
      },
    ]);
  };

  const handleUpdateStatuses = async () => {
    const result = await updateStatuses.mutateAsync();
    Alert.alert("Statuses Updated", `Updated ${result.updated} DBS records`);
    refetch();
  };

  const filteredRecords = dbsRecords?.filter((record) => {
    const matchesStatus = filterStatus === "all" || record.status === filterStatus;
    const matchesSearch =
      !searchQuery ||
      record.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.certificateNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "valid":
        return "#22C55E";
      case "expiring_soon":
        return "#F59E0B";
      case "expired":
        return "#EF4444";
      case "pending":
        return "#6B7280";
      default:
        return colors.muted;
    }
  };

  const getStatusLabel = (status: string) => {
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
        return status;
    }
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground mb-2">DBS Compliance</Text>
          <Text className="text-base text-muted">Manage team member DBS certificates</Text>
        </View>

        {/* Stats Cards */}
        {stats && (
          <View className="flex-row flex-wrap gap-3 mb-4">
            <View className="flex-1 min-w-[45%] bg-surface rounded-xl p-4 border border-border">
              <Text className="text-2xl font-bold text-foreground">{stats.total}</Text>
              <Text className="text-sm text-muted mt-1">Total Records</Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-surface rounded-xl p-4 border border-border">
              <Text className="text-2xl font-bold" style={{ color: "#22C55E" }}>
                {stats.valid}
              </Text>
              <Text className="text-sm text-muted mt-1">Valid</Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-surface rounded-xl p-4 border border-border">
              <Text className="text-2xl font-bold" style={{ color: "#F59E0B" }}>
                {stats.expiringSoon}
              </Text>
              <Text className="text-sm text-muted mt-1">Expiring Soon</Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-surface rounded-xl p-4 border border-border">
              <Text className="text-2xl font-bold" style={{ color: "#EF4444" }}>
                {stats.expired}
              </Text>
              <Text className="text-sm text-muted mt-1">Expired</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View className="flex-row gap-3 mb-4">
          <Pressable
            onPress={() => router.push("/admin/dbs-add" as any)}
            className="flex-1 bg-primary rounded-lg p-3"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text className="text-background font-semibold text-center">Add DBS Record</Text>
          </Pressable>
          <Pressable
            onPress={handleUpdateStatuses}
            className="flex-1 bg-surface rounded-lg p-3 border border-border"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text className="text-foreground font-semibold text-center">Update Statuses</Text>
          </Pressable>
        </View>

        {/* Search */}
        <TextInput
          className="bg-surface rounded-lg p-3 mb-4 text-foreground border border-border"
          placeholder="Search by name or certificate number..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {/* Filter Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <View className="flex-row gap-2">
            {["all", "valid", "expiring_soon", "expired", "pending"].map((status) => (
              <Pressable
                key={status}
                onPress={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-full ${
                  filterStatus === status ? "bg-primary" : "bg-surface border border-border"
                }`}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text
                  className={`font-medium ${
                    filterStatus === status ? "text-background" : "text-foreground"
                  }`}
                >
                  {status === "all" ? "All" : getStatusLabel(status)}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {/* Records List */}
        <View className="gap-3">
          {filteredRecords?.map((record) => (
            <View key={record.id} className="bg-surface rounded-xl p-4 border border-border">
              <View className="flex-row justify-between items-start mb-3">
                <View className="flex-1">
                  <Text className="text-lg font-semibold text-foreground">{record.userName}</Text>
                  <Text className="text-sm text-muted leading-relaxed">{record.userEmail}</Text>
                </View>
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: getStatusColor(record.status) + "20" }}
                >
                  <Text className="text-xs font-semibold" style={{ color: getStatusColor(record.status) }}>
                    {getStatusLabel(record.status)}
                  </Text>
                </View>
              </View>

              <View className="gap-2 mb-3">
                <View className="flex-row">
                  <Text className="text-sm text-muted w-32">Certificate:</Text>
                  <Text className="text-sm text-foreground flex-1">{record.certificateNumber}</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-sm text-muted w-32">Type:</Text>
                  <Text className="text-sm text-foreground flex-1 capitalize">{record.dbsType}</Text>
                </View>
                <View className="flex-row">
                  <Text className="text-sm text-muted w-32">Issue Date:</Text>
                  <Text className="text-sm text-foreground flex-1">
                    {new Date(record.issueDate).toLocaleDateString()}
                  </Text>
                </View>
                <View className="flex-row">
                  <Text className="text-sm text-muted w-32">Expiry Date:</Text>
                  <Text className="text-sm text-foreground flex-1">
                    {new Date(record.expiryDate).toLocaleDateString()}
                  </Text>
                </View>
                {record.notes && (
                  <View className="flex-row">
                    <Text className="text-sm text-muted w-32">Notes:</Text>
                    <Text className="text-sm text-foreground flex-1">{record.notes}</Text>
                  </View>
                )}
              </View>

              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => router.push(`/admin/dbs-edit/${record.id}` as any)}
                  className="flex-1 bg-primary rounded-lg p-2"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text className="text-background font-medium text-center text-sm">Edit</Text>
                </Pressable>
                {record.certificateUrl && (
                  <Pressable
                    onPress={() => {
                      /* Open certificate URL */
                    }}
                    className="flex-1 bg-surface rounded-lg p-2 border border-border"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <Text className="text-foreground font-medium text-center text-sm">View Cert</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => handleDelete(record.id)}
                  className="flex-1 bg-error rounded-lg p-2"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text className="text-background font-medium text-center text-sm">Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>

        {filteredRecords?.length === 0 && (
          <View className="items-center justify-center py-12">
            <Text className="text-muted text-center">No DBS records found</Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
