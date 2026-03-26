import { useState } from "react";
import { ScrollView, Text, View, TouchableOpacity, TextInput, ActivityIndicator, Alert, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuthContext } from "@/contexts/auth-context";
import { useColors } from "@/hooks/use-colors";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";

export default function CreateTaskScreen() {
  const { user, isAuthenticated } = useAuthContext();
  const colors = useColors();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<number | null>(null);

  const { data: projects, isLoading: loadingProjects } = (trpc.finance as any).getProjects.useQuery();
  const { data: users, isLoading: loadingUsers } = (trpc.finance as any).getAllUsers.useQuery();
  
  const createTask = (trpc as any).tasks?.createTask?.useMutation();

  const handleCreateTask = async () => {
    if (!title.trim()) {
      if (Platform.OS === 'web') {
        alert('Please enter a task title');
      } else {
        Alert.alert('Error', 'Please enter a task title');
      }
      return;
    }

    try {
      await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        projectId: selectedProject,
        assignedTo: selectedAssignee || user?.id,
        status: "pending",
      });

      if (Platform.OS === 'web') {
        alert('Task created successfully!');
      } else {
        Alert.alert('Success', 'Task created successfully!');
      }
      
      router.back();
    } catch (error) {
      console.error('Create task error:', error);
      if (Platform.OS === 'web') {
        alert('Failed to create task. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to create task. Please try again.');
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="p-4 justify-center">
        <View className="items-center gap-4">
          <Text className="text-2xl font-bold text-foreground text-center leading-tight">
            Sign in to create tasks
          </Text>
          <TouchableOpacity
            className="bg-primary px-6 py-4 rounded-full mt-4 active:opacity-80"
            onPress={() => router.push("/login" as any)}
          >
            <Text className="text-background font-semibold text-lg">Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-foreground">Create Task</Text>
              <Text className="text-base text-muted mt-1">Add a new task</Text>
            </View>
            
          </View>

          {/* Task Title */}
          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground">Task Title *</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="Enter task title"
              placeholderTextColor={colors.muted}
              value={title}
              onChangeText={setTitle}
              style={{ color: colors.foreground }}
            />
          </View>

          {/* Task Description */}
          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground">Description</Text>
            <TextInput
              className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
              placeholder="Enter task description"
              placeholderTextColor={colors.muted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{ color: colors.foreground, minHeight: 100 }}
            />
          </View>

          {/* Priority */}
          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground">Priority</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl border ${priority === 'low' ? 'bg-success border-success' : 'bg-surface border-border'} active:opacity-80`}
                onPress={() => setPriority('low')}
              >
                <Text className={`text-center font-semibold ${priority === 'low' ? 'text-background' : 'text-foreground'}`}>
                  Low
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl border ${priority === 'medium' ? 'bg-warning border-warning' : 'bg-surface border-border'} active:opacity-80`}
                onPress={() => setPriority('medium')}
              >
                <Text className={`text-center font-semibold ${priority === 'medium' ? 'text-background' : 'text-foreground'}`}>
                  Medium
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-xl border ${priority === 'high' ? 'bg-error border-error' : 'bg-surface border-border'} active:opacity-80`}
                onPress={() => setPriority('high')}
              >
                <Text className={`text-center font-semibold ${priority === 'high' ? 'text-background' : 'text-foreground'}`}>
                  High
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Project Selection */}
          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground">Project (Optional)</Text>
            {loadingProjects ? (
              <ActivityIndicator size="small" />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
                <TouchableOpacity
                  className={`px-4 py-3 rounded-xl border ${!selectedProject ? 'bg-primary border-primary' : 'bg-surface border-border'} active:opacity-80 mr-2`}
                  onPress={() => setSelectedProject(null)}
                >
                  <Text className={`font-semibold ${!selectedProject ? 'text-background' : 'text-foreground'}`}>
                    No Project
                  </Text>
                </TouchableOpacity>
                {projects?.map((project: any) => (
                  <TouchableOpacity
                    key={project.id}
                    className={`px-4 py-3 rounded-xl border ${selectedProject === project.id ? 'bg-primary border-primary' : 'bg-surface border-border'} active:opacity-80 mr-2`}
                    onPress={() => setSelectedProject(project.id)}
                  >
                    <Text className={`font-semibold ${selectedProject === project.id ? 'text-background' : 'text-foreground'}`}>
                      {project.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Assignee Selection */}
          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground">Assign To</Text>
            {loadingUsers ? (
              <ActivityIndicator size="small" />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
                <TouchableOpacity
                  className={`px-4 py-3 rounded-xl border ${selectedAssignee === user?.id ? 'bg-primary border-primary' : 'bg-surface border-border'} active:opacity-80 mr-2`}
                  onPress={() => setSelectedAssignee(user?.id || null)}
                >
                  <Text className={`font-semibold ${selectedAssignee === user?.id ? 'text-background' : 'text-foreground'}`}>
                    Me
                  </Text>
                </TouchableOpacity>
                {users?.filter((u: any) => u.id !== user?.id).map((assignee: any) => (
                  <TouchableOpacity
                    key={assignee.id}
                    className={`px-4 py-3 rounded-xl border ${selectedAssignee === assignee.id ? 'bg-primary border-primary' : 'bg-surface border-border'} active:opacity-80 mr-2`}
                    onPress={() => setSelectedAssignee(assignee.id)}
                  >
                    <Text className={`font-semibold ${selectedAssignee === assignee.id ? 'text-background' : 'text-foreground'}`}>
                      {assignee.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Create Button */}
          <TouchableOpacity
            className="bg-primary py-4 rounded-full mt-4 active:opacity-80"
            onPress={handleCreateTask}
            disabled={createTask.isPending}
          >
            {createTask.isPending ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text className="text-background font-semibold text-lg text-center">Create Task</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
