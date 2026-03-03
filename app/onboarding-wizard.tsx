import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";

export default function OnboardingWizardScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0a7ea4");

  const { data: onboardingStatus, isLoading } = trpc.onboarding.getOnboardingStatus.useQuery();
  const updateStepMutation = trpc.onboarding.updateOnboardingStep.useMutation();
  const completeOnboardingMutation = trpc.onboarding.completeOnboarding.useMutation({
    onSuccess: () => {
      router.replace("/(tabs)");
    },
  });
  const updateProfileMutation = trpc.onboarding.updateOrganizationProfile.useMutation();

  useEffect(() => {
    if (onboardingStatus?.onboardingCompleted) {
      router.replace("/(tabs)");
    } else if (onboardingStatus?.currentStep) {
      setCurrentStep(onboardingStatus.currentStep);
    }
  }, [onboardingStatus]);

  const handleNext = async () => {
    if (currentStep < 4) {
      const nextStep = currentStep + 1;
      await updateStepMutation.mutateAsync({ step: nextStep });
      setCurrentStep(nextStep);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleComplete = async () => {
    await completeOnboardingMutation.mutateAsync();
  };

  const handleSaveBranding = async () => {
    await updateProfileMutation.mutateAsync({
      logoUrl: logoUrl || undefined,
      primaryColor,
    });
    handleNext();
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#0a7ea4" />
      </ScreenContainer>
    );
  }

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-6">
        {/* Progress Bar */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm font-medium text-muted">
              Step {currentStep} of {totalSteps}
            </Text>
            <Text className="text-sm font-medium text-muted">{Math.round(progress)}%</Text>
          </View>
          <View className="h-2 bg-surface rounded-full overflow-hidden">
            <View
              className="h-full bg-primary rounded-full"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>

        {/* Step 1: Welcome */}
        {currentStep === 1 && (
          <View>
            <Text className="text-2xl font-bold text-foreground mb-4">
              Welcome to {onboardingStatus?.organizationName}! 🎉
            </Text>
            <Text className="text-base text-muted mb-4 leading-relaxed">
              Let's get your organization set up in just a few steps. This will only take a couple of minutes.
            </Text>

            <View className="bg-blue-50 rounded-2xl p-6 mb-4 border border-blue-200">
              <Text className="text-lg font-semibold text-blue-900 mb-3">
                What You'll Set Up:
              </Text>
              <Text className="text-sm text-blue-800 mb-2">✓ Organization branding</Text>
              <Text className="text-sm text-blue-800 mb-2">✓ Add team members</Text>
              <Text className="text-sm text-blue-800 mb-2">✓ Create your first project</Text>
              <Text className="text-sm text-blue-800">✓ Quick feature tour</Text>
            </View>

            <View className="bg-green-50 rounded-2xl p-6 mb-4 border border-green-200">
              <Text className="text-lg font-semibold text-green-900 mb-2">
                🎁 Your Trial Details
              </Text>
              <Text className="text-sm text-green-800 mb-1">
                <Text className="font-semibold">Plan:</Text> {onboardingStatus?.subscriptionTier}
              </Text>
              <Text className="text-sm text-green-800 mb-1">
                <Text className="font-semibold">Status:</Text> {onboardingStatus?.subscriptionStatus}
              </Text>
              <Text className="text-sm text-green-800">
                <Text className="font-semibold">Max Users:</Text> {onboardingStatus?.maxUsers}
              </Text>
            </View>

            <TouchableOpacity
              className="bg-primary rounded-full p-4 items-center"
              onPress={handleNext}
            >
              <Text className="text-white font-semibold text-base">Get Started →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Branding */}
        {currentStep === 2 && (
          <View>
            <Text className="text-2xl font-bold text-foreground mb-4">
              Customize Your Brand
            </Text>
            <Text className="text-base text-muted mb-4 leading-relaxed">
              Add your logo and choose your brand color to personalize the platform.
            </Text>

            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">
                Logo URL (Optional)
              </Text>
              <TextInput
                className="bg-surface border border-border rounded-xl p-4 text-foreground mb-1"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChangeText={setLogoUrl}
                autoCapitalize="none"
              />
              <Text className="text-xs text-muted leading-relaxed">
                Upload your logo to a hosting service and paste the URL here
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">
                Primary Brand Color
              </Text>
              <View className="flex-row items-center gap-3">
                <TextInput
                  className="flex-1 bg-surface border border-border rounded-xl p-4 text-foreground"
                  placeholder="#0a7ea4"
                  value={primaryColor}
                  onChangeText={setPrimaryColor}
                  autoCapitalize="none"
                />
                <View
                  className="w-16 h-16 rounded-xl border-2 border-border"
                  style={{ backgroundColor: primaryColor }}
                />
              </View>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-surface border border-border rounded-full p-4 items-center"
                onPress={handleSkip}
              >
                <Text className="text-foreground font-semibold text-base">Skip for Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-primary rounded-full p-4 items-center"
                onPress={handleSaveBranding}
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white font-semibold text-base">Save & Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 3: Add Team Members */}
        {currentStep === 3 && (
          <View>
            <Text className="text-2xl font-bold text-foreground mb-4">
              Invite Your Team
            </Text>
            <Text className="text-base text-muted mb-4 leading-relaxed">
              Add team members to collaborate on projects and sessions. You can always add more later.
            </Text>

            <View className="bg-yellow-50 rounded-2xl p-6 mb-4 border border-yellow-200">
              <Text className="text-base font-semibold text-yellow-900 mb-2">
                💡 Quick Tip
              </Text>
              <Text className="text-sm text-yellow-800">
                You can invite team members from the More tab → Team Management after completing onboarding.
              </Text>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-surface border border-border rounded-full p-4 items-center"
                onPress={handleSkip}
              >
                <Text className="text-foreground font-semibold text-base">Skip for Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-primary rounded-full p-4 items-center"
                onPress={() => {
                  handleNext();
                  // In a real implementation, navigate to team management
                }}
              >
                <Text className="text-white font-semibold text-base">Add Team Members</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 4: Feature Tour */}
        {currentStep === 4 && (
          <View>
            <Text className="text-2xl font-bold text-foreground mb-4">
              You're All Set! 🚀
            </Text>
            <Text className="text-base text-muted mb-4 leading-relaxed">
              Your organization is ready to go. Here's what you can do next:
            </Text>

            <View className="mb-4">
              <View className="bg-surface rounded-2xl p-5 mb-3 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-2">
                  📊 Manage Budgets & Projects
                </Text>
                <Text className="text-sm text-muted leading-relaxed">
                  Create projects, set budgets, and track spending in real-time.
                </Text>
              </View>

              <View className="bg-surface rounded-2xl p-5 mb-3 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-2">
                  📅 Schedule Sessions
                </Text>
                <Text className="text-sm text-muted leading-relaxed">
                  Plan workshops, assign facilitators, and manage attendance.
                </Text>
              </View>

              <View className="bg-surface rounded-2xl p-5 mb-3 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-2">
                  📝 Digital Consent Forms
                </Text>
                <Text className="text-sm text-muted leading-relaxed">
                  Collect and manage participant consent with QR codes.
                </Text>
              </View>

              <View className="bg-surface rounded-2xl p-5 mb-3 border border-border">
                <Text className="text-lg font-semibold text-foreground mb-2">
                  👥 Track Team Performance
                </Text>
                <Text className="text-sm text-muted leading-relaxed">
                  Monitor facilitator rankings and feedback scores.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              className="bg-primary rounded-full p-4 items-center mb-4"
              onPress={handleComplete}
              disabled={completeOnboardingMutation.isPending}
            >
              {completeOnboardingMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Complete Setup & Start Using Platform
                </Text>
              )}
            </TouchableOpacity>

            <Text className="text-center text-sm text-muted">
              Need help? Contact support@changeinyouth.app
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
