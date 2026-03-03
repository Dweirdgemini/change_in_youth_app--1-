import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export default function JobAnalyticsScreen() {
  const { user, loading: authLoading } = useAuth();
  const colors = useColors();
  const { data: allJobs, isLoading: jobsLoading } = trpc.jobs.getAllJobs.useQuery();
  const { data: metrics, isLoading: metricsLoading } = trpc.jobs.getJobMetrics.useQuery();

  if (authLoading || jobsLoading || metricsLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  if (user?.role !== "admin" && user?.role !== "finance") {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text className="text-lg text-muted text-center">
          Only admins can view job analytics
        </Text>
      </ScreenContainer>
    );
  }

  const activeJobs = allJobs?.filter((j) => j.status === "active") || [];
  const closedJobs = allJobs?.filter((j) => j.status === "closed") || [];
  const draftJobs = allJobs?.filter((j) => j.status === "draft") || [];

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Back Button */}
          

          {/* Header */}
          <View>
            <Text className="text-2xl font-bold text-foreground">Job Analytics</Text>
            <Text className="text-base text-muted mt-1">
              Track engagement and performance
            </Text>
          </View>

          {/* Summary Cards */}
          <View className="flex-row flex-wrap gap-3">
            <View className="flex-1 min-w-[45%] bg-primary/10 rounded-2xl p-4 border border-primary/20">
              <Text className="text-2xl font-bold text-primary">{metrics?.totalJobs || 0}</Text>
              <Text className="text-sm text-foreground mt-1">Total Jobs Posted</Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-success/10 rounded-2xl p-4 border border-success/20">
              <Text className="text-2xl font-bold text-success">{activeJobs.length}</Text>
              <Text className="text-sm text-foreground mt-1">Active Jobs</Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-warning/10 rounded-2xl p-4 border border-warning/20">
              <Text className="text-2xl font-bold text-warning">{metrics?.totalViews || 0}</Text>
              <Text className="text-sm text-foreground mt-1">Total Views</Text>
            </View>
            <View className="flex-1 min-w-[45%] bg-error/10 rounded-2xl p-4 border border-error/20">
              <Text className="text-2xl font-bold text-error">{metrics?.totalApplications || 0}</Text>
              <Text className="text-sm text-foreground mt-1">Total Applications</Text>
            </View>
          </View>

          {/* QR Code Scan Metrics */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <View className="flex-row items-center gap-2 mb-3">
              <Ionicons name="qr-code" size={24} color={colors.primary} />
              <Text className="text-lg font-bold text-foreground">QR Code Engagement</Text>
            </View>
            <View className="flex-row flex-wrap gap-3">
              <View className="flex-1 min-w-[45%] bg-primary/5 rounded-xl p-3">
                <Text className="text-xl font-bold text-primary">{metrics?.qrScans || 0}</Text>
                <Text className="text-xs text-muted leading-relaxed mt-1">Total QR Scans</Text>
              </View>
              <View className="flex-1 min-w-[45%] bg-primary/5 rounded-xl p-3">
                <Text className="text-xl font-bold text-primary">{metrics?.qrClicks || 0}</Text>
                <Text className="text-xs text-muted leading-relaxed mt-1">Jobs Clicked via QR</Text>
              </View>
            </View>
            <Text className="text-xs text-muted leading-relaxed mt-3">
              💡 QR code is available in Evaluation Forms for all team members to share
            </Text>
          </View>

          {/* Top Performing Jobs */}
          {metrics?.topJobs && metrics.topJobs.length > 0 && (
            <View className="gap-3">
              <Text className="text-xl font-bold text-foreground">Top Performing Jobs</Text>
              {metrics.topJobs.map((job, index) => (
                <View
                  key={job.id}
                  className="bg-surface rounded-2xl p-4 border border-border"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-full bg-primary items-center justify-center">
                      <Text className="text-background font-bold">{index + 1}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">{job.title}</Text>
                      <View className="flex-row gap-4 mt-1">
                        <Text className="text-xs text-muted leading-relaxed">👁 {job.views} views</Text>
                        <Text className="text-xs text-muted leading-relaxed">📝 {job.applications} applications</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* All Jobs Breakdown */}
          <View className="gap-3">
            <Text className="text-xl font-bold text-foreground">All Posted Jobs</Text>
            
            {/* Active Jobs */}
            {activeJobs.length > 0 && (
              <View className="gap-2">
                <Text className="text-sm font-semibold text-success">Active ({activeJobs.length})</Text>
                {activeJobs.map((job) => (
                  <TouchableOpacity
                    key={job.id}
                    className="bg-surface rounded-xl p-3 border border-border active:opacity-70"
                    onPress={() => router.push(`/jobs/${job.id}` as any)}
                  >
                    <Text className="text-sm font-semibold text-foreground">{job.title}</Text>
                    <View className="flex-row gap-3 mt-1">
                      <Text className="text-xs text-muted leading-relaxed">👁 {job.viewCount || 0}</Text>
                      <Text className="text-xs text-muted leading-relaxed">🖱 {job.clickCount || 0}</Text>
                      <Text className="text-xs text-muted leading-relaxed">📝 {job.applicationCount || 0}</Text>
                    </View>
                    {job.expiresAt && (
                      <Text className="text-xs text-warning mt-1">
                        ⏰ Expires: {new Date(job.expiresAt).toLocaleDateString()}
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Closed Jobs */}
            {closedJobs.length > 0 && (
              <View className="gap-2 mt-3">
                <Text className="text-sm font-semibold text-muted">Closed ({closedJobs.length})</Text>
                {closedJobs.map((job) => (
                  <TouchableOpacity
                    key={job.id}
                    className="bg-surface rounded-xl p-3 border border-border active:opacity-70 opacity-60"
                    onPress={() => router.push(`/jobs/${job.id}` as any)}
                  >
                    <Text className="text-sm font-semibold text-foreground">{job.title}</Text>
                    <View className="flex-row gap-3 mt-1">
                      <Text className="text-xs text-muted leading-relaxed">👁 {job.viewCount || 0}</Text>
                      <Text className="text-xs text-muted leading-relaxed">🖱 {job.clickCount || 0}</Text>
                      <Text className="text-xs text-muted leading-relaxed">📝 {job.applicationCount || 0}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Draft Jobs */}
            {draftJobs.length > 0 && (
              <View className="gap-2 mt-3">
                <Text className="text-sm font-semibold text-warning">Drafts ({draftJobs.length})</Text>
                {draftJobs.map((job) => (
                  <TouchableOpacity
                    key={job.id}
                    className="bg-surface rounded-xl p-3 border border-warning/30 active:opacity-70"
                    onPress={() => router.push(`/jobs/${job.id}` as any)}
                  >
                    <Text className="text-sm font-semibold text-foreground">{job.title}</Text>
                    <Text className="text-xs text-warning mt-1">Not yet published</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Engagement Insights */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-lg font-bold text-foreground mb-3">Engagement Insights</Text>
            <View className="gap-2">
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted leading-relaxed">Avg. applications per job</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {metrics?.averageApplicationsPerJob?.toFixed(1) || 0}
                </Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-sm text-muted leading-relaxed">Conversion rate (views → apps)</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {metrics?.totalViews && metrics.totalViews > 0
                    ? ((metrics.totalApplications / metrics.totalViews) * 100).toFixed(1)
                    : 0}%
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
