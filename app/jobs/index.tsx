import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Share, Platform } from "react-native";
import { ScreenWithBackButton } from "@/components/screen-with-back-button";
import { useAuth } from "@/hooks/use-auth";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export default function JobsScreen() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const colors = useColors();
  const { data: jobs, isLoading } = trpc.jobs.getActiveJobs.useQuery();
  const { data: userData } = trpc.adminUsers.getAllUsers.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Check if current user can post jobs
  const currentUser = userData?.find((u: any) => u.id === user?.id);
  const canPostJobs = user?.role === "admin" || user?.role === "super_admin" || currentUser?.canPostJobs;

  const isExpiringSoon = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    const daysUntilExpiry = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const isExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() < Date.now();
  };

  const formatDeadline = (expiresAt: Date | null) => {
    if (!expiresAt) return null;
    const date = new Date(expiresAt);
    const daysUntil = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return "Expired";
    if (daysUntil === 0) return "Expires today";
    if (daysUntil === 1) return "Expires tomorrow";
    if (daysUntil <= 7) return `${daysUntil} days left`;
    
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleShareJob = async (job: any) => {
    try {
      const deepLink = `changein://jobs/${job.id}`;
      const message = `🔔 Job Opportunity: ${job.title}\n\n${job.description?.substring(0, 100)}...\n\n📍 ${job.location || 'Location not specified'}\n💼 ${job.jobType || 'Type not specified'}${job.salary ? `\n💰 ${job.salary}` : ''}${job.expiresAt ? `\n⏰ Deadline: ${formatDeadline(job.expiresAt)}` : ''}\n\nOpen in app: ${deepLink}`;
      
      await Share.share({
        message,
        title: `Job: ${job.title}`,
      });
    } catch (error) {
      console.error('Error sharing job:', error);
    }
  };

  if (authLoading || isLoading) {
    return (
      <ScreenWithBackButton className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenWithBackButton>
    );
  }

  return (
    <ScreenWithBackButton>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Back Button */}
          
          
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">Job Opportunities</Text>
              <Text className="text-base text-muted mt-1">
                {jobs?.length || 0} positions available
              </Text>
            </View>
            {canPostJobs && (
              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="bg-surface w-12 h-12 rounded-full items-center justify-center active:opacity-80 border border-border"
                  onPress={() => router.push("/jobs/analytics" as any)}
                >
                  <Ionicons name="stats-chart" size={20} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-primary w-12 h-12 rounded-full items-center justify-center active:opacity-80"
                  onPress={() => router.push("/admin/post-job" as any)}
                >
                  <Text className="text-background text-2xl font-bold">+</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Job Listings */}
          {jobs && jobs.length > 0 ? (
            <View className="gap-3">
              {jobs.map((job) => (
                <View key={job.id} className="bg-surface rounded-2xl border border-border overflow-hidden">
                  {/* Deadline Banner */}
                  {job.expiresAt && (
                    <View
                      className={`px-4 py-2 ${
                        isExpired(job.expiresAt)
                          ? "bg-error/20"
                          : isExpiringSoon(job.expiresAt)
                          ? "bg-warning/20"
                          : "bg-primary/10"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          isExpired(job.expiresAt)
                            ? "text-error"
                            : isExpiringSoon(job.expiresAt)
                            ? "text-warning"
                            : "text-primary"
                        }`}
                      >
                        ⏰ {formatDeadline(job.expiresAt)}
                      </Text>
                    </View>
                  )}
                  
                  <TouchableOpacity
                    className="p-4 active:opacity-70"
                    onPress={() => router.push(`/jobs/${job.id}` as any)}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-foreground">{job.title}</Text>
                        {job.company && (
                          <Text className="text-sm text-muted mt-1">{job.company}</Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => handleShareJob(job)}
                        className="ml-2 p-2 active:opacity-60"
                      >
                        <Ionicons name="share-outline" size={20} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                    
                    <View className="flex-row gap-2 mt-3">
                      {job.location && (
                        <View className="bg-primary/10 px-3 py-1 rounded-full">
                          <Text className="text-primary text-xs font-medium">📍 {job.location}</Text>
                        </View>
                      )}
                      {job.jobType && (
                        <View className="bg-success/10 px-3 py-1 rounded-full">
                          <Text className="text-success text-xs font-medium">{job.jobType}</Text>
                        </View>
                      )}
                    </View>
                    
                    {job.salary && (
                      <Text className="text-sm text-muted mt-2">💰 {job.salary}</Text>
                    )}
                    
                    <View className="flex-row gap-4 mt-3">
                      <Text className="text-xs text-muted leading-relaxed">👁 {job.viewCount || 0} views</Text>
                      <Text className="text-xs text-muted leading-relaxed">🖱 {job.clickCount || 0} clicks</Text>
                      <Text className="text-xs text-muted leading-relaxed">
                        📝 {job.applicationCount || 0} applications
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View className="bg-surface rounded-2xl p-6 border border-border items-center">
              <Text className="text-base text-muted text-center leading-relaxed">
                No job opportunities available at the moment
              </Text>
              {canPostJobs && (
                <TouchableOpacity
                  className="bg-primary px-6 py-3 rounded-full mt-4 active:opacity-80"
                  onPress={() => router.push("/admin/post-job" as any)}
                >
                  <Text className="text-background font-semibold">Post a Job</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenWithBackButton>
  );
}
