import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors } from "@/hooks/use-colors";

/**
 * QR Scanner Screen - For Mobile Authentication
 * 
 * This screen allows mobile users to scan QR codes generated on the web:
 * 1. Request camera permission
 * 2. Scan QR code containing session token
 * 3. Extract token and store in AsyncStorage
 * 4. Navigate to home screen (logged in)
 */
export default function ScanQRScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const router = useRouter();
  const colors = useColors();

  if (Platform.OS === "web") {
    return (
      <ScreenContainer className="p-4 justify-center">
        <View className="items-center gap-4">
          <Text className="text-xl font-bold text-foreground text-center">
            QR scanning is not available on web
          </Text>
          <Text className="text-muted text-center">
            Please use the mobile app to scan QR codes.
          </Text>
          
        </View>
      </ScreenContainer>
    );
  }

  if (!permission) {
    return (
      <ScreenContainer className="p-4 justify-center">
        <View className="items-center">
          <Text className="text-foreground">Requesting camera permission...</Text>
        </View>
      </ScreenContainer>
    );
  }

  if (!permission.granted) {
    return (
      <ScreenContainer className="p-4 justify-center">
        <View className="items-center gap-4">
          <Text className="text-xl font-bold text-foreground text-center">
            Camera Permission Required
          </Text>
          <Text className="text-muted text-center">
            We need camera access to scan QR codes for authentication.
          </Text>
          <TouchableOpacity
            onPress={requestPermission}
            className="mt-4 bg-primary px-6 py-3 rounded-full"
          >
            <Text className="text-background font-semibold">Grant Permission</Text>
          </TouchableOpacity>
          
        </View>
      </ScreenContainer>
    );
  }

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    console.log("[QR Scanner] Scanned data:", data);

    try {
      // The QR code contains the session token
      const sessionToken = data;

      // Store the token
      await AsyncStorage.setItem("app_session_id", sessionToken);
      console.log("[QR Scanner] Session token stored");

      // Navigate to home (will be logged in)
      router.replace("/(tabs)");
    } catch (error) {
      console.error("[QR Scanner] Error processing QR code:", error);
      alert("Failed to process QR code. Please try again.");
      setScanned(false);
    }
  };

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]}>
      <View style={styles.container}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
        >
          <View style={styles.overlay}>
            <View style={styles.topOverlay} />
            <View style={styles.middleRow}>
              <View style={styles.sideOverlay} />
              <View style={styles.scanArea}>
                <View style={[styles.corner, styles.topLeft, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.topRight, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.bottomLeft, { borderColor: colors.primary }]} />
                <View style={[styles.corner, styles.bottomRight, { borderColor: colors.primary }]} />
              </View>
              <View style={styles.sideOverlay} />
            </View>
            <View style={styles.bottomOverlay}>
              <Text style={[styles.instructionText, { color: colors.foreground }]}>
                Position the QR code within the frame
              </Text>
              
            </View>
          </View>
        </CameraView>
      </View>
    </ScreenContainer>
  );
}

const { width: screenWidth } = Dimensions.get('window');
const scanSize = Math.min(screenWidth * 0.75, 300);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  topOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  middleRow: {
    flexDirection: "row",
    height: scanSize,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  scanArea: {
    width: scanSize,
    height: scanSize,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    paddingBottom: 40,
  },
  instructionText: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  cancelButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
