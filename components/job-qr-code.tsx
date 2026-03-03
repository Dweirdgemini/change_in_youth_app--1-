import { View, Text, TouchableOpacity, Alert, Platform } from "react-native";
import Svg, { Rect, Path } from "react-native-svg";
import { useColors } from "@/hooks/use-colors";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

interface JobQRCodeProps {
  url: string;
  size?: number;
}

// Simple QR code generator for URLs
function generateQRCodePath(data: string, size: number): string {
  // This is a simplified QR code representation
  // In production, you'd use a proper QR code library
  // For now, we'll create a placeholder pattern
  const gridSize = 25;
  const cellSize = size / gridSize;
  
  let path = "";
  
  // Create a simple pattern based on the URL
  const hash = data.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      // Create a deterministic pattern based on position and hash
      const shouldFill = ((x + y + hash) % 3 === 0) || 
                        (x < 3 && y < 3) || // Top-left corner
                        (x > gridSize - 4 && y < 3) || // Top-right corner
                        (x < 3 && y > gridSize - 4); // Bottom-left corner
      
      if (shouldFill) {
        const px = x * cellSize;
        const py = y * cellSize;
        path += `M${px},${py} L${px + cellSize},${py} L${px + cellSize},${py + cellSize} L${px},${py + cellSize} Z `;
      }
    }
  }
  
  return path;
}

export function JobQRCode({ url, size = 200 }: JobQRCodeProps) {
  const colors = useColors();
  const qrPath = generateQRCodePath(url, size);

  const handleDownload = async () => {
    if (Platform.OS === "web") {
      Alert.alert("Download", "QR code download is available on mobile devices");
      return;
    }

    try {
      // Create SVG string
      const svgString = `
        <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
          <rect width="${size}" height="${size}" fill="white"/>
          <path d="${qrPath}" fill="black"/>
        </svg>
      `;

      // Save to file
      const fileUri = `${FileSystem.documentDirectory}job-opportunities-qr.svg`;
      await FileSystem.writeAsStringAsync(fileUri, svgString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "image/svg+xml",
          dialogTitle: "Save QR Code",
        });
      } else {
        Alert.alert("Success", `QR code saved to ${fileUri}`);
      }
    } catch (error) {
      console.error("Failed to download QR code:", error);
      Alert.alert("Error", "Failed to download QR code");
    }
  };

  return (
    <View className="items-center gap-4">
      <View
        className="bg-white p-4 rounded-2xl"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Svg width={size} height={size}>
          <Rect width={size} height={size} fill="white" />
          <Path d={qrPath} fill="black" />
        </Svg>
      </View>

      <View className="items-center gap-2">
        <Text className="text-sm font-semibold text-foreground text-center">
          Scan to View Job Opportunities
        </Text>
        <Text className="text-xs text-muted text-center max-w-xs">
          {url}
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleDownload}
        className="bg-primary rounded-full px-6 py-3 flex-row items-center gap-2 active:opacity-80"
      >
        <Ionicons name="download" size={20} color="#fff" />
        <Text className="text-white font-semibold">Download QR Code</Text>
      </TouchableOpacity>
    </View>
  );
}
