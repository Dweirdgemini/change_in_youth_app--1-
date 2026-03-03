import { View, Text, ScrollView, Pressable, TextInput, Modal, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { router } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { BUDGET_CATEGORIES, getBudgetCategoryDisplayName, type BudgetCategory } from "@/lib/budget-categories";

export default function BudgetManagementScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBudgetLine, setSelectedBudgetLine] = useState<any>(null);
  const [budgetLineToDelete, setBudgetLineToDelete] = useState<any>(null);

  // Form state
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [category, setCategory] = useState<BudgetCategory | "">("")
  const [allocatedAmount, setAllocatedAmount] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: projects } = (trpc.finance as any).getProjects.useQuery();
  const { data: budgetLines, refetch } = (trpc.finance as any).getBudgetLines.useQuery();

  const createBudgetLine = (trpc.finance as any).createBudgetLine.useMutation();
  const updateBudgetLine = (trpc.finance as any).updateBudgetLine.useMutation();
  const deleteBudgetLine = (trpc.finance as any).deleteBudgetLine.useMutation();

  // Budget categories are now imported from lib/budget-categories.ts

  const resetForm = () => {
    setSelectedProjectId(null);
    setCategory("");
    setAllocatedAmount("");
    setDescription("");
    setStartDate("");
    setEndDate("");
  };

  const handleCreate = async () => {
    if (!selectedProjectId || !category || !allocatedAmount) {
      Alert.alert("Required Fields", "Please fill in project, category, and amount");
      return;
    }

    const amount = parseFloat(allocatedAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid positive amount");
      return;
    }

    try {
      await createBudgetLine.mutateAsync({
        projectId: selectedProjectId,
        category,
        allocatedAmount: amount,
        description: description.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      Alert.alert("Success", "Budget line created successfully");
      refetch();
      setShowCreateModal(false);
      resetForm();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create budget line");
      console.error(error);
    }
  };

  const handleEdit = async () => {
    if (!selectedBudgetLine) return;

    const amount = allocatedAmount ? parseFloat(allocatedAmount) : undefined;
    if (amount !== undefined && (isNaN(amount) || amount <= 0)) {
      Alert.alert("Invalid Amount", "Please enter a valid positive amount");
      return;
    }

    try {
      await updateBudgetLine.mutateAsync({
        budgetLineId: selectedBudgetLine.id,
        category: category || undefined,
        allocatedAmount: amount,
        description: description || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      Alert.alert("Success", "Budget line updated successfully");
      refetch();
      setShowEditModal(false);
      setSelectedBudgetLine(null);
      resetForm();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update budget line");
      console.error(error);
    }
  };

  const handleDelete = (budgetLine: any) => {
    console.log("Delete button clicked for budget line:", budgetLine);
    
    if (!budgetLine || !budgetLine.id) {
      alert("Invalid budget line");
      return;
    }
    
    setBudgetLineToDelete(budgetLine);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!budgetLineToDelete) return;
    
    console.log("Attempting to delete budget line ID:", budgetLineToDelete.id);
    try {
      const result = await deleteBudgetLine.mutateAsync({ budgetLineId: budgetLineToDelete.id });
      console.log("Delete result:", result);
      alert("Budget line deleted successfully");
      setShowDeleteModal(false);
      setBudgetLineToDelete(null);
      await refetch();
    } catch (error: any) {
      console.error("Delete error:", error);
      const errorMessage = error.message || error.toString() || "Failed to delete budget line";
      alert(errorMessage);
    }
  };

  const openEditModal = (budgetLine: any) => {
    setSelectedBudgetLine(budgetLine);
    setCategory(budgetLine.category);
    setAllocatedAmount(budgetLine.allocatedAmount);
    setDescription(budgetLine.description || "");
    setStartDate(budgetLine.startDate ? new Date(budgetLine.startDate).toISOString().split('T')[0] : "");
    setEndDate(budgetLine.endDate ? new Date(budgetLine.endDate).toISOString().split('T')[0] : "");
    setShowEditModal(true);
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
            <Text className="text-2xl font-bold text-foreground">Budget Management</Text>
          </View>
          <Text className="text-base text-muted">
            Create and manage budget lines for projects
          </Text>
        </View>

        {/* Create Button */}
        <Pressable
          onPress={() => setShowCreateModal(true)}
          className="bg-primary rounded-xl p-4 mb-4"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <Text className="text-background font-bold text-center text-base">
            + Create New Budget Line
          </Text>
        </Pressable>

        {/* Budget Lines List */}
        <View className="gap-3 mb-4">
          {budgetLines && budgetLines.length > 0 ? (
            budgetLines.map((line) => {
              const project = projects?.find((p) => p.id === line.projectId);
              const percentUsed = line.percentageUsed || 0;
              const statusColor =
                percentUsed >= 90 ? "#EF4444" : percentUsed >= 75 ? "#F59E0B" : "#22C55E";

              return (
                <View key={line.id} className="bg-surface rounded-xl p-4 border border-border">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1 mr-3">
                      <Text className="text-lg font-semibold text-foreground">
                        {getBudgetCategoryDisplayName(line.category as BudgetCategory)}
                      </Text>
                      <Text className="text-sm text-muted leading-relaxed">
                        {project?.name || `Project #${line.projectId}`}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xl font-bold text-foreground">
                        £{parseFloat(line.allocatedAmount).toFixed(2)}
                      </Text>
                      <Text className="text-xs text-muted leading-relaxed">Allocated</Text>
                    </View>
                  </View>

                  {line.description && (
                    <Text className="text-sm text-muted mb-3">{line.description}</Text>
                  )}

                  {/* Date Range */}
                  {(line.startDate || line.endDate) && (
                    <View className="flex-row items-center mb-3">
                      <Text className="text-xs text-muted leading-relaxed">
                        📅 {line.startDate ? new Date(line.startDate).toLocaleDateString() : 'No start'} - {line.endDate ? new Date(line.endDate).toLocaleDateString() : 'No end'}
                      </Text>
                    </View>
                  )}

                  {/* Spending Progress */}
                  <View className="mb-3">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="text-xs text-muted leading-relaxed">Spent: £{(parseFloat(line.spent || "0") || 0).toFixed(2)}</Text>
                      <Text className="text-xs font-semibold" style={{ color: statusColor }}>
                        {percentUsed.toFixed(0)}% used
                      </Text>
                    </View>
                    <View className="h-2 bg-background rounded-full overflow-hidden">
                      <View
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(percentUsed, 100)}%`,
                          backgroundColor: statusColor,
                        }}
                      />
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-2">
                    <Pressable
                      onPress={() => openEditModal(line)}
                      className="flex-1 bg-primary/10 rounded-lg p-3"
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      <Text className="text-primary font-semibold text-center text-sm">
                        Edit
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDelete(line)}
                      className="flex-1 bg-error/10 rounded-lg p-3"
                      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    >
                      <Text className="text-error font-semibold text-center text-sm">
                        Delete
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })
          ) : (
            <View className="bg-surface rounded-xl p-8 items-center border border-border">
              <Text className="text-lg font-semibold text-foreground mb-2 text-center">
                No Budget Lines Yet
              </Text>
              <Text className="text-sm text-muted text-center">
                Create your first budget line to start tracking project spending
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
          <View className="flex-1 bg-black/50 justify-end">
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
              className="w-full"
            >
              <View className="bg-background rounded-t-3xl w-full" style={{ height: '90%', overflow: 'visible' }}>
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ padding: 24 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                <Text className="text-2xl font-bold text-foreground mb-4">
                  Create Budget Line
                </Text>

              {/* Project Selection */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Project *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
                  <View className="flex-row gap-2 pr-12">
                    {projects?.map((project) => (
                      <Pressable
                        key={project.id}
                        onPress={() => setSelectedProjectId(project.id)}
                        className={`px-4 py-2 rounded-full ${
                          selectedProjectId === project.id
                            ? "bg-primary"
                            : "bg-surface border border-border"
                        }`}
                        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                      >
                        <Text
                          className={`text-sm font-semibold ${
                            selectedProjectId === project.id
                              ? "text-background"
                              : "text-foreground"
                          }`}
                        >
                          {project.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Category Selection */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
                  <View className="flex-row gap-2 pr-12">
                    {BUDGET_CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat.value}
                        onPress={() => setCategory(cat.value)}
                        className={`px-4 py-2 rounded-full ${
                          category === cat.value
                            ? "bg-primary"
                            : "bg-surface border border-border"
                        }`}
                        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                      >
                        <Text
                          className={`text-sm font-semibold ${
                            category === cat.value ? "text-background" : "text-foreground"
                          }`}
                        >
                          {cat.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Amount Input */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Allocated Amount (£) *
                </Text>
                <TextInput
                  className="bg-surface rounded-xl p-4 text-foreground border border-border"
                  placeholder="0.00"
                  placeholderTextColor={colors.muted}
                  value={allocatedAmount}
                  onChangeText={setAllocatedAmount}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Description Input */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Description (Optional)
                </Text>
                <TextInput
                  className="bg-surface rounded-xl p-4 text-foreground border border-border"
                  placeholder="Add notes about this budget line..."
                  placeholderTextColor={colors.muted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Start Date Input */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Start Date (Optional)
                </Text>
                <TextInput
                  className="bg-surface rounded-xl p-4 text-foreground border border-border"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.muted}
                  value={startDate}
                  onChangeText={setStartDate}
                />
              </View>

              {/* End Date Input */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  End Date (Optional)
                </Text>
                <TextInput
                  className="bg-surface rounded-xl p-4 text-foreground border border-border"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.muted}
                  value={endDate}
                  onChangeText={setEndDate}
                />
              </View>
                  </ScrollView>

                {/* Fixed Action Buttons */}
                <View className="p-6 bg-background border-t border-border" style={{ paddingBottom: insets.bottom + 16 }}>
                  <Pressable
                    onPress={handleCreate}
                    className="bg-primary px-6 py-4 rounded-full"
                    style={({ pressed }) => ({ 
                      opacity: pressed ? 0.7 : 1,
                      backgroundColor: colors.primary 
                    })}
                    disabled={createBudgetLine.isLoading}
                  >
                    <Text className="text-white font-semibold text-center text-base">
                      {createBudgetLine.isLoading ? "Creating..." : "Create Budget Line"}
                    </Text>
                  </Pressable>

                  <View style={{ height: 12 }} />

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
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* Edit Modal */}
        <Modal
          visible={showEditModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowEditModal(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
              className="w-full"
            >
              <View className="bg-background rounded-t-3xl w-full" style={{ height: '90%', overflow: 'visible' }}>
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ padding: 24 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                <Text className="text-2xl font-bold text-foreground mb-4">
                  Edit Budget Line
                </Text>

              {/* Category Selection */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
                  <View className="flex-row gap-2 pr-12">
                    {BUDGET_CATEGORIES.map((cat) => (
                      <Pressable
                        key={cat.value}
                        onPress={() => setCategory(cat.value)}
                        className={`px-4 py-2 rounded-full ${
                          category === cat.value
                            ? "bg-primary"
                            : "bg-surface border border-border"
                        }`}
                        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                      >
                        <Text
                          className={`text-sm font-semibold ${
                            category === cat.value ? "text-background" : "text-foreground"
                          }`}
                        >
                          {cat.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Amount Input */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Allocated Amount (£)
                </Text>
                <TextInput
                  className="bg-surface rounded-xl p-4 text-foreground border border-border"
                  placeholder="0.00"
                  placeholderTextColor={colors.muted}
                  value={allocatedAmount}
                  onChangeText={setAllocatedAmount}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Description Input */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Description
                </Text>
                <TextInput
                  className="bg-surface rounded-xl p-4 text-foreground border border-border"
                  placeholder="Add notes about this budget line..."
                  placeholderTextColor={colors.muted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Start Date Input */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Start Date (Optional)
                </Text>
                <TextInput
                  className="bg-surface rounded-xl p-4 text-foreground border border-border"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.muted}
                  value={startDate}
                  onChangeText={setStartDate}
                />
              </View>

              {/* End Date Input */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-foreground mb-2">
                  End Date (Optional)
                </Text>
                <TextInput
                  className="bg-surface rounded-xl p-4 text-foreground border border-border"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.muted}
                  value={endDate}
                  onChangeText={setEndDate}
                />
              </View>
                  </ScrollView>

                {/* Fixed Action Buttons */}
                <View className="p-6 bg-background border-t border-border" style={{ paddingBottom: insets.bottom + 16 }}>
                  <Pressable
                    onPress={handleEdit}
                    className="bg-primary px-6 py-4 rounded-full"
                    style={({ pressed }) => ({ 
                      opacity: pressed ? 0.7 : 1,
                      backgroundColor: colors.primary 
                    })}
                    disabled={updateBudgetLine.isLoading}
                  >
                    <Text className="text-white font-semibold text-center text-base">
                      {updateBudgetLine.isLoading ? "Updating..." : "Update Budget Line"}
                    </Text>
                  </Pressable>

                  <View style={{ height: 12 }} />

                  <Pressable
                    onPress={() => {
                      setShowEditModal(false);
                      setSelectedBudgetLine(null);
                      resetForm();
                    }}
                    className="bg-surface px-6 py-4 rounded-full border border-border"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <Text className="text-foreground font-semibold text-center">Cancel</Text>
                  </Pressable>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDeleteModal(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50 p-6">
            <View className="bg-surface rounded-2xl p-6 w-full max-w-md border border-border">
              <Text className="text-2xl font-bold text-foreground mb-4 text-center">
                Delete Budget Line?
              </Text>
              
              {budgetLineToDelete && (
                <View className="mb-4">
                  <Text className="text-base text-foreground mb-2">
                    Are you sure you want to delete:
                  </Text>
                  <View className="bg-background p-4 rounded-lg border border-border">
                    <Text className="text-lg font-semibold text-foreground mb-1">
                      {budgetLineToDelete.category}
                    </Text>
                    <Text className="text-sm text-muted leading-relaxed">
                      £{parseFloat(budgetLineToDelete.allocatedAmount || "0").toFixed(2)}
                    </Text>
                  </View>
                  <Text className="text-sm text-error mt-4">
                    ⚠️ This action cannot be undone.
                  </Text>
                </View>
              )}

              <View className="gap-3">
                <Pressable
                  onPress={confirmDelete}
                  className="px-6 py-4 rounded-xl"
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    backgroundColor: '#EF4444'
                  })}
                >
                  <Text style={{ color: '#FFFFFF' }} className="font-bold text-center text-lg">Delete Budget Line</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    setShowDeleteModal(false);
                    setBudgetLineToDelete(null);
                  }}
                  className="bg-background px-6 py-4 rounded-xl border-2 border-border"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text className="text-foreground font-semibold text-center text-base">Cancel</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </ScreenContainer>
  );
}
