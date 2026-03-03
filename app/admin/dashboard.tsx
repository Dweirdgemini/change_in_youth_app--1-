import { View, Text, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";

export default function DashboardScreen() {
  const colors = useColors();
  const { data: stats } = trpc.participantJourney.getStats.useQuery();
  const { data: projects } = (trpc.projectAssignments as any).getAllProjectsWithUsers.useQuery();
  const { data: reports } = trpc.funderReports.getAllReports.useQuery();

  const screenWidth = Dimensions.get("window").width;
  const cardWidth = (screenWidth - 48) / 2; // 2 cards per row with padding

  // Calculate metrics
  const totalProjects = projects?.length || 0;
  const activeProjects = projects?.filter((p) => p.status === "active").length || 0;
  const totalTeamMembers = projects?.reduce((sum, p) => sum + (p.assignedUsers?.length || 0), 0) || 0;
  const totalReports = reports?.length || 0;
  const totalParticipants = stats?.uniqueParticipants || 0;
  const totalInteractions = stats?.totalInteractions || 0;

  const StatCard = ({ title, value, subtitle, color, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        width: cardWidth,
        backgroundColor: colors.surface,
        borderColor: colors.border,
      }}
      className="rounded-2xl p-4 border"
    >
      <View style={{ backgroundColor: color }} className="w-10 h-10 rounded-full items-center justify-center mb-3">
        <Text className="text-white text-xl font-bold">{value.toString().charAt(0)}</Text>
      </View>
      <Text className="text-2xl font-bold text-foreground mb-1">{value}</Text>
      <Text className="text-sm font-medium text-foreground">{title}</Text>
      {subtitle && (
        <Text className="text-xs text-muted leading-relaxed mt-1">{subtitle}</Text>
      )}
    </TouchableOpacity>
  );

  const InteractionTypeCard = ({ type, count, color }: any) => (
    <View
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      className="rounded-xl p-3 border flex-row items-center justify-between"
    >
      <View className="flex-row items-center gap-3">
        <View style={{ backgroundColor: color }} className="w-8 h-8 rounded-full" />
        <Text className="text-sm font-medium text-foreground capitalize">
          {type.replace(/_/g, " ")}
        </Text>
      </View>
      <Text className="text-lg font-bold text-foreground">{count}</Text>
    </View>
  );

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {/* Header */}
          <View>
            <Text className="text-2xl font-bold text-foreground">Dashboard</Text>
            <Text className="text-sm text-muted mt-1">
              Real-time overview of your organization
            </Text>
          </View>

          {/* Key Metrics Grid */}
          <View>
            <Text className="text-lg font-bold text-foreground mb-3">Key Metrics</Text>
            <View className="flex-row flex-wrap gap-3">
              <StatCard
                title="Active Projects"
                value={activeProjects}
                subtitle={`${totalProjects} total`}
                color="#3B82F6"
                onPress={() => router.push("/admin/project-assignments" as any)}
              />
              <StatCard
                title="Team Members"
                value={totalTeamMembers}
                subtitle="Across all projects"
                color="#10B981"
                onPress={() => router.push("/admin/project-assignments" as any)}
              />
              <StatCard
                title="Participants"
                value={totalParticipants}
                subtitle="Unique individuals"
                color="#F59E0B"
                onPress={() => router.push("/admin/participant-journey" as any)}
              />
              <StatCard
                title="Interactions"
                value={totalInteractions}
                subtitle="Total touchpoints"
                color="#8B5CF6"
                onPress={() => router.push("/admin/participant-journey" as any)}
              />
              <StatCard
                title="Reports Generated"
                value={totalReports}
                subtitle="For funders"
                color="#EF4444"
                onPress={() => router.push("/admin/reports" as any)}
              />
              <StatCard
                title="Avg Engagement"
                value={totalParticipants > 0 ? Math.round(totalInteractions / totalParticipants) : 0}
                subtitle="Interactions per person"
                color="#06B6D4"
              />
            </View>
          </View>

          {/* Projects Overview */}
          <View>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-foreground">Projects</Text>
              <TouchableOpacity onPress={() => router.push("/admin/project-assignments" as any)}>
                <Text className="text-primary font-medium">View All →</Text>
              </TouchableOpacity>
            </View>

            {projects && projects.length > 0 ? (
              <View className="gap-3">
                {projects.slice(0, 5).map((project) => (
                  <View
                    key={project.id}
                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                    className="rounded-xl p-4 border"
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">
                          {project.name}
                        </Text>
                        <Text className="text-sm text-muted mt-1">
                          {project.assignedUsers?.length || 0} team members
                        </Text>
                      </View>
                      <View
                        style={{
                          backgroundColor: project.status === "active" ? "#10B981" : "#6B7280",
                        }}
                        className="px-3 py-1 rounded-full"
                      >
                        <Text className="text-white text-xs font-medium capitalize">
                          {project.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={{ backgroundColor: colors.surface }} className="rounded-xl p-6 items-center">
                <Text className="text-muted text-center">No projects yet</Text>
              </View>
            )}
          </View>

          {/* Interaction Breakdown */}
          {stats && stats.byType && Object.keys(stats.byType).length > 0 && (
            <View>
              <Text className="text-lg font-bold text-foreground mb-3">
                Interaction Breakdown
              </Text>
              <View className="gap-2">
                {Object.entries(stats.byType).map(([type, count], index) => {
                  const colors_list = [
                    "#3B82F6",
                    "#10B981",
                    "#F59E0B",
                    "#8B5CF6",
                    "#EF4444",
                    "#06B6D4",
                    "#EC4899",
                    "#14B8A6",
                  ];
                  return (
                    <InteractionTypeCard
                      key={type}
                      type={type}
                      count={count}
                      color={colors_list[index % colors_list.length]}
                    />
                  );
                })}
              </View>
            </View>
          )}

          {/* Quick Actions */}
          <View>
            <Text className="text-lg font-bold text-foreground mb-3">Quick Actions</Text>
            <View className="gap-3">
              <TouchableOpacity
                onPress={() => router.push("/admin/reports" as any)}
                style={{ backgroundColor: colors.primary }}
                className="py-4 rounded-xl items-center"
              >
                <Text className="text-white font-semibold">Generate Funder Report</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/admin/participant-journey" as any)}
                style={{ backgroundColor: colors.success }}
                className="py-4 rounded-xl items-center"
              >
                <Text className="text-white font-semibold">Log Participant Interaction</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push("/admin/project-assignments" as any)}
                style={{ backgroundColor: colors.warning }}
                className="py-4 rounded-xl items-center"
              >
                <Text className="text-white font-semibold">Assign Team to Project</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
