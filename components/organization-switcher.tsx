import { View, Text, TouchableOpacity, Modal, FlatList } from "react-native";
import { useState } from "react";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ORG_STORAGE_KEY = "selected_organization_id";

export function OrganizationSwitcher() {
  const colors = useColors();
  const [modalVisible, setModalVisible] = useState(false);
  
  const { data: organizations } = (trpc.organizations as any).getAll.useQuery();
  const { data: currentOrg } = (trpc.organizations as any).getCurrent.useQuery();
  const utils = trpc.useUtils();

  const handleSwitchOrg = async (orgId: number | null) => {
    if (orgId) {
      await AsyncStorage.setItem(ORG_STORAGE_KEY, orgId.toString());
    } else {
      await AsyncStorage.removeItem(ORG_STORAGE_KEY);
    }
    
    // Invalidate all queries to refetch with new org context
    utils.invalidate();
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
          backgroundColor: colors.surface,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: colors.border,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>
            Current Organization
          </Text>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground, marginTop: 2 }}>
            {currentOrg?.name || "All Organizations"}
          </Text>
        </View>
        <Text style={{ fontSize: 18, color: colors.muted }}>⌄</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 20,
              maxHeight: "70%",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "bold", color: colors.foreground, marginBottom: 16 }}>
              Switch Organization
            </Text>

            <FlatList
              data={[{ id: null, name: "All Organizations", slug: "all" }, ...(organizations || [])]}
              keyExtractor={(item) => item.id?.toString() || "all"}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSwitchOrg(item.id)}
                  style={{
                    padding: 16,
                    backgroundColor:
                      (currentOrg?.id === item.id) || (!currentOrg && !item.id)
                        ? colors.primary + "20"
                        : colors.surface,
                    borderRadius: 8,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor:
                      (currentOrg?.id === item.id) || (!currentOrg && !item.id)
                        ? colors.primary
                        : colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color:
                        (currentOrg?.id === item.id) || (!currentOrg && !item.id)
                          ? colors.primary
                          : colors.foreground,
                    }}
                  >
                    {item.name}
                  </Text>
                  {item.slug !== "all" && (
                    <Text style={{ fontSize: 12, color: colors.muted, marginTop: 4 }}>
                      {item.slug}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{
                padding: 16,
                backgroundColor: colors.surface,
                borderRadius: 8,
                marginTop: 16,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "600", color: colors.foreground }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
