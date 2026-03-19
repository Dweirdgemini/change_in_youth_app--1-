import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SmoothScrollView } from "@/components/smooth-scroll-view";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { getRoleLabel, getRoleColor } from "@/lib/role-formatter";
import { OrganizationSwitcher } from "@/components/organization-switcher";
import { FeatureCard } from "@/components/feature-card";
import { DeleteAccountModal } from "@/components/delete-account-modal";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useState } from "react";
import { setItem } from '@/lib/storage';

export default function MoreScreen() {
  const { user, isAuthenticated, loading, logout } = useAuth();
  const isSuperAdmin = user?.role === "super_admin";
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1 justify-between">
          {/* Back Button */}
          

          {/* Sign In Prompt */}
          <View className="flex-1 items-center justify-center gap-4">
            <Text className="text-2xl font-bold text-foreground text-center leading-tight">
              Sign in to access more features
            </Text>
            <TouchableOpacity
              className="bg-primary px-6 py-4 rounded-full mt-4 active:opacity-80"
              onPress={() => router.push("/" as any)}
            >
              <Text className="text-background font-semibold text-lg">Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Spacer */}
          <View />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <SmoothScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-4 gap-3">
          <View>
            <Text className="text-2xl font-bold text-foreground">More</Text>
            <Text className="text-base text-muted mt-1">Additional features & settings</Text>
          </View>

          <View className="bg-surface rounded-2xl p-4 border border-border items-center gap-2">
            <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
              <Text className="text-xl font-bold text-primary">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </Text>
            </View>
            <Text className="text-base font-semibold text-foreground">{user?.name || "User"}</Text>
            <Text className="text-sm text-muted leading-relaxed">{user?.email || "No email"}</Text>
            <View className={`${getRoleColor(user?.role)} px-4 py-2 rounded-full mt-2`}>
              <Text className="font-medium text-sm">
                {getRoleLabel(user?.role)}
              </Text>
            </View>
          </View>

          {/* Organization Switcher for Super Admins */}
          {isSuperAdmin && (
            <View className="gap-2">
              <Text className="text-base font-semibold text-foreground">Organization</Text>
              <OrganizationSwitcher />
            </View>
          )}

          <View className="bg-surface rounded-2xl p-6 border border-border items-center gap-2">
            {/* Quick Admin Mode Toggle */}
            {__DEV__ && (
              <TouchableOpacity
                className="bg-warning px-6 py-3 rounded-full mt-4 active:opacity-80"
                onPress={async () => {
                try {
                  // Use platform-safe storage
                  await setItem("test_role", "admin");
                  
                  Alert.alert(
                    "Admin Mode Activated",
                    "The page will reload and you'll have admin access.",
                    [
                      {
                        text: "OK",
                        onPress: () => {
                          if (typeof window !== 'undefined') {
                            window.location.reload();
                          }
                        }
                      }
                    ]
                  );
                } catch (error) {
                  Alert.alert("Error", "Failed to activate admin mode");
                }
              }}
            >
                <Text className="text-background font-semibold text-sm">🔑 Enable Admin Mode</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Core Features Section */}
          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground">Core Features</Text>
            <View className="gap-2">
              <FeatureCard
                icon="briefcase.fill"
                label="Job Opportunities"
                description="Browse and apply for jobs"
                onPress={() => router.push("/jobs" as any)}
              />
              <FeatureCard
                icon="calendar"
                label="Calendar & Availability"
                description="Manage your schedule"
                onPress={() => router.push("/calendar" as any)}
              />
              <FeatureCard
                icon="bubble.left.fill"
                label="Team Chat"
                description="Communicate with team"
                onPress={() => router.push("/team-chat" as any)}
              />
              <FeatureCard
                icon="message.fill"
                label="Project Chats"
                description="Team messaging & media sharing"
                onPress={() => router.push("/project-chats" as any)}
              />
              <FeatureCard
                icon="person.2.fill"
                label="Meeting Requests"
                description="Schedule meetings"
                onPress={() => router.push("/meeting-requests" as any)}
              />
              <FeatureCard
                icon="chart.bar.fill"
                label="My Performance Metrics"
                description="View your performance scores & rankings"
                onPress={() => router.push("/(tabs)/more/performance-metrics" as any)}
                variant="primary"
              />
            </View>
          </View>

          {/* Admin & Finance Features */}
          {(user?.role === "admin" || user?.role === "finance") && (
            <View className="gap-2">
              <Text className="text-base font-semibold text-foreground">Team Management</Text>
              <View className="gap-2">
                <FeatureCard
                  icon="person.3.fill"
                  label="Team Management"
                  description="Manage team members"
                  onPress={() => router.push("/admin/user-management" as any)}
                />
                <FeatureCard
                  icon="chart.line.uptrend.xyaxis"
                  label="Ranking History"
                  description="Track ranking changes"
                  onPress={() => router.push("/admin/rank-history" as any)}
                />
                <FeatureCard
                  icon="trophy.fill"
                  label="Performance Leaderboard"
                  description="View team performance rankings"
                  onPress={() => router.push("/(tabs)/more/performance-leaderboard" as any)}
                  variant="primary"
                />
              </View>
            </View>
          )}

          {/* Documents & Compliance */}
          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground">Documents & Compliance</Text>
            <View className="gap-2">
              <FeatureCard
                icon="doc.fill"
                label="Documents & Compliance"
                description="View compliance docs"
                onPress={() => router.push("/documents" as any)}
              />
              <FeatureCard
                icon="doc.text.fill"
                label="Parental Consent Forms"
                description="Fill out consent forms for our programmes"
                onPress={() => router.push("/consent-forms-list" as any)}
                variant="primary"
              />
              {(user?.role === "admin" || user?.role === "super_admin") && (
                <FeatureCard
                  icon="doc.badge.gearshape.fill"
                  label="Consent Forms"
                  description="View & manage digital consent submissions"
                  onPress={() => router.push("/admin/consent-forms" as any)}
                />
              )}
              <FeatureCard
                icon="list.clipboard.fill"
                label="Surveys & Feedback"
                description="Complete surveys"
                onPress={() => router.push("/surveys" as any)}
              />
            </View>
          </View>

          {/* Financial Features */}
          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground">Financial</Text>
            <View className="gap-2">
              <FeatureCard
                icon="banknote.fill"
                label="My Earnings"
                description="View lifetime earnings & payment history"
                onPress={() => router.push("/my-earnings" as any)}
                variant="success"
              />
              <FeatureCard
                icon="doc.richtext.fill"
                label="Submit Invoice"
                description="Create new invoice for sessions"
                onPress={() => router.push("/my-invoice" as any)}
              />
              {(user?.role === "admin" || user?.role === "finance") && (
                <FeatureCard
                  icon="checkmark.circle.fill"
                  label="Invoice Approvals"
                  description="Review & approve pending invoices"
                  onPress={() => router.push("/finance-approvals" as any)}
                  variant="success"
                />
              )}
              {(user?.role === "admin" || user?.role === "finance") && (
                <FeatureCard
                  icon="chart.pie.fill"
                  label="Invoice Analytics"
                  description="Financial insights & trends"
                  onPress={() => router.push("/invoice-analytics" as any)}
                />
              )}
            </View>
          </View>

          {/* Learning & Development */}
          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground">Learning & Development</Text>
            <View className="gap-2">
              <FeatureCard
                icon="book.fill"
                label="Training & Resources"
                description="Access training materials"
                onPress={() => router.push("/training" as any)}
              />
              <FeatureCard
                icon="pencil.and.list.clipboard"
                label="Evaluation Forms"
                description="Complete session evaluations"
                onPress={() => router.push("/evaluation-forms" as any)}
              />
            </View>
          </View>

          {/* Admin Only Features */}
          {(user?.role === "admin" || user?.role === "super_admin") && (
            <View className="gap-2">
              <Text className="text-base font-semibold text-foreground">Administration</Text>
              <View className="gap-2">
                {user?.role === "super_admin" && (
                  <>
                    <FeatureCard
                      icon="gear.circle.fill"
                      label="Super Admin Dashboard"
                      description="Manage all organizations on the platform"
                      onPress={() => router.push("/(tabs)/more/super-admin-dashboard" as any)}
                      variant="error"
                    />
                    <FeatureCard
                      icon="lock.circle.fill"
                      label="Permission Management"
                      description="Manage user roles & project access"
                      onPress={() => router.push("/permission-management" as any)}
                      variant="warning"
                    />
                  </>
                )}
                <FeatureCard
                  icon="briefcase.circle.fill"
                  label="Post Job Opportunity"
                  description="Create & publish new job listings"
                  onPress={() => router.push("/admin/post-job" as any)}
                  variant="success"
                />
                <FeatureCard
                  icon="iphone.circle.fill"
                  label="Social Media Manager"
                  description="Review & approve content submissions"
                  onPress={() => router.push("/social-media/manager" as any)}
                  variant="primary"
                />
                <FeatureCard
                  icon="chart.bar.xaxis"
                  label="Social Media Leaderboard"
                  description="View quality & reach rankings with monthly bonuses"
                  onPress={() => router.push("/social-media/leaderboard" as any)}
                />
                <FeatureCard
                  icon="bell.circle.fill"
                  label="Session Requests"
                  description="Review pending session requests"
                  onPress={() => router.push("/session-requests" as any)}
                />
                <FeatureCard
                  icon="calendar.circle.fill"
                  label="Team Availability"
                  description="View all facilitators' schedules & acceptance status"
                  onPress={() => router.push("/admin/team-availability" as any)}
                />
                <FeatureCard
                  icon="list.bullet.clipboard.fill"
                  label="Project Management"
                  description="Create & edit projects"
                  onPress={() => router.push("/admin/project-management" as any)}
                />
                <FeatureCard
                  icon="dollarsign.circle.fill"
                  label="Budget Management"
                  description="Create & manage budget lines"
                  onPress={() => router.push("/admin/budget-management" as any)}
                  variant="warning"
                />
                <FeatureCard
                  icon="megaphone.fill"
                  label="Announcements"
                  description="Post platform updates and news"
                  onPress={() => router.push("/announcements" as any)}
                />
                {user?.role === "admin" && (
                  <FeatureCard
                    icon="arrow.down.doc.fill"
                    label="Import Historical Data"
                    description="Backdate invoices & migrate old records"
                    onPress={() => router.push("/admin/import-historical-data" as any)}
                    variant="success"
                  />
                )}
              </View>
            </View>
          )}

          {/* Help & Resources */}
          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground">Help & Resources</Text>
            <View className="gap-2">
              <FeatureCard
                icon="book.circle.fill"
                label="Role Permissions Guide"
                description="Learn what each role can do"
                onPress={() => router.push("/(tabs)/more/role-permissions-guide" as any)}
                variant="primary"
              />
            </View>
          </View>

          {/* Settings */}
          <View className="gap-2">
            <Text className="text-base font-semibold text-foreground">Settings</Text>
            <View className="gap-2">
              <FeatureCard
                icon="bell.fill"
                label="Notifications"
                description="Manage notification preferences"
                onPress={() => {}}
              />
              <FeatureCard
                icon="person.fill"
                label="Profile Settings"
                description="Edit your profile information"
                onPress={() => router.push("/profile-settings" as any)}
              />
            </View>
          </View>

          {/* Developer Tools */}
          {__DEV__ && (
            <View className="gap-2">
              <Text className="text-base font-semibold text-foreground">Developer Tools</Text>
              <View className="gap-2">
                <FeatureCard
                  icon="arrow.left.arrow.right.circle.fill"
                  label="Role Switcher"
                  description="Test different user roles"
                  onPress={() => router.push("/dev/role-switcher" as any)}
                  variant="primary"
                />
                {user?.role === "admin" && (
                  <FeatureCard
                    icon="leaf.arrow.triangle.circlepath"
                    label="Populate Database"
                    description="Add sample data for testing"
                    onPress={() => router.push("/seed-database" as any)}
                    variant="warning"
                  />
                )}
              </View>
            </View>
          )}

          {/* Account Deletion */}
          <TouchableOpacity
            className="bg-error/10 border border-error/30 rounded-2xl p-4 active:opacity-80 mt-4"
            onPress={() => setDeleteModalVisible(true)}
          >
            <Text className="text-error font-semibold text-base text-center">Delete Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-error rounded-2xl p-4 active:opacity-80 mt-2"
            onPress={logout}
          >
            <Text className="text-background font-semibold text-base text-center">Sign Out</Text>
          </TouchableOpacity>

          <DeleteAccountModal
            visible={deleteModalVisible}
            onClose={() => setDeleteModalVisible(false)}
            onSuccess={() => {
              setDeleteModalVisible(false);
              logout();
            }}
          />
        </View>
      </SmoothScrollView>
    </ScreenContainer>
    );
  }
