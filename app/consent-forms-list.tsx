import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ScreenWithBackButton } from "@/components/screen-with-back-button";
import { SmoothScrollView } from "@/components/smooth-scroll-view";
import { useColors } from "@/hooks/use-colors";
import { useAuthContext } from "@/contexts/auth-context";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

/**
 * Parental Consent Forms List Screen
 * 
 * Shows all available consent forms for the user's projects
 * Users can fill out consent forms for their programmes
 */
export default function ConsentFormsListScreen() {
  const colors = useColors();
  const { user, isAuthenticated, loading: authLoading } = useAuthContext();
  
  const { data: projects, isLoading: projectsLoading } = (trpc.finance as any).getProjects.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (authLoading || projectsLoading) {
    return (
      <ScreenWithBackButton className="items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenWithBackButton>
    );
  }

  if (!isAuthenticated) {
    return (
      <ScreenWithBackButton className="p-4 justify-center">
        <View className="items-center gap-4">
          <Text className="text-2xl font-bold text-foreground text-center leading-tight">
            Sign in to access consent forms
          </Text>
          <TouchableOpacity
            className="bg-primary px-6 py-4 rounded-full mt-4 active:opacity-80"
            onPress={() => router.push("/login" as any)}
          >
            <Text className="text-background font-semibold text-lg">Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScreenWithBackButton>
    );
  }

  const handleOpenForm = (projectId: number) => {
    router.push(`/consent/${projectId}` as any);
  };

  return (
    <ScreenWithBackButton>
      <SmoothScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Header */}
          <View>
            <Text className="text-2xl font-bold text-foreground">Parental Consent Forms</Text>
            <Text className="text-base text-muted mt-1">
              Fill out consent forms for our programmes
            </Text>
          </View>

          {/* Info Card */}
          <View className="bg-primary/10 rounded-2xl p-4 border border-primary/30">
            <View className="flex-row gap-3">
              <Ionicons name="information-circle" size={24} color={colors.primary} />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-foreground">
                  Why we need consent
                </Text>
                <Text className="text-xs text-muted leading-relaxed mt-1">
                  We require parental/guardian consent to ensure the safety and wellbeing of all participants in our programmes.
                </Text>
              </View>
            </View>
          </View>

          {/* Forms List */}
          {projects && projects.length > 0 ? (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Available Forms</Text>
              {projects.map((project: any) => (
                <TouchableOpacity
                  key={project.id}
                  className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
                  onPress={() => handleOpenForm(project.id)}
                >
                  <View className="flex-row items-start justify-between gap-3">
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold text-base">
                        {project.name}
                      </Text>
                      {project.description && (
                        <Text className="text-xs text-muted leading-relaxed mt-1">
                          {project.description}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.muted} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="items-center gap-4 py-12">
              <Ionicons name="document-outline" size={64} color={colors.muted} />
              <Text className="text-lg font-semibold text-foreground text-center">
                No Forms Available
              </Text>
              <Text className="text-sm text-muted text-center">
                There are currently no consent forms available for you.
              </Text>
            </View>
          )}

          {/* Help Section */}
          <View className="bg-surface rounded-2xl p-4 border border-border gap-3">
            <Text className="text-base font-semibold text-foreground">Need Help?</Text>
            <Text className="text-sm text-muted leading-relaxed">
              If you have questions about the consent forms or need assistance, please contact your programme coordinator.
            </Text>
          </View>
        </View>
      </SmoothScrollView>
    </ScreenWithBackButton>
  );
}
