import { Text, View, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { SmoothScrollView } from "@/components/smooth-scroll-view";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { RefreshControl } from "@/components/refresh-control";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { useState } from "react";

export default function TasksScreen() {
  const { user, isAuthenticated, loading } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: tasks, isLoading: loadingTasks, refetch, error: tasksError } = (trpc.tasks as any).getTasks.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );
  
  const { data: stats, refetch: refetchStats, error: statsError } = (trpc.tasks as any).getTaskStats.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetch(), refetchStats()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="p-4 justify-center">
        <View className="items-center gap-4">
          <Text className="text-2xl font-bold text-foreground text-center leading-tight">
            Sign in to view tasks
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-error';
      case 'medium':
        return 'text-warning';
      case 'low':
        return 'text-success';
      default:
        return 'text-muted';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success';
      case 'in_progress':
        return 'bg-primary';
      case 'pending':
        return 'bg-warning';
      case 'cancelled':
        return 'bg-error';
      default:
        return 'bg-muted';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  return (
    <ScreenContainer>
      <SmoothScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
          />
        }
      >
        <View className="p-6 gap-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-foreground">Tasks</Text>
              <Text className="text-base text-muted mt-1">Manage your tasks</Text>
            </View>
            <TouchableOpacity 
              className="bg-primary w-12 h-12 rounded-full items-center justify-center active:opacity-80"
              onPress={() => router.push("/create-task" as any)}
            >
              <Text className="text-background text-2xl font-bold">+</Text>
            </TouchableOpacity>
          </View>

          {/* Task Statistics */}
          <View className="flex-row gap-3">
            <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-2xl font-bold text-warning">
                {stats?.pending || 0}
              </Text>
              <Text className="text-sm text-muted mt-1">Pending</Text>
            </View>
            <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-2xl font-bold text-primary">
                {stats?.inProgress || 0}
              </Text>
              <Text className="text-sm text-muted mt-1">In Progress</Text>
            </View>
            <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-2xl font-bold text-success">
                {stats?.completed || 0}
              </Text>
              <Text className="text-sm text-muted mt-1">Completed</Text>
            </View>
          </View>

          {/* Task List */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">All Tasks</Text>
            
            {tasksError ? (
              <ErrorState
                icon="exclamationmark.circle"
                title="Failed to load tasks"
                description="An error occurred while loading your tasks. Please try again."
                retryLabel="Retry"
                onRetry={() => refetch()}
              />
            ) : loadingTasks ? (
              <View className="bg-surface rounded-2xl p-6 border border-border items-center">
                <ActivityIndicator size="small" />
              </View>
            ) : !tasks || tasks.length === 0 ? (
              <EmptyState
                icon="checkmark.circle"
                title="No tasks yet"
                description="Create your first task to get started"
                actionLabel="Create Task"
                onAction={() => router.push("/create-task" as any)}
              />
            ) : (
              <View className="gap-3">
                {tasks.map((task: any) => (
                  <TouchableOpacity
                    key={task.id}
                    className="bg-surface rounded-2xl p-4 border border-border active:opacity-80"
                    onPress={() => {
                      // TODO: Navigate to task detail screen
                      console.log('Task clicked:', task.id);
                    }}
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground mb-1">
                          {task.title}
                        </Text>
                        {task.description && (
                          <Text className="text-sm text-muted leading-relaxed" numberOfLines={2}>
                            {task.description}
                          </Text>
                        )}
                      </View>
                      <View className={`px-3 py-1 rounded-full ${getStatusColor(task.status)} ml-2`}>
                        <Text className="text-xs font-semibold text-background">
                          {getStatusLabel(task.status)}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="flex-row items-center gap-4 mt-2">
                      <View className="flex-row items-center gap-1">
                        <Text className="text-xs text-muted leading-relaxed">Priority:</Text>
                        <Text className={`text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </Text>
                      </View>
                      
                      {task.dueDate && (
                        <View className="flex-row items-center gap-1">
                          <Text className="text-xs text-muted leading-relaxed">Due:</Text>
                          <Text className="text-xs font-semibold text-foreground">
                            {new Date(task.dueDate).toLocaleDateString()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
      </SmoothScrollView>
    </ScreenContainer>
  );
}
