import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from "react-native";
import { ScreenWithBackButton } from "@/components/screen-with-back-button";
import { router, useLocalSearchParams } from "expo-router";
import { trpc } from "@/lib/trpc";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";
import * as FileSystem from "expo-file-system/legacy";
import { EncodingType } from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams();
  const colors = useColors();
  const invoiceId = parseInt(id as string);

  const { data: invoice, isLoading } = (trpc.finance as any).getInvoiceById.useQuery(
    { invoiceId },
    { enabled: !!invoiceId }
  );

  const exportPDF = trpc.autoInvoices.exportInvoicePDF.useMutation();

  const handleDownloadPDF = async () => {
    if (!invoice) return;

    try {
      const result = await exportPDF.mutateAsync({ invoiceId: invoice.id });
      
      if (result.success && result.pdf) {
        if (Platform.OS === "web") {
          // Web: Download PDF directly using browser API
          const blob = await fetch(`data:application/pdf;base64,${result.pdf}`).then(r => r.blob());
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = result.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          Alert.alert("Success", "Invoice PDF downloaded");
        } else {
          // Mobile: Save to file system and share
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
      }
    } catch (error) {
      Alert.alert("Error", "Failed to download invoice PDF");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <ScreenWithBackButton className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenWithBackButton>
    );
  }

  if (!invoice) {
    return (
      <ScreenWithBackButton className="p-4 justify-center">
        <View className="items-center gap-4">
          <Text className="text-6xl">📄</Text>
          <Text className="text-xl font-bold text-foreground text-center">
            Invoice Not Found
          </Text>
          <Text className="text-sm text-muted text-center">
            This invoice may have been deleted or you don't have permission to view it.
          </Text>
          
        </View>
      </ScreenWithBackButton>
    );
  }

  const submittedDate = invoice.submittedAt ? new Date(invoice.submittedAt) : null;
  const approvedDate = invoice.approvedAt ? new Date(invoice.approvedAt) : null;
  const paidDate = invoice.paidAt ? new Date(invoice.paidAt) : null;
  const amount = parseFloat(invoice.totalAmount || "0");
  const paidAmount = parseFloat(invoice.paidAmount || "0");

  return (
    <ScreenWithBackButton>
      <ScrollView className="flex-1 p-6">
        {/* Header with Back Button */}
        <View className="mb-4">
          
          <Text className="text-2xl font-bold text-foreground">Invoice Details</Text>
          <Text className="text-sm text-muted mt-1">
            {invoice.invoiceNumber ? `#${invoice.invoiceNumber}` : `Invoice ${invoice.id}`}
          </Text>
        </View>

        {/* Status Badge */}
        <View className="mb-4">
          <View
            className={`px-4 py-2 rounded-full self-start ${
              invoice.status === "approved" || invoice.status === "paid"
                ? "bg-success/10"
                : invoice.status === "rejected"
                ? "bg-error/10"
                : "bg-warning/10"
            }`}
          >
            <Text
              className={`text-sm font-semibold ${
                invoice.status === "approved" || invoice.status === "paid"
                  ? "text-success"
                  : invoice.status === "rejected"
                  ? "text-error"
                  : "text-warning"
              }`}
            >
              {invoice.status === "approved"
                ? "✓ Approved"
                : invoice.status === "paid"
                ? "✓ Paid"
                : invoice.status === "rejected"
                ? "✗ Rejected"
                : invoice.status === "draft"
                ? "📝 Draft"
                : "⏳ Pending"}
            </Text>
          </View>
        </View>

        {/* Amount Card */}
        <View className="bg-primary/10 rounded-2xl p-6 mb-4 border border-primary/20">
          <Text className="text-sm text-primary mb-2">Total Amount</Text>
          <Text className="text-2xl font-bold text-foreground">£{amount.toFixed(2)}</Text>
          {paidAmount > 0 && (
            <View className="mt-4 pt-4 border-t border-primary/20">
              <Text className="text-sm text-muted leading-relaxed">Paid Amount</Text>
              <Text className="text-2xl font-semibold text-success mt-1">
                £{paidAmount.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        {/* Invoice Information */}
        <View className="bg-surface rounded-2xl p-6 mb-4 border border-border gap-4">
          <Text className="text-lg font-semibold text-foreground mb-2">Invoice Information</Text>

          {invoice.invoiceCode && (
            <View>
              <Text className="text-sm text-muted leading-relaxed">Invoice Code</Text>
              <Text className="text-base font-medium text-foreground mt-1">
                {invoice.invoiceCode}
              </Text>
            </View>
          )}

          {invoice.description && (
            <View>
              <Text className="text-sm text-muted leading-relaxed">Description</Text>
              <Text className="text-base font-medium text-foreground mt-1">
                {invoice.description}
              </Text>
            </View>
          )}

          {invoice.budgetLineCategory && (
            <View>
              <Text className="text-sm text-muted leading-relaxed">Budget Category</Text>
              <Text className="text-base font-medium text-foreground mt-1">
                {invoice.budgetLineCategory.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </Text>
            </View>
          )}

          {invoice.projectName && (
            <View>
              <Text className="text-sm text-muted leading-relaxed">Project</Text>
              <Text className="text-base font-medium text-foreground mt-1">
                {invoice.projectName}
              </Text>
            </View>
          )}
        </View>

        {/* Timeline */}
        <View className="bg-surface rounded-2xl p-6 mb-4 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">Timeline</Text>

          <View className="gap-3">
            {submittedDate && (
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
                  <Ionicons name="send" size={16} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">Submitted</Text>
                  <Text className="text-xs text-muted leading-relaxed mt-1">
                    {submittedDate.toLocaleDateString()} at{" "}
                    {submittedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              </View>
            )}

            {approvedDate && (
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-success/10 items-center justify-center">
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">Approved</Text>
                  <Text className="text-xs text-muted leading-relaxed mt-1">
                    {approvedDate.toLocaleDateString()} at{" "}
                    {approvedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              </View>
            )}

            {paidDate && (
              <View className="flex-row items-center gap-3">
                <View className="w-8 h-8 rounded-full bg-success/10 items-center justify-center">
                  <Ionicons name="cash" size={16} color={colors.success} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-foreground">Paid</Text>
                  <Text className="text-xs text-muted leading-relaxed mt-1">
                    {paidDate.toLocaleDateString()} at{" "}
                    {paidDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              </View>
            )}

            {invoice.status === "rejected" && invoice.rejectionReason && (
              <View className="flex-row items-start gap-3 mt-2 p-3 bg-error/5 rounded-lg">
                <View className="w-8 h-8 rounded-full bg-error/10 items-center justify-center">
                  <Ionicons name="close-circle" size={16} color={colors.error} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-error">Rejected</Text>
                  <Text className="text-xs text-muted leading-relaxed mt-1">{invoice.rejectionReason}</Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View className="bg-surface rounded-2xl p-6 mb-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-2">Notes</Text>
            <Text className="text-sm text-muted leading-relaxed">{invoice.notes}</Text>
          </View>
        )}

        {/* Actions */}
        <View className="gap-3">
          <TouchableOpacity
            className="bg-primary px-6 py-4 rounded-full active:opacity-80"
            onPress={handleDownloadPDF}
            disabled={exportPDF.isPending}
          >
            {exportPDF.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-background font-bold text-center">
                📄 Download PDF
              </Text>
            )}
          </TouchableOpacity>

          
        </View>
      </ScrollView>
    </ScreenWithBackButton>
  );
}
