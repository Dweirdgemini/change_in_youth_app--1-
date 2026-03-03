import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Share } from "react-native";
import { ScreenWithBackButton } from "@/components/screen-with-back-button";
import { useAuth } from "@/hooks/use-auth";
import { router, useLocalSearchParams } from "expo-router";
import { trpc } from "@/lib/trpc";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const colors = useColors();
  const { data: job, isLoading } = trpc.jobs.getJobById.useQuery(
    { jobId: Number(id) },
    { enabled: !!id }
  );

  const formatDeadline = (expiresAt: Date | string | null) => {
    if (!expiresAt) return null;
    const date = new Date(expiresAt);
    const daysUntil = Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return "Expired";
    if (daysUntil === 0) return "Expires today";
    if (daysUntil === 1) return "Expires tomorrow";
    if (daysUntil <= 7) return `${daysUntil} days left`;
    
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleShare = async () => {
    if (!job) return;
    
    try {
      const deepLink = `changein://jobs/${job.id}`;
      const message = `🔔 Job Opportunity: ${job.title}\n\n${job.description?.substring(0, 150)}...\n\n📍 ${job.location || 'Location not specified'}\n💼 ${job.jobType || 'Type not specified'}${job.salary ? `\n💰 ${job.salary}` : ''}${job.expiresAt ? `\n⏰ Deadline: ${formatDeadline(job.expiresAt)}` : ''}\n\nOpen in app: ${deepLink}`;
      
      await Share.share({
        message,
        title: `Job: ${job.title}`,
      });
    } catch (error) {
      console.error('Error sharing job:', error);
    }
  };

  const handleApply = () => {
    if (!isAuthenticated) {
      router.push("/");
      return;
    }
    router.push(`/jobs/apply/${id}` as any);
  };

  if (authLoading || isLoading) {
    return (
      <ScreenWithBackButton className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenWithBackButton>
    );
  }

  if (!job) {
    return (
      <ScreenWithBackButton className="items-center justify-center p-6">
        <Ionicons name="briefcase-outline" size={64} color={colors.muted} />
        <Text className="text-xl font-semibold text-foreground mt-4">Job Not Found</Text>
        <Text className="text-base text-muted text-center mt-2">
          This job posting may have been removed or expired.
        </Text>
        
      </ScreenWithBackButton>
    );
  }

  const deadline = formatDeadline(job.expiresAt);
  const isExpired = deadline === "Expired";

  return (
    <ScreenWithBackButton>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Back Button */}
          <View className="flex-row items-center justify-between">
            
            <TouchableOpacity
              onPress={handleShare}
              style={{ alignSelf: "flex-end" }}
            >
              <Ionicons name="share-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Job Header */}
          <View className="gap-3">
            <Text className="text-2xl font-bold text-foreground">{job.title}</Text>
            
            <View className="flex-row flex-wrap gap-2">
              {job.location && (
                <View className="flex-row items-center gap-1 bg-surface px-3 py-2 rounded-full">
                  <Ionicons name="location-outline" size={16} color={colors.primary} />
                  <Text className="text-sm text-foreground">{job.location}</Text>
                </View>
              )}
              {job.jobType && (
                <View className="flex-row items-center gap-1 bg-surface px-3 py-2 rounded-full">
                  <Ionicons name="briefcase-outline" size={16} color={colors.primary} />
                  <Text className="text-sm text-foreground">{job.jobType}</Text>
                </View>
              )}
              {job.salary && (
                <View className="flex-row items-center gap-1 bg-surface px-3 py-2 rounded-full">
                  <Ionicons name="cash-outline" size={16} color={colors.primary} />
                  <Text className="text-sm text-foreground">{job.salary}</Text>
                </View>
              )}
            </View>

            {deadline && (
              <View className={`px-4 py-2 rounded-lg ${isExpired ? 'bg-error/20' : 'bg-warning/20'}`}>
                <Text className={`text-sm font-semibold ${isExpired ? 'text-error' : 'text-warning'}`}>
                  {deadline}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          {job.description && (
            <View className="gap-2">
              <Text className="text-lg font-semibold text-foreground">About the Role</Text>
              <Text className="text-base text-foreground leading-relaxed">{job.description}</Text>
            </View>
          )}

          {/* Responsibilities */}
          {(job as any).responsibilities && (
            <View className="gap-2">
              <Text className="text-lg font-semibold text-foreground">Responsibilities</Text>
              <Text className="text-base text-foreground leading-relaxed">{(job as any).responsibilities}</Text>
            </View>
          )}

          {/* Requirements */}
          {(job as any).requirements && (
            <View className="gap-2">
              <Text className="text-lg font-semibold text-foreground">Requirements</Text>
              <Text className="text-base text-foreground leading-relaxed">{(job as any).requirements}</Text>
            </View>
          )}

          {/* Apply Button */}
          {!isExpired && (
            <TouchableOpacity
              className="bg-primary py-4 rounded-2xl items-center active:opacity-80"
              onPress={handleApply}
            >
              <Text className="text-background text-lg font-bold">Apply Now</Text>
            </TouchableOpacity>
          )}

          {/* Stats */}
          <View className="flex-row gap-4 pt-4 border-t border-border">
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-primary">{job.viewCount || 0}</Text>
              <Text className="text-sm text-muted leading-relaxed">Views</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-primary">{job.applicationCount || 0}</Text>
              <Text className="text-sm text-muted leading-relaxed">Applications</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenWithBackButton>
  );
}
