import { View, Text, ScrollView, Pressable, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { router } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function ProjectManagementScreen() {
  const colors = useColors();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQuickBudgetEdit, setShowQuickBudgetEdit] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [quickBudgetAmount, setQuickBudgetAmount] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [totalBudget, setTotalBudget] = useState("");
  const [status, setStatus] = useState<"active" | "completed" | "on_hold">("active");

  const { data: projects, refetch } = (trpc.finance as any).getProjects.useQuery();
  const createProject = (trpc.finance as any).createProject.useMutation();
  const updateProject = (trpc.finance as any).updateProject.useMutation();

  const statusOptions = [
    { value: "active", label: "Active", color: "#22C55E" },
    { value: "completed", label: "Completed", color: "#0EA5E9" },
    { value: "on_hold", label: "On Hold", color: "#F59E0B" },
  ];

  const resetForm = () => {
    setName("");
    setCode("");
    setDescription("");
    setTotalBudget("");
    setStatus("active");
  };

  const handleCreate = async () => {
    if (!name || !code || !totalBudget) {
      Alert.alert("Required Fields", "Please fill in project name, code, and budget");
      return;
    }

    const budget = parseFloat(totalBudget);
    if (isNaN(budget) || budget <= 0) {
      Alert.alert("Invalid Budget", "Please enter a valid positive budget amount");
      return;
    }

    try {
      await createProject.mutateAsync({
        name,
        code: code.toUpperCase(),
        description: description.trim() || undefined,
        totalBudget: budget,
        status,
      });

      Alert.alert("Success", "Project created successfully");
      refetch();
      setShowCreateModal(false);
      resetForm();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create project");
      console.error(error);
    }
  };

  const handleEdit = async () => {
    if (!selectedProject) return;

    const budget = totalBudget ? parseFloat(totalBudget) : undefined;
    if (budget !== undefined && (isNaN(budget) || budget <= 0)) {
      Alert.alert("Invalid Budget", "Please enter a valid positive budget amount");
      return;
    }

    try {
      await updateProject.mutateAsync({
        projectId: selectedProject.id,
        name: name || undefined,
        code: code ? code.toUpperCase() : undefined,
        description: description || undefined,
        totalBudget: budget,
        status,
      });

      Alert.alert("Success", "Project updated successfully");
      refetch();
      setShowEditModal(false);
      setSelectedProject(null);
      resetForm();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update project");
      console.error(error);
    }
  };

  const openEditModal = (project: any) => {
    setSelectedProject(project);
    setName(project.name);
    setCode(project.code);
    setDescription(project.description || "");
    setTotalBudget(project.totalBudget);
    setStatus(project.status);
    setShowEditModal(true);
  };

  const openQuickBudgetEdit = (project: any) => {
    setSelectedProject(project);
    setQuickBudgetAmount(project.totalBudget);
    setShowQuickBudgetEdit(true);
  };

  const handleQuickBudgetUpdate = async () => {
    if (!selectedProject) return;

    const budget = parseFloat(quickBudgetAmount);
    if (isNaN(budget) || budget <= 0) {
      Alert.alert("Invalid Budget", "Please enter a valid positive budget amount");
      return;
    }

    try {
      await updateProject.mutateAsync({
        projectId: selectedProject.id,
        totalBudget: budget,
      });

      Alert.alert("Success", `Budget updated to £${budget.toFixed(2)}`);
      refetch();
      setShowQuickBudgetEdit(false);
      setSelectedProject(null);
      setQuickBudgetAmount("");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update budget");
      console.error(error);
    }
  };

  const getStatusColor = (projectStatus: string) => {
    return statusOptions.find((s) => s.value === projectStatus)?.color || colors.muted;
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header with Back Button */}
        <View className="mb-4">
          <View className="flex-row items-center mb-2">
            <Pressable
              onPress={() => router.back()}
              className="mr-3 p-2 -ml-2"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <IconSymbol name="chevron.left" size={28} color={colors.foreground} />
            </Pressable>
            <Text className="text-2xl font-bold text-foreground">Project Management</Text>
          </View>
          <Text className="text-base text-muted">
            Create and manage projects
          </Text>
        </View>

        {/* Create Button */}
        <Pressable
          onPress={() => setShowCreateModal(true)}
          className="bg-primary rounded-xl p-4 mb-4"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text className="text-background font-bold text-center text-base">
            + Create New Project
          </Text>
        </Pressable>

        {/* Projects List */}
        <View className="gap-3 mb-4">
          {projects && projects.length > 0 ? (
            projects.map((project) => (
              <View key={project.id} className="bg-surface rounded-xl p-4 border border-border">
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1 mr-3">
                    <Text className="text-lg font-semibold text-foreground">
                      {project.name}
                    </Text>
                    <Text className="text-sm text-muted leading-relaxed">
                      Code: {project.code}
                    </Text>
                  </View>
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{ backgroundColor: getStatusColor(project.status) + "20" }}
                  >
                    <Text
                      className="text-xs font-semibold capitalize"
                      style={{ color: getStatusColor(project.status) }}
                    >
                      {project.status.replace("_", " ")}
                    </Text>
                  </View>
                </View>

                {project.description && (
                  <Text className="text-sm text-muted mb-3">{project.description}</Text>
                )}

                <View className="flex-row items-center mb-3">
                  <Text className="text-2xl font-bold text-foreground">
                    £{parseFloat(project.totalBudget).toLocaleString()}
                  </Text>
                  <Text className="text-xs text-muted leading-relaxed ml-2">Total Budget</Text>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => openEditModal(project)}
                    className="flex-1 bg-primary/10 rounded-lg p-3"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <Text className="text-primary font-semibold text-center text-sm">
                      Edit Project
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openQuickBudgetEdit(project)}
                    className="flex-1 bg-warning/10 rounded-lg p-3"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <Text className="text-warning font-semibold text-center text-sm">
                      💷 Edit Budget
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-surface rounded-xl p-8 items-center border border-border">
              <Text className="text-lg font-semibold text-foreground mb-2 text-center">
                No Projects Yet
              </Text>
              <Text className="text-sm text-muted text-center">
                Create your first project to start tracking sessions and budgets
              </Text>
            </View>
          )}
        </View>

        {/* Create Modal */}
        <Modal
          visible={showCreateModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCreateModal(false)}
        >
          <View className="flex-1 bg-black/50 items-center justify-end">
            <View className="bg-background rounded-t-3xl p-6 w-full max-h-[90%]">
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text className="text-2xl font-bold text-foreground mb-4">
                  Create Project
                </Text>

                {/* Project Name */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Project Name *
                  </Text>
                  <TextInput
                    className="bg-surface rounded-xl p-4 text-foreground border border-border"
                    placeholder="e.g., Tree of Life Program"
                    placeholderTextColor={colors.muted}
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                {/* Project Code */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Project Code *
                  </Text>
                  <TextInput
                    className="bg-surface rounded-xl p-4 text-foreground border border-border"
                    placeholder="e.g., TOL-2026"
                    placeholderTextColor={colors.muted}
                    value={code}
                    onChangeText={setCode}
                    autoCapitalize="characters"
                  />
                  <Text className="text-xs text-muted leading-relaxed mt-1">
                    Short unique identifier for this project
                  </Text>
                </View>

                {/* Total Budget */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Total Budget (£) *
                  </Text>
                  <TextInput
                    className="bg-surface rounded-xl p-4 text-foreground border border-border"
                    placeholder="0.00"
                    placeholderTextColor={colors.muted}
                    value={totalBudget}
                    onChangeText={setTotalBudget}
                    keyboardType="decimal-pad"
                  />
                </View>

                {/* Status Selection */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">Status</Text>
                  <View className="flex-row gap-2">
                    {statusOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => setStatus(option.value as any)}
                        className={`flex-1 px-4 py-3 rounded-xl ${
                          status === option.value
                            ? "border-2"
                            : "bg-surface border border-border"
                        }`}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.7 : 1,
                          borderColor: status === option.value ? option.color : undefined,
                          backgroundColor: status === option.value ? option.color + "20" : undefined,
                        })}
                      >
                        <Text
                          className={`text-sm font-semibold text-center ${
                            status === option.value ? "" : "text-foreground"
                          }`}
                          style={{
                            color: status === option.value ? option.color : undefined,
                          }}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Description */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Description (Optional)
                  </Text>
                  <TextInput
                    className="bg-surface rounded-xl p-4 text-foreground border border-border"
                    placeholder="Brief description of the project..."
                    placeholderTextColor={colors.muted}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {/* Action Buttons */}
                <View className="gap-3">
                  <Pressable
                    onPress={handleCreate}
                    className="bg-primary px-6 py-4 rounded-full"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    disabled={createProject.isLoading}
                  >
                    <Text className="text-background font-semibold text-center text-base">
                      {createProject.isLoading ? "Creating..." : "Create Project"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="bg-surface px-6 py-4 rounded-full border border-border"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <Text className="text-foreground font-semibold text-center">Cancel</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Edit Modal */}
        <Modal
          visible={showEditModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowEditModal(false)}
        >
          <View className="flex-1 bg-black/50 items-center justify-end">
            <View className="bg-background rounded-t-3xl p-6 w-full max-h-[90%]">
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text className="text-2xl font-bold text-foreground mb-4">
                  Edit Project
                </Text>

                {/* Project Name */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Project Name
                  </Text>
                  <TextInput
                    className="bg-surface rounded-xl p-4 text-foreground border border-border"
                    placeholder="e.g., Tree of Life Program"
                    placeholderTextColor={colors.muted}
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                {/* Project Code */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Project Code
                  </Text>
                  <TextInput
                    className="bg-surface rounded-xl p-4 text-foreground border border-border"
                    placeholder="e.g., TOL-2026"
                    placeholderTextColor={colors.muted}
                    value={code}
                    onChangeText={setCode}
                    autoCapitalize="characters"
                  />
                </View>

                {/* Total Budget */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Total Budget (£)
                  </Text>
                  <TextInput
                    className="bg-surface rounded-xl p-4 text-foreground border border-border"
                    placeholder="0.00"
                    placeholderTextColor={colors.muted}
                    value={totalBudget}
                    onChangeText={setTotalBudget}
                    keyboardType="decimal-pad"
                  />
                </View>

                {/* Status Selection */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">Status</Text>
                  <View className="flex-row gap-2">
                    {statusOptions.map((option) => (
                      <Pressable
                        key={option.value}
                        onPress={() => setStatus(option.value as any)}
                        className={`flex-1 px-4 py-3 rounded-xl ${
                          status === option.value
                            ? "border-2"
                            : "bg-surface border border-border"
                        }`}
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.7 : 1,
                          borderColor: status === option.value ? option.color : undefined,
                          backgroundColor: status === option.value ? option.color + "20" : undefined,
                        })}
                      >
                        <Text
                          className={`text-sm font-semibold text-center ${
                            status === option.value ? "" : "text-foreground"
                          }`}
                          style={{
                            color: status === option.value ? option.color : undefined,
                          }}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Description */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Description
                  </Text>
                  <TextInput
                    className="bg-surface rounded-xl p-4 text-foreground border border-border"
                    placeholder="Brief description of the project..."
                    placeholderTextColor={colors.muted}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {/* Action Buttons */}
                <View className="gap-3">
                  <Pressable
                    onPress={handleEdit}
                    className="bg-primary px-6 py-4 rounded-full"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    disabled={updateProject.isLoading}
                  >
                    <Text className="text-background font-semibold text-center text-base">
                      {updateProject.isLoading ? "Updating..." : "Update Project"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setShowEditModal(false);
                      setSelectedProject(null);
                      resetForm();
                    }}
                    className="bg-surface px-6 py-4 rounded-full border border-border"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <Text className="text-foreground font-semibold text-center">Cancel</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Quick Budget Edit Modal */}
        <Modal
          visible={showQuickBudgetEdit}
          animationType="slide"
          transparent
          onRequestClose={() => {
            setShowQuickBudgetEdit(false);
            setSelectedProject(null);
            setQuickBudgetAmount("");
          }}
        >
          <View className="flex-1 justify-end bg-black/50">
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
              <ScrollView 
                className="bg-background rounded-t-3xl"
                contentContainerStyle={{ padding: 24 }}
                keyboardShouldPersistTaps="handled"
              >
              <Text className="text-2xl font-bold text-foreground mb-2">
                Edit Budget
              </Text>
              {selectedProject && (
                <Text className="text-base text-muted mb-4">
                  {selectedProject.name} ({selectedProject.code})
                </Text>
              )}

              {/* Current Budget Display */}
              <View className="bg-surface rounded-xl p-4 mb-4 border border-border">
                <Text className="text-sm text-muted mb-1">Current Budget</Text>
                <Text className="text-2xl font-bold text-foreground">
                  £{selectedProject ? parseFloat(selectedProject.totalBudget).toLocaleString() : "0"}
                </Text>
              </View>

              {/* New Budget Input */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  New Budget Amount (£) *
                </Text>
                <TextInput
                  className="bg-surface rounded-xl p-4 text-foreground border border-border text-lg"
                  placeholder="0.00"
                  placeholderTextColor={colors.muted}
                  value={quickBudgetAmount}
                  onChangeText={setQuickBudgetAmount}
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </View>

              {/* Action Buttons */}
              <View className="gap-3">
                <Pressable
                  onPress={handleQuickBudgetUpdate}
                  className="bg-primary px-6 py-4 rounded-full"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  disabled={updateProject.isLoading}
                >
                  <Text className="text-background font-semibold text-center text-base">
                    {updateProject.isLoading ? "Updating..." : "Update Budget"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowQuickBudgetEdit(false);
                    setSelectedProject(null);
                    setQuickBudgetAmount("");
                  }}
                  className="bg-surface px-6 py-4 rounded-full border border-border"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text className="text-foreground font-semibold text-center">Cancel</Text>
                </Pressable>
              </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </ScrollView>
    </ScreenContainer>
  );
}
