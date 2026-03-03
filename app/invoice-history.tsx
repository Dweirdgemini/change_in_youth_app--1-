import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import * as FileSystem from "expo-file-system/legacy";
import { EncodingType } from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export default function InvoiceHistoryScreen() {
  const { data: invoices, isLoading } = trpc.autoInvoices.getInvoiceHistory.useQuery();
  const exportPDF = trpc.autoInvoices.exportInvoicePDF.useMutation();

  const handleDownloadPDF = async (invoiceId: number, invoiceNumber: number) => {
    try {
      const result = await exportPDF.mutateAsync({ invoiceId });
      
      if (result.success && result.pdf) {
        // Save PDF to file system
        const fileUri = `${FileSystem.documentDirectory}${result.filename}`;
        await FileSystem.writeAsStringAsync(fileUri, result.pdf, {
          encoding: EncodingType.Base64,
        });

        // Share the PDF
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert("Success", `Invoice saved to ${fileUri}`);
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to download invoice PDF");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-6">
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground">Invoice History</Text>
          <Text className="text-sm text-muted mt-1">All your generated invoices</Text>
        </View>

        {!invoices || invoices.length === 0 ? (
          <View className="bg-surface rounded-2xl p-8 items-center">
            <Text className="text-6xl mb-4">📋</Text>
            <Text className="text-lg font-semibold text-foreground mb-2">No Invoices Yet</Text>
            <Text className="text-sm text-muted text-center">
              Generate your first invoice to see it here
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            {invoices.map((invoice: any) => {
              const submittedDate = invoice.submittedAt ? new Date(invoice.submittedAt) : null;
              const amount = parseFloat(invoice.amount || "0");

              return (
                <View key={invoice.id} className="bg-surface rounded-2xl p-4 border border-border">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">
                        Invoice #{invoice.invoiceNumber}
                      </Text>
                      <Text className="text-xs text-muted leading-relaxed mt-1">{invoice.invoiceCode}</Text>
                      <Text className="text-xs text-muted leading-relaxed mt-1">{invoice.projectName || "Unknown Project"}</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xl font-bold text-foreground">£{amount.toFixed(2)}</Text>
                      <View className={`px-3 py-1 rounded-full mt-2 ${
                        invoice.status === "approved" ? "bg-success/10" :
                        invoice.status === "rejected" ? "bg-error/10" : "bg-warning/10"
                      }`}>
                        <Text className={`text-xs font-medium ${
                          invoice.status === "approved" ? "text-success" :
                          invoice.status === "rejected" ? "text-error" : "text-warning"
                        }`}>
                          {invoice.status === "approved" ? "Paid" :
                           invoice.status === "rejected" ? "Rejected" : "Pending"}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      className="bg-primary/10 px-4 py-2 rounded-lg active:opacity-70 ml-2"
                      onPress={() => handleDownloadPDF(invoice.id, invoice.invoiceNumber)}
                      disabled={exportPDF.isPending}
                    >
                      <Text className="text-primary font-medium text-sm">
                        {exportPDF.isPending ? "..." : "📄 PDF"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  {submittedDate && (
                    <Text className="text-xs text-muted leading-relaxed pt-3 border-t border-border">
                      📅 Submitted: {submittedDate.toLocaleDateString()}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        
      </ScrollView>
    </ScreenContainer>
  );
}
