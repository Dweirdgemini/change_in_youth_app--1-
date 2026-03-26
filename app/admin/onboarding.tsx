import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuthContext } from "@/contexts/auth-context";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function OnboardingManagementScreen() {
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();
  
  const [showCreatePack, setShowCreatePack] = useState(false);
  const [packForm, setPackForm] = useState({
    title: "",
    description: "",
    role: "team_member",
  });
  
  const { data: packs, refetch } = trpc.userProfile.getOnboardingPacks.useQuery(
    undefined,
    { enabled: isAuthenticated && user?.role === "admin" }
  );
  
  const createPackMutation = trpc.userProfile.createOnboardingPack.useMutation({
    onSuccess: () => {
      setShowCreatePack(false);
      setPackForm({ title: "", description: "", role: "team_member" });
      refetch();
    },
  });
  
  if (authLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }
  
  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <ScreenContainer className="p-4 justify-center">
        <View className="items-center gap-4">
          <Text className="text-2xl font-bold text-foreground text-center leading-tight">
            Access Denied
          </Text>
          <Text className="text-base text-muted text-center leading-relaxed">
            Only admins can manage onboarding packs
          </Text>
          <TouchableOpacity
            className="bg-primary px-6 py-4 rounded-full mt-4 active:opacity-80"
            onPress={() => router.back()}
          >
            <Text className="text-background font-semibold text-lg">Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }
  
  const handleCreatePack = () => {
    if (!packForm.title.trim()) {
      alert("Please enter a pack title");
      return;
    }
    
    createPackMutation.mutate({
      name: packForm.title.trim(),
      description: packForm.description.trim() || undefined,
      role: packForm.role as "admin" | "finance" | "team_member" | "student",
      documentIds: [],
    });
  };
  
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">Onboarding Packs</Text>
              <Text className="text-base text-muted mt-1">
                Manage document packs for new team members
              </Text>
            </View>
            <TouchableOpacity
              className="bg-surface w-10 h-10 rounded-full items-center justify-center border border-border active:opacity-70"
              onPress={() => router.back()}
            >
              <Text className="text-foreground text-lg">←</Text>
            </TouchableOpacity>
          </View>
          
          {/* Create Pack Button */}
          <TouchableOpacity
            className="bg-primary py-4 rounded-full active:opacity-80"
            onPress={() => setShowCreatePack(true)}
          >
            <Text className="text-background font-semibold text-center text-lg">
              + Create New Pack
            </Text>
          </TouchableOpacity>
          
          {/* Info Card */}
          <View className="bg-[#F5A962]/10 border border-[#F5A962]/30 rounded-2xl p-4">
            <Text className="text-base font-semibold text-foreground mb-2">
              📚 Onboarding Packs
            </Text>
            <Text className="text-sm text-muted leading-relaxed">
              Create document collections for different roles. Assign packs to new team members to ensure they have all necessary materials for their position.
            </Text>
          </View>
          
          {/* Packs List */}
          {packs && packs.length > 0 ? (
            <View className="gap-3">
              {packs.map((pack) => (
                <View
                  key={pack.id}
                  className="bg-surface rounded-2xl p-4 border border-border"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-foreground">{pack.name}</Text>
                      {pack.description && (
                        <Text className="text-sm text-muted mt-1">{pack.description}</Text>
                      )}
                      <View className="flex-row items-center gap-2 mt-2">
                        <View className="bg-primary/10 px-3 py-1 rounded-full">
                          <Text className="text-xs font-medium text-primary">{pack.role}</Text>
                        </View>
                        <Text className="text-xs text-muted leading-relaxed">
                          Created {new Date(pack.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      className="bg-primary/10 w-10 h-10 rounded-full items-center justify-center active:opacity-70"
                      onPress={() => router.push(`/admin/onboarding/${pack.id}` as any)}
                    >
                      <Text className="text-primary text-lg">→</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-surface rounded-2xl p-6 border border-border items-center">
              <Text className="text-base text-muted text-center leading-relaxed">
                No onboarding packs yet. Create one to get started!
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Create Pack Modal */}
      <Modal visible={showCreatePack} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6" style={{ maxHeight: "80%" }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-bold text-foreground">Create Onboarding Pack</Text>
              <TouchableOpacity onPress={() => setShowCreatePack(false)}>
                <Text className="text-2xl text-muted">×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView className="gap-4">
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Pack Title *</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl p-3 text-foreground"
                  placeholder="e.g., Facilitator Onboarding"
                  placeholderTextColor="#9BA1A6"
                  value={packForm.title}
                  onChangeText={(text) => setPackForm({ ...packForm, title: text })}
                />
              </View>
              
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Description</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl p-3 text-foreground"
                  placeholder="Brief description of this pack..."
                  placeholderTextColor="#9BA1A6"
                  multiline
                  numberOfLines={3}
                  value={packForm.description}
                  onChangeText={(text) => setPackForm({ ...packForm, description: text })}
                />
              </View>
              
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Role</Text>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className={`flex-1 py-3 rounded-xl border ${
                      packForm.role === "team_member" 
                        ? "bg-primary border-primary" 
                        : "bg-surface border-border"
                    }`}
                    onPress={() => setPackForm({ ...packForm, role: "team_member" })}
                  >
                    <Text className={`text-center font-semibold ${
                      packForm.role === "team_member" ? "text-background" : "text-foreground"
                    }`}>
                      Facilitator
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className={`flex-1 py-3 rounded-xl border ${
                      packForm.role === "admin" 
                        ? "bg-primary border-primary" 
                        : "bg-surface border-border"
                    }`}
                    onPress={() => setPackForm({ ...packForm, role: "admin" })}
                  >
                    <Text className={`text-center font-semibold ${
                      packForm.role === "admin" ? "text-background" : "text-foreground"
                    }`}>
                      Admin
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <TouchableOpacity
                className="bg-primary py-4 rounded-full active:opacity-80 mt-4"
                onPress={handleCreatePack}
                disabled={createPackMutation.isPending}
              >
                <Text className="text-background font-semibold text-center text-lg">
                  {createPackMutation.isPending ? "Creating..." : "Create Pack"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
