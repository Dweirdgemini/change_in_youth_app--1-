import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert, Platform, ActivityIndicator, KeyboardAvoidingView, TextInput } from "react-native";
import { SmoothScrollView } from "@/components/smooth-scroll-view";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import * as WebBrowser from "expo-web-browser";
import { getRoleLabel, getRoleColor } from "@/lib/role-formatter";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useBranding } from "@/lib/branding-provider";
import { Image } from "expo-image";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { getItem, setItem, removeItem } from '@/lib/storage';

export default function HomeScreen() {
  const { user, isAuthenticated, loading } = useAuth();
  const { organizationName, logoUrl, primaryColor } = useBranding();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isQuickAdminLoading, setIsQuickAdminLoading] = useState(false);
  
  // Email/password form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  
  const { data: workshopCount, error: workshopError } = trpc.admin.getWorkshopCount.useQuery(
    undefined,
    { enabled: user?.role === "admin" || user?.role === "finance" }
  );

  // Email/password login mutation
  const loginMutation = trpc.auth.login.useMutation();
  const registerMutation = trpc.auth.register.useMutation();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setIsSigningIn(true);
    try {
      await loginMutation.mutateAsync({ email: email.trim(), password: password });
      // Login successful - useAuth hook will automatically update user state
    } catch (error) {
      console.error("[Login] Error:", error);
      Alert.alert("Login Error", "Invalid email or password. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsSigningIn(true);
    try {
      await registerMutation.mutateAsync({ 
        name: name.trim(),
        email: email.trim(), 
        password: password,
        role: "student" // Default role
      });
      // Registration successful
      Alert.alert("Success", "Account created successfully! You can now sign in.");
      setShowRegister(false);
      setName("");
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("[Register] Error:", error);
      Alert.alert("Registration Error", "Failed to create account. Please try again.");
    } finally {
      setIsSigningIn(false);
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
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <SmoothScrollView contentContainerStyle={{ paddingBottom: 24 }}>
            <View className="items-center gap-4">
              {logoUrl && (
                <Image
                  source={{ uri: logoUrl }}
                  style={{ width: 100, height: 100, borderRadius: 12 }}
                  contentFit="contain"
                />
              )}
              <Text className="text-2xl font-bold text-foreground text-center leading-tight">
                Welcome to {organizationName}
              </Text>
              <Text className="text-sm text-muted text-center leading-relaxed">
                Your complete team management and financial platform
              </Text>

              {!showRegister ? (
                // Login Form
                <View className="w-full gap-3">
                  <TextInput
                    className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-base w-full"
                    placeholder="Email address"
                    placeholderTextColor="#9BA1A6"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                  <TextInput
                    className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-base w-full"
                    placeholder="Password"
                    placeholderTextColor="#9BA1A6"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="password"
                  />
                  <TouchableOpacity
                    style={{ backgroundColor: primaryColor, opacity: isSigningIn || isQuickAdminLoading ? 0.6 : 1 }}
                    className="px-6 py-4 rounded-full active:opacity-80 flex-row items-center justify-center"
                    onPress={handleLogin}
                    disabled={isSigningIn || isQuickAdminLoading}
                  >
                    {isSigningIn ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-background font-semibold text-lg">Sign In</Text>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    className="border-2 border-primary px-6 py-4 rounded-full active:opacity-70"
                    onPress={() => setShowRegister(true)}
                  >
                    <Text className="text-primary font-semibold text-lg">Create Account</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Registration Form
                <View className="w-full gap-3">
                  <TextInput
                    className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-base w-full"
                    placeholder="Full name"
                    placeholderTextColor="#9BA1A6"
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                  <TextInput
                    className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-base w-full"
                    placeholder="Email address"
                    placeholderTextColor="#9BA1A6"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                  <TextInput
                    className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground text-base w-full"
                    placeholder="Password (min 8 characters)"
                    placeholderTextColor="#9BA1A6"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoComplete="password"
                  />
                  
                  <TouchableOpacity
                    style={{ backgroundColor: primaryColor, opacity: isSigningIn ? 0.6 : 1 }}
                    className="px-6 py-4 rounded-full active:opacity-80 flex-row items-center justify-center"
                    onPress={handleRegister}
                    disabled={isSigningIn}
                  >
                    {isSigningIn ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-background font-semibold text-lg">Create Account</Text>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    className="border-2 border-primary px-6 py-4 rounded-full active:opacity-70"
                    onPress={() => setShowRegister(false)}
                  >
                    <Text className="text-primary font-semibold text-lg">Back to Sign In</Text>
                  </TouchableOpacity>
                </View>
              )}

              {Platform.OS !== "web" && (
                <TouchableOpacity
                  className="border-2 border-primary px-6 py-4 rounded-full mt-2 active:opacity-70"
                  onPress={() => router.push("/scan-qr")}
                >
                  <Text className="text-primary font-semibold text-lg">Scan QR Code</Text>
                </TouchableOpacity>
              )}
              
              {/* Quick Admin Login for Testing */}
              {__DEV__ && (
                <TouchableOpacity
                  className="bg-warning px-6 py-4 rounded-full mt-2 active:opacity-80 flex-row items-center justify-center"
                  style={{ opacity: isQuickAdminLoading || isSigningIn ? 0.6 : 1 }}
                  disabled={isQuickAdminLoading || isSigningIn}
                  onPress={async () => {
                    if (isQuickAdminLoading || isSigningIn) return;
                    setIsQuickAdminLoading(true);
                  try {
                    const apiUrl = 'http://localhost:3000';
                    
                    if (Platform.OS === 'web') {
                      console.log('[Quick Login] Starting dev mode login...');
                      
                      // On web, call POST endpoint
                      const response = await fetch(`${apiUrl}/api/auth/test-login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role: 'admin' }),
                        credentials: 'include',
                      });
                      
                      if (!response.ok) {
                        throw new Error('Test login failed');
                      }
                      
                      const data = await response.json();
                      console.log('[Quick Login] Response data:', data);
                      
                      // Store session token
                      if (data.sessionToken) {
                        await setItem('session_token', data.sessionToken);
                        console.log('[Quick Login] Stored session token');
                      }
                      
                      // Store user info
                      await setItem('user', JSON.stringify(data.user));
                      
                      // Enable dev_mode in storage for all future requests
                      await setItem('dev_mode', 'true');
                      console.log('[Quick Login] Enabled dev_mode in storage');
                      
                      // Show success message and reload app
                      alert('Admin login successful! The app will reload.');
                      window.location.reload();
                    } else {
                      // On native, call POST endpoint
                      const response = await fetch(`${apiUrl}/api/auth/test-login`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ role: 'admin' }),
                      });
                      
                      if (!response.ok) {
                        throw new Error('Test login failed');
                      }
                      
                      const data = await response.json();
                      await AsyncStorage.setItem('user', JSON.stringify(data.user));
                      Alert.alert(
                        'Admin Login',
                        'You are now logged in as Admin. The app will reload.',
                        [
                          {
                            text: 'OK',
                            onPress: () => {
                              router.replace('/');
                            }
                          }
                        ]
                      );
                    }
                  } catch (error) {
                    console.error('Quick admin login error:', error);
                    if (Platform.OS === 'web') {
                      alert('Failed to log in as admin. Please try again.');
                    } else {
                      Alert.alert('Error', 'Failed to log in as admin. Please try again.');
                    }
                    setIsQuickAdminLoading(false);
                  }
                }}
                >
                  {isQuickAdminLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-background font-semibold text-lg">🔑 Quick Admin Login (Testing)</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
      </SmoothScrollView>
    </KeyboardAvoidingView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <SmoothScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Header */}
          <View>
            <Text className="text-2xl font-bold text-foreground">Dashboard</Text>
            <Text className="text-base text-muted mt-1">
              Welcome back, {user?.name || "Team Member"}
            </Text>
          </View>

          {/* Quick Stats */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Quick Stats</Text>
            
            <View className="flex-row gap-3">
              <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
                <Text className="text-2xl font-bold text-primary">0</Text>
                <Text className="text-sm text-muted mt-1">Upcoming Sessions</Text>
              </View>
              
              <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
                <Text className="text-2xl font-bold text-warning">0</Text>
                <Text className="text-sm text-muted mt-1">Pending Invoices</Text>
              </View>
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
                <Text className="text-2xl font-bold text-success">0</Text>
                <Text className="text-sm text-muted mt-1">Completed Tasks</Text>
              </View>
              
              {/* Budget only visible to admin and finance */}
              {(user?.role === "admin" || user?.role === "finance") && (
                <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
                  <Text className="text-2xl font-bold text-foreground">£0</Text>
                  <Text className="text-sm text-muted mt-1">Budget Remaining</Text>
                </View>
              )}
            </View>

            {/* Workshop count for admins */}
            {user?.role === "admin" && (
              <View className="flex-row gap-3">
                {workshopError ? (
                  <View className="flex-1 bg-error/10 rounded-2xl p-4 border border-error/20">
                    <Text className="text-sm text-error font-medium">Unable to load workshop count</Text>
                  </View>
                ) : (
                  <View className="flex-1 bg-surface rounded-2xl p-4 border border-border">
                    <Text className="text-2xl font-bold text-primary">
                      {workshopCount?.total || 0}
                    </Text>
                    <Text className="text-sm text-muted mt-1">Workshops Delivered</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Quick Actions */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Quick Actions</Text>
            
            <TouchableOpacity
              className="bg-primary rounded-2xl p-4 active:opacity-80"
              onPress={() => router.push("/schedule" as any)}
            >
              <Text className="text-background font-semibold text-base">View Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
              onPress={() => router.push("/tasks" as any)}
            >
              <Text className="text-foreground font-semibold text-base">My Tasks</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
              onPress={() => router.push("/finance" as any)}
            >
              <Text className="text-foreground font-semibold text-base">Submit Invoice</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Activity */}
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Recent Activity</Text>
            
            <EmptyState
              icon="clock.fill"
              title="No recent activity"
              description="Your activity will appear here"
            />
          </View>

          {/* Role Badge */}
          <View className="items-center mt-4">
            <View className={`${getRoleColor(user?.role)} px-4 py-2 rounded-full`}>
              <Text className="font-medium text-sm">
                {getRoleLabel(user?.role)}
              </Text>
            </View>
          </View>
        </View>
      </SmoothScrollView>
    </ScreenContainer>
  );
}
