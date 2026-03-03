import { useEffect } from "react";
import { useRouter } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";

/**
 * Legacy invoice generation page - now redirects to the simplified /my-invoice flow.
 * 
 * This consolidates the two invoice systems into one simpler approach where:
 * - All unpaid activities are automatically collected
 * - User selects a budget category
 * - One invoice is generated for all activities
 */
export default function GenerateInvoiceRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new simplified invoice system
    router.replace("/my-invoice");
  }, []);

  return (
    <ScreenContainer className="items-center justify-center">
      <ActivityIndicator size="large" />
    </ScreenContainer>
  );
}
