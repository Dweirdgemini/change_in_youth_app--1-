import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import { trpc } from "@/lib/trpc";

type Job = {
  id: number;
  title: string;
  description: string;
  location: string;
  employmentType: string;
  salary: string | null;
  requirements: string | null;
  responsibilities: string | null;
  applicationDeadline: string;
  status: string;
  postedAt: string;
};

export default function PublicJobsScreen() {
  const colors = useColors();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const { data: jobsData, isLoading } = trpc.publicJobs.getActiveJobs.useQuery();
  const trackPageView = trpc.publicJobs.trackPageView.useMutation();
  const trackJobClick = trpc.publicJobs.trackJobClick.useMutation();

  useEffect(() => {
    if (jobsData) {
      setJobs(jobsData as any);
    }
  }, [jobsData]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading]);

  // Track page view when component mounts
  useEffect(() => {
    trackPageView.mutate();
  }, []);

  const getDaysUntilDeadline = (deadline: string) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineBanner = (deadline: string) => {
    const daysLeft = getDaysUntilDeadline(deadline);
    
    if (daysLeft < 0) {
      return { text: "Application Closed", color: colors.error, bgColor: `${colors.error}20` };
    } else if (daysLeft === 0) {
      return { text: "Last Day to Apply!", color: colors.warning, bgColor: `${colors.warning}20` };
    } else if (daysLeft <= 3) {
      return { text: `${daysLeft} days left`, color: colors.warning, bgColor: `${colors.warning}20` };
    } else {
      return { text: `${daysLeft} days left`, color: colors.success, bgColor: `${colors.success}20` };
    }
  };

  const handleApply = (job: Job) => {
    // Open email client with pre-filled application email
    const subject = encodeURIComponent(`Application for ${job.title}`);
    const body = encodeURIComponent(
      `Dear Hiring Team,\n\nI am writing to express my interest in the ${job.title} position.\n\nBest regards`
    );
    Linking.openURL(`mailto:jobs@changeinyouth.org?subject=${subject}&body=${body}`);
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  if (selectedJob) {
    const deadline = getDeadlineBanner(selectedJob.applicationDeadline);
    const isExpired = getDaysUntilDeadline(selectedJob.applicationDeadline) < 0;

    // Track job click
    useEffect(() => {
      if (selectedJob) {
        trackJobClick.mutate({ jobId: selectedJob.id });
      }
    }, [selectedJob?.id]);

    return (
      <ScreenContainer>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="p-6 gap-4">
            {/* Back Button */}
            <TouchableOpacity
              onPress={() => setSelectedJob(null)}
              className="mb-2"
              style={{ alignSelf: "flex-start" }}
            >
              <Ionicons name="arrow-back" size={28} color={colors.foreground} />
            </TouchableOpacity>

            {/* Job Title */}
            <View>
              <Text className="text-2xl font-bold text-foreground">{selectedJob.title}</Text>
              <View className="flex-row items-center gap-2 mt-2">
                <Ionicons name="location" size={16} color={colors.muted} />
                <Text className="text-base text-muted">{selectedJob.location}</Text>
              </View>
            </View>

            {/* Deadline Banner */}
            <View
              className="rounded-2xl p-4 border"
              style={{
                backgroundColor: deadline.bgColor,
                borderColor: deadline.color,
              }}
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-sm font-semibold" style={{ color: deadline.color }}>
                    Application Deadline
                  </Text>
                  <Text className="text-base font-bold text-foreground mt-1">
                    {new Date(selectedJob.applicationDeadline).toLocaleDateString()}
                  </Text>
                </View>
                <View
                  className="px-3 py-2 rounded-full"
                  style={{ backgroundColor: deadline.color }}
                >
                  <Text className="text-white font-semibold text-sm">{deadline.text}</Text>
                </View>
              </View>
            </View>

            {/* Job Details */}
            <View className="bg-surface rounded-2xl p-4 border border-border gap-3">
              <View className="flex-row items-center gap-3">
                <Ionicons name="briefcase" size={20} color={colors.primary} />
                <Text className="text-base text-foreground">{selectedJob.employmentType}</Text>
              </View>
              {selectedJob.salary && (
                <View className="flex-row items-center gap-3">
                  <Ionicons name="cash" size={20} color={colors.primary} />
                  <Text className="text-base text-foreground">{selectedJob.salary}</Text>
                </View>
              )}
            </View>

            {/* Description */}
            <View>
              <Text className="text-lg font-semibold text-foreground mb-2">About the Role</Text>
              <Text className="text-base text-foreground leading-relaxed">
                {selectedJob.description}
              </Text>
            </View>

            {/* Responsibilities */}
            {selectedJob.responsibilities && (
              <View>
                <Text className="text-lg font-semibold text-foreground mb-2">
                  Responsibilities
                </Text>
                <Text className="text-base text-foreground leading-relaxed">
                  {selectedJob.responsibilities}
                </Text>
              </View>
            )}

            {/* Requirements */}
            {selectedJob.requirements && (
              <View>
                <Text className="text-lg font-semibold text-foreground mb-2">Requirements</Text>
                <Text className="text-base text-foreground leading-relaxed">
                  {selectedJob.requirements}
                </Text>
              </View>
            )}

            {/* Apply Button */}
            <TouchableOpacity
              onPress={() => handleApply(selectedJob)}
              disabled={isExpired}
              style={(({ pressed }) => ({
                transform: [{ scale: pressed ? 0.97 : 1 }] as any,
                opacity: isExpired ? 0.5 : 1,
              })) as any}
              className={`rounded-full py-4 ${
                isExpired ? "bg-border" : "bg-primary"
              }`}
            >
              <Text className="text-center text-white font-semibold text-base">
                {isExpired ? "Application Closed" : "Apply Now"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Header */}
          <View>
            <Text className="text-2xl font-bold text-foreground">Job Opportunities</Text>
            <Text className="text-base text-muted mt-1">
              Join our team at Change In Youth CIC
            </Text>
          </View>

          {/* Jobs List */}
          {jobs.length === 0 ? (
            <View className="bg-surface rounded-2xl p-8 border border-border items-center">
              <Ionicons name="briefcase-outline" size={48} color={colors.muted} />
              <Text className="text-lg font-semibold text-foreground mt-4">
                No Open Positions
              </Text>
              <Text className="text-sm text-muted mt-2 text-center">
                Check back later for new opportunities
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {jobs.map((job) => {
                const deadline = getDeadlineBanner(job.applicationDeadline);
                const isExpired = getDaysUntilDeadline(job.applicationDeadline) < 0;

                return (
                  <TouchableOpacity
                    key={job.id}
                    onPress={() => setSelectedJob(job)}
                    className={`bg-surface rounded-2xl p-4 border border-border active:opacity-70 ${
                      isExpired ? "opacity-60" : ""
                    }`}
                  >
                    <View className="flex-row items-start justify-between mb-2">
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-foreground">{job.title}</Text>
                        <View className="flex-row items-center gap-2 mt-1">
                          <Ionicons name="location" size={14} color={colors.muted} />
                          <Text className="text-sm text-muted leading-relaxed">{job.location}</Text>
                        </View>
                      </View>
                      <View
                        className="px-2 py-1 rounded-full"
                        style={{ backgroundColor: deadline.bgColor }}
                      >
                        <Text className="text-xs font-semibold" style={{ color: deadline.color }}>
                          {deadline.text}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-sm text-foreground mt-2" numberOfLines={2}>
                      {job.description}
                    </Text>

                    <View className="flex-row items-center gap-4 mt-3">
                      <View className="flex-row items-center gap-1">
                        <Ionicons name="briefcase" size={14} color={colors.muted} />
                        <Text className="text-xs text-muted leading-relaxed">{job.employmentType}</Text>
                      </View>
                      {job.salary && (
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="cash" size={14} color={colors.muted} />
                          <Text className="text-xs text-muted leading-relaxed">{job.salary}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
