import { View, ActivityIndicator, Alert } from "react-native";
import { WebView } from "react-native-webview";
import { router, useLocalSearchParams } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SESSION_TOKEN_KEY } from "@/constants/oauth";
import { useState, useRef } from "react";

export default function OAuthWebViewScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const handleNavigationStateChange = async (navState: any) => {
    console.log("[OAuth WebView] Navigation:", navState.url);

    // Check if we've reached the mobile endpoint with JSON response
    if (navState.url && navState.url.includes("/api/oauth/mobile")) {
      console.log("[OAuth WebView] Detected mobile endpoint, will intercept response");
    }
  };

  const handleMessage = async (event: any) => {
    try {
      console.log("[OAuth WebView] Received message from JS");
      const data = JSON.parse(event.nativeEvent.data);
      console.log("[OAuth WebView] Parsed message:", { 
        hasToken: !!data.app_session_id, 
        hasUser: !!data.user,
        keys: Object.keys(data)
      });

      if (data.app_session_id) {
        console.log("[OAuth WebView] Session token found, storing...");
        // Store the session token
        await AsyncStorage.setItem(SESSION_TOKEN_KEY, data.app_session_id);

        // Store user info if available
        if (data.user) {
          console.log("[OAuth WebView] User data found, storing...");
          await AsyncStorage.setItem("manus-runtime-user-info", JSON.stringify(data.user));
        }

        console.log("[OAuth WebView] Token stored, navigating to callback");
        
        // Navigate to callback screen with session token
        router.replace("/oauth/callback?sessionToken=" + encodeURIComponent(data.app_session_id) as any);
      } else {
        console.error("[OAuth WebView] No app_session_id in message:", data);
      }
    } catch (error) {
      console.error("[OAuth WebView] Failed to process message:", error);
    }
  };

  const injectedJavaScript = `
    (function() {
      console.log('[OAuth WebView JS] Injected script running');
      
      // Function to try extracting and sending JSON
      function tryExtractAndSend() {
        const bodyText = (document.body.innerText || document.body.textContent || '').trim();
        console.log('[OAuth WebView JS] Body text length:', bodyText.length);
        
        if (bodyText.length === 0) {
          console.log('[OAuth WebView JS] Body is empty');
          return false;
        }
        
        try {
          // Try to parse as JSON
          const data = JSON.parse(bodyText);
          console.log('[OAuth WebView JS] Successfully parsed JSON');
          
          // If it has app_session_id, send it to React Native
          if (data.app_session_id) {
            console.log('[OAuth WebView JS] Found app_session_id, sending to React Native');
            window.ReactNativeWebView.postMessage(JSON.stringify(data));
            return true;
          } else {
            console.log('[OAuth WebView JS] JSON parsed but no app_session_id found');
          }
        } catch (e) {
          console.log('[OAuth WebView JS] JSON parse failed:', e.message);
        }
        return false;
      }
      
      // Try immediately
      tryExtractAndSend();
      
      // Monitor for DOM changes in case JSON loads dynamically
      const observer = new MutationObserver(function(mutations) {
        if (tryExtractAndSend()) {
          observer.disconnect();
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
      });
      
      // Also try again after a short delay
      setTimeout(tryExtractAndSend, 500);
    })();
    true;
  `;

  if (!url) {
    Alert.alert("Error", "No OAuth URL provided");
    router.back();
    return null;
  }

  return (
    <View className="flex-1 bg-background">
      {loading && (
        <View className="absolute inset-0 items-center justify-center bg-background z-10">
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        onLoad={() => setLoading(false)}
        onNavigationStateChange={handleNavigationStateChange}
        onMessage={handleMessage}
        injectedJavaScript={injectedJavaScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
      />
    </View>
  );
}
