import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SESSION_TOKEN_KEY } from "@/constants/oauth";

export default function ManualLoginScreen() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!token.trim()) {
      Alert.alert("Error", "Please paste your session token");
      return;
    }

    setLoading(true);
    try {
      // Store the session token
      await AsyncStorage.setItem(SESSION_TOKEN_KEY, token.trim());
      
      Alert.alert("Success", "Logged in successfully!", [
        {
          text: "OK",
          onPress: () => {
            // Navigate to home and reload
            router.replace("/(tabs)");
          },
        },
      ]);
    } catch (error) {
      console.error("Manual login error:", error);
      Alert.alert("Error", "Failed to save session token. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenContainer className="p-6">
      <View className="flex-1 justify-center gap-4">
        <View className="gap-2">
          <Text className="text-2xl font-bold text-foreground text-center leading-tight">
            Manual Login
          </Text>
          <Text className="text-base text-muted text-center leading-relaxed">
            Paste your session token from the OAuth response
          </Text>
        </View>

        <View className="gap-4">
          <View className="gap-2">
            <Text className="text-sm font-medium text-foreground">Session Token</Text>
            <TextInput
              className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder="Paste token here (starts with 'eyJ...')"
              placeholderTextColor="#9BA1A6"
              value={token}
              onChangeText={setToken}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            className="bg-primary px-6 py-4 rounded-full active:opacity-80"
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-background font-semibold text-lg text-center">
                Login
              </Text>
            )}
          </TouchableOpacity>

          
        </View>

        <View className="bg-surface border border-border rounded-lg p-4 gap-2">
          <Text className="text-sm font-semibold text-foreground">How to get your token:</Text>
          <Text className="text-sm text-muted leading-relaxed">
            1. Click "Sign In with OAuth"{"\n"}
            2. Complete Google/Microsoft/Apple login{"\n"}
            3. You'll see a JSON response with "app_session_id"{"\n"}
            4. Copy the long token value (starts with "eyJ"){"\n"}
            5. Come back here and paste it above
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}
