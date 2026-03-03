import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import { JobQRCode } from "@/components/job-qr-code";

export default function JobQRCodeScreen() {
  const colors = useColors();
  
  // Generate the public jobs URL
  const publicJobsUrl = "https://app.changeinyouth.org/public/jobs";

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Back Button */}
          

          {/* Header */}
          <View>
            <Text className="text-2xl font-bold text-foreground">Job Opportunities QR Code</Text>
            <Text className="text-base text-muted mt-1">
              Share this QR code for public access to job listings
            </Text>
          </View>

          {/* Info Banner */}
          <View className="bg-primary/10 rounded-2xl p-4 border border-primary/20">
            <View className="flex-row items-start gap-3">
              <Ionicons name="information-circle" size={24} color={colors.primary} />
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground mb-1">
                  How to Use
                </Text>
                <Text className="text-sm text-muted leading-relaxed">
                  Print this QR code and display it in your office, community centers, or share it on social media. Members of the public can scan it to view all active job opportunities without needing to log in.
                </Text>
              </View>
            </View>
          </View>

          {/* QR Code */}
          <View className="bg-surface rounded-2xl p-6 border border-border items-center">
            <JobQRCode url={publicJobsUrl} size={250} />
          </View>

          {/* Usage Tips */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Usage Tips</Text>
            
            <View className="bg-surface rounded-xl p-4 border border-border">
              <View className="flex-row items-start gap-3">
                <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
                  <Text className="text-primary font-bold">1</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">Print & Display</Text>
                  <Text className="text-sm text-muted mt-1">
                    Download and print the QR code on posters, flyers, or business cards
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-surface rounded-xl p-4 border border-border">
              <View className="flex-row items-start gap-3">
                <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
                  <Text className="text-primary font-bold">2</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">Share Digitally</Text>
                  <Text className="text-sm text-muted mt-1">
                    Post the QR code image on social media, WhatsApp groups, or your website
                  </Text>
                </View>
              </View>
            </View>

            <View className="bg-surface rounded-xl p-4 border border-border">
              <View className="flex-row items-start gap-3">
                <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
                  <Text className="text-primary font-bold">3</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-foreground">Track Engagement</Text>
                  <Text className="text-sm text-muted mt-1">
                    View analytics in the Job Analytics dashboard to see how many people scanned the code
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            <TouchableOpacity
              onPress={() => router.push("/jobs/analytics" as any)}
              className="bg-primary rounded-full py-4 flex-row items-center justify-center gap-2 active:opacity-80"
            >
              <Ionicons name="analytics" size={20} color="#fff" />
              <Text className="text-white font-semibold text-base">View Analytics</Text>
            </TouchableOpacity>

            
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
