import { View, Text, ScrollView, Pressable, TouchableOpacity, TextInput, Alert, Modal, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { downloadCSVTemplate, generateCSVTemplate } from "@/lib/csv-template";
import { useState } from "react";
import { router } from "expo-router";
import { IconSymbol } from "@/components/ui/icon-symbol";
import * as DocumentPicker from "expo-document-picker";

export default function ImportHistoricalDataScreen() {
  const colors = useColors();
  const [showImportModal, setShowImportModal] = useState(false);
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [csvData, setCSVData] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedBudgetLineId, setSelectedBudgetLineId] = useState<number | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [approvedDate, setApprovedDate] = useState("");
  const [paidDate, setPaidDate] = useState("");

  const { data: users } = (trpc.finance as any).getAllUsers.useQuery();
  const { data: projects } = (trpc.finance as any).getProjects.useQuery();
  const { data: budgetLines } = (trpc.finance as any).getBudgetLines.useQuery();
  const importInvoice = (trpc.finance as any).importHistoricalInvoice.useMutation();
  const bulkImport = (trpc.finance as any).bulkImportHistoricalInvoices.useMutation();

  const parseCSV = (text: string) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      data.push(row);
    }

    return data;
  };

  const handleCSVUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: Platform.OS === "web" ? "text/csv" : "public.comma-separated-values-text",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const response = await fetch(file.uri);
      const text = await response.text();
      const parsed = parseCSV(text);

      if (parsed.length === 0) {
        Alert.alert("Error", "No data found in CSV file");
        return;
      }

      setCSVData(parsed);
      setShowCSVModal(true);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to read CSV file");
    }
  };

  const handleBulkImport = async () => {
    if (csvData.length === 0) return;

    setIsProcessing(true);
    try {
      const invoices = csvData.map((row) => ({
        userEmail: row.team_member_email || row.email || "",
        projectName: row.project_name || row.project || "",
        amount: parseFloat(row.amount || "0"),
        invoiceNumber: row.invoice_number || row.invoice_no || "",
        description: row.description || "",
        invoiceDate: row.invoice_date || "",
        approvedDate: row.approved_date || undefined,
        paidDate: row.paid_date || undefined,
      }));

      const result = await bulkImport.mutateAsync({ invoices });

      Alert.alert(
        "Import Complete",
        `Successfully imported ${result.success} invoices.\n${result.failed > 0 ? `Failed: ${result.failed}\n\nErrors:\n${result.errors.slice(0, 5).join("\n")}` : ""}`,
        [
          {
            text: "OK",
            onPress: () => {
              setShowCSVModal(false);
              setCSVData([]);
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to import invoices");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredBudgetLines = budgetLines?.filter(
    (line) => !selectedProjectId || line.projectId === selectedProjectId
  );

  const resetForm = () => {
    setSelectedUserId(null);
    setSelectedProjectId(null);
    setSelectedBudgetLineId(null);
    setAmount("");
    setDescription("");
    setInvoiceNumber("");
    setInvoiceDate("");
    setApprovedDate("");
    setPaidDate("");
  };

  const handleImport = async () => {
    if (!selectedUserId || !selectedProjectId || !amount || !invoiceNumber || !invoiceDate) {
      Alert.alert("Required Fields", "Please fill in team member, project, amount, invoice number, and invoice date");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid positive amount");
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(invoiceDate)) {
      Alert.alert("Invalid Date", "Invoice date must be in format YYYY-MM-DD (e.g., 2024-06-15)");
      return;
    }

    if (approvedDate && !dateRegex.test(approvedDate)) {
      Alert.alert("Invalid Date", "Approved date must be in format YYYY-MM-DD");
      return;
    }

    if (paidDate && !dateRegex.test(paidDate)) {
      Alert.alert("Invalid Date", "Paid date must be in format YYYY-MM-DD");
      return;
    }

    try {
      await importInvoice.mutateAsync({
        userId: selectedUserId,
        projectId: selectedProjectId,
        budgetLineId: selectedBudgetLineId || undefined,
        amount: amountNum,
        description: description.trim() || `Historical invoice ${invoiceNumber}`,
        invoiceNumber,
        invoiceDate,
        approvedDate: approvedDate || undefined,
        paidDate: paidDate || undefined,
      });

      Alert.alert("Success", "Historical invoice imported successfully");
      setShowImportModal(false);
      resetForm();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to import invoice");
      console.error(error);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView className="flex-1 p-4">
        {/* Header with Back Button */}
        <View className="mb-4">
          <View className="flex-row items-center mb-2">
            <Pressable
              onPress={() => router.back()}
              className="mr-3 p-2 -ml-2"
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
            >
              <IconSymbol name="chevron.left" size={28} color={colors.foreground} />
            </Pressable>
            <Text className="text-2xl font-bold text-foreground">Import Historical Data</Text>
          </View>
          <Text className="text-base text-muted">
            Import old invoices and projects to migrate your existing records
          </Text>
        </View>

        {/* Info Card */}
        <View className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-foreground mb-2">
            📦 Data Migration Tool
          </Text>
          <Text className="text-sm text-muted leading-relaxed">
            Use this tool to import historical invoices from your shared drive. All imported data will be included in earnings calculations and analytics. You can backdate invoices to reflect when they were originally created.
          </Text>
        </View>

        {/* Import Buttons - MOVED TO TOP FOR VISIBILITY */}
        <View className="gap-3 mb-4">
          <TouchableOpacity
            onPress={handleCSVUpload}
            className="bg-success rounded-xl p-4"
            activeOpacity={0.7}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', textAlign: 'center', fontSize: 16 }}>
              📊 Upload CSV (Bulk Import)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowImportModal(true)}
            className="bg-primary rounded-xl p-4"
            activeOpacity={0.7}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: 'bold', textAlign: 'center', fontSize: 16 }}>
              + Import Single Invoice
            </Text>
          </TouchableOpacity>
        </View>

        {/* CSV Template Download */}
        <View className="bg-surface border border-border rounded-2xl p-4 mb-4">
          <Text className="text-base font-semibold text-foreground mb-2">
            📄 CSV Template
          </Text>
          <Text className="text-sm text-muted mb-3">
            Download the CSV template with correct column headers and example data to prepare your bulk import.
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS === "web") {
                downloadCSVTemplate();
                Alert.alert("Success", "CSV template downloaded!");
              } else {
                const template = generateCSVTemplate();
                Alert.alert(
                  "CSV Template",
                  "Copy this template format:\n\n" + template,
                  [
                    { text: "OK", style: "default" }
                  ]
                );
              }
            }}
            className="bg-primary px-6 py-3 rounded-full"
            activeOpacity={0.7}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600', textAlign: 'center' }}>
              📥 Download CSV Template
            </Text>
          </TouchableOpacity>
        </View>

        {/* Import Buttons - REMOVED FROM HERE, NOW AT TOP */}

        {/* Instructions */}
        <View className="bg-surface rounded-2xl p-4 border border-border mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">How to Import</Text>
          <View className="gap-3">
            <View className="flex-row gap-3">
              <Text className="text-primary font-bold text-base">1.</Text>
              <Text className="text-sm text-muted flex-1">
                Select the team member who earned the payment
              </Text>
            </View>
            <View className="flex-row gap-3">
              <Text className="text-primary font-bold text-base">2.</Text>
              <Text className="text-sm text-muted flex-1">
                Choose the project (create completed projects in Project Management first)
              </Text>
            </View>
            <View className="flex-row gap-3">
              <Text className="text-primary font-bold text-base">3.</Text>
              <Text className="text-sm text-muted flex-1">
                Enter the invoice details and dates (use YYYY-MM-DD format)
              </Text>
            </View>
            <View className="flex-row gap-3">
              <Text className="text-primary font-bold text-base">4.</Text>
              <Text className="text-sm text-muted flex-1">
                If the invoice was already approved/paid, enter those dates too
              </Text>
            </View>
          </View>
        </View>

        {/* Tips */}
        <View className="bg-warning/10 border border-warning/30 rounded-2xl p-4">
          <Text className="text-base font-semibold text-foreground mb-2">💡 Tips</Text>
          <Text className="text-sm text-muted leading-relaxed">
            • Create all historical projects first (mark them as "Completed" status){"\n"}
            • Import invoices in chronological order for better tracking{"\n"}
            • Include paid dates for invoices that were already processed{"\n"}
            • All imported data will appear in team member earnings and analytics
          </Text>
        </View>

        {/* Import Modal */}
        <Modal
          visible={showImportModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowImportModal(false)}
        >
          <View className="flex-1 bg-black/50 items-center justify-end">
            <View className="bg-background rounded-t-3xl p-6 w-full max-h-[90%]">
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text className="text-2xl font-bold text-foreground mb-4">
                  Import Historical Invoice
                </Text>

                {/* Team Member Selection */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Team Member *
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
                    <View className="flex-row gap-2 pr-12">
                      {users?.map((user: any) => (
                        <Pressable
                          key={user.id}
                          onPress={() => setSelectedUserId(user.id)}
                          className={`px-4 py-2 rounded-full ${
                            selectedUserId === user.id
                              ? "bg-primary"
                              : "bg-surface border border-border"
                          }`}
                          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                        >
                          <Text
                            className={`text-sm font-semibold ${
                              selectedUserId === user.id
                                ? "text-background"
                                : "text-foreground"
                            }`}
                          >
                            {user.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Project Selection */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">Project *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
                    <View className="flex-row gap-2 pr-12">
                      {projects?.map((project) => (
                        <Pressable
                          key={project.id}
                          onPress={() => {
                            setSelectedProjectId(project.id);
                            setSelectedBudgetLineId(null);
                          }}
                          className={`px-4 py-2 rounded-full ${
                            selectedProjectId === project.id
                              ? "bg-primary"
                              : "bg-surface border border-border"
                          }`}
                          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                        >
                          <Text
                            className={`text-sm font-semibold ${
                              selectedProjectId === project.id
                                ? "text-background"
                                : "text-foreground"
                            }`}
                          >
                            {project.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>

                {/* Budget Line Selection (Optional) */}
                {selectedProjectId && filteredBudgetLines && filteredBudgetLines.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-sm font-semibold text-foreground mb-2">
                      Budget Line (Optional)
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
                      <View className="flex-row gap-2 pr-12">
                        <Pressable
                          onPress={() => setSelectedBudgetLineId(null)}
                          className={`px-4 py-2 rounded-full ${
                            selectedBudgetLineId === null
                              ? "bg-primary"
                              : "bg-surface border border-border"
                          }`}
                          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                        >
                          <Text
                            className={`text-sm font-semibold ${
                              selectedBudgetLineId === null
                                ? "text-background"
                                : "text-foreground"
                            }`}
                          >
                            None
                          </Text>
                        </Pressable>
                        {filteredBudgetLines.map((line) => (
                          <Pressable
                            key={line.id}
                            onPress={() => setSelectedBudgetLineId(line.id)}
                            className={`px-4 py-2 rounded-full ${
                              selectedBudgetLineId === line.id
                                ? "bg-primary"
                                : "bg-surface border border-border"
                            }`}
                            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                          >
                            <Text
                              className={`text-sm font-semibold ${
                                selectedBudgetLineId === line.id
                                  ? "text-background"
                                  : "text-foreground"
                              }`}
                            >
                              {line.category}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                )}

                {/* Amount */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Amount (£) *
                  </Text>
                  <TextInput
                    className="bg-surface rounded-xl p-4 text-foreground border border-border"
                    placeholder="0.00"
                    placeholderTextColor={colors.muted}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                  />
                </View>

                {/* Invoice Number */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Invoice Number *
                  </Text>
                  <TextInput
                    className="bg-surface rounded-xl p-4 text-foreground border border-border"
                    placeholder="e.g., INV-2024-001"
                    placeholderTextColor={colors.muted}
                    value={invoiceNumber}
                    onChangeText={setInvoiceNumber}
                  />
                </View>

                {/* Description */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Description
                  </Text>
                  <TextInput
                    className="bg-surface rounded-xl p-4 text-foreground border border-border"
                    placeholder="Brief description..."
                    placeholderTextColor={colors.muted}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={2}
                    textAlignVertical="top"
                  />
                </View>

                {/* Invoice Date */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Invoice Date * (YYYY-MM-DD)
                  </Text>
                  <TextInput
                    className="bg-surface rounded-xl p-4 text-foreground border border-border"
                    placeholder="2024-06-15"
                    placeholderTextColor={colors.muted}
                    value={invoiceDate}
                    onChangeText={setInvoiceDate}
                  />
                </View>

                {/* Approved Date */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Approved Date (Optional, YYYY-MM-DD)
                  </Text>
                  <TextInput
                    className="bg-surface rounded-xl p-4 text-foreground border border-border"
                    placeholder="2024-06-20"
                    placeholderTextColor={colors.muted}
                    value={approvedDate}
                    onChangeText={setApprovedDate}
                  />
                  <Text className="text-xs text-muted leading-relaxed mt-1">
                    Leave blank if not yet approved
                  </Text>
                </View>

                {/* Paid Date */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Paid Date (Optional, YYYY-MM-DD)
                  </Text>
                  <TextInput
                    className="bg-surface rounded-xl p-4 text-foreground border border-border"
                    placeholder="2024-06-25"
                    placeholderTextColor={colors.muted}
                    value={paidDate}
                    onChangeText={setPaidDate}
                  />
                  <Text className="text-xs text-muted leading-relaxed mt-1">
                    Leave blank if not yet paid
                  </Text>
                </View>

                {/* Action Buttons */}
                <View className="gap-3">
                  <Pressable
                    onPress={handleImport}
                    className="bg-primary px-6 py-4 rounded-full"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    disabled={importInvoice.isLoading}
                  >
                    <Text className="text-background font-semibold text-center text-base">
                      {importInvoice.isLoading ? "Importing..." : "Import Invoice"}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setShowImportModal(false);
                      resetForm();
                    }}
                    className="bg-surface px-6 py-4 rounded-full border border-border"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <Text className="text-foreground font-semibold text-center">Cancel</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* CSV Import Modal */}
        <Modal
          visible={showCSVModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCSVModal(false)}
        >
          <View className="flex-1 bg-black/50 items-center justify-end">
            <View className="bg-background rounded-t-3xl p-6 w-full max-h-[90%]">
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text className="text-2xl font-bold text-foreground mb-4">
                  CSV Import Preview
                </Text>

                <View className="bg-primary/10 border border-primary/30 rounded-xl p-3 mb-4">
                  <Text className="text-sm text-foreground">
                    <Text className="font-semibold">{csvData.length} invoices</Text> found in CSV
                  </Text>
                </View>

                {/* CSV Format Guide */}
                <View className="bg-surface rounded-xl p-4 border border-border mb-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Expected CSV Format:
                  </Text>
                  <Text className="text-xs font-mono text-muted">
                    team_member_email,project_name,amount,invoice_number,invoice_date,approved_date,paid_date
                  </Text>
                </View>

                {/* Preview First 5 Rows */}
                <Text className="text-base font-semibold text-foreground mb-2">
                  Preview (first 5 rows):
                </Text>
                <View className="gap-2 mb-4">
                  {csvData.slice(0, 5).map((row, index) => (
                    <View
                      key={index}
                      className="bg-surface rounded-xl p-3 border border-border"
                    >
                      <Text className="text-xs text-muted leading-relaxed mb-1">Row {index + 1}</Text>
                      <Text className="text-sm text-foreground font-medium">
                        {row.team_member_email || row.email}
                      </Text>
                      <Text className="text-xs text-muted leading-relaxed">
                        {row.project_name || row.project} • £{row.amount} • {row.invoice_number || row.invoice_no}
                      </Text>
                    </View>
                  ))}
                  {csvData.length > 5 && (
                    <Text className="text-xs text-muted leading-relaxed text-center">
                      +{csvData.length - 5} more rows
                    </Text>
                  )}
                </View>

                {/* Action Buttons */}
                <View className="gap-3">
                  <Pressable
                    onPress={handleBulkImport}
                    className="bg-success px-6 py-4 rounded-full"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    disabled={isProcessing}
                  >
                    <Text className="text-background font-semibold text-center text-base">
                      {isProcessing ? "Importing..." : `Import ${csvData.length} Invoices`}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      setShowCSVModal(false);
                      setCSVData([]);
                    }}
                    className="bg-surface px-6 py-4 rounded-full border border-border"
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                    disabled={isProcessing}
                  >
                    <Text className="text-foreground font-semibold text-center">Cancel</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </ScreenContainer>
  );
}
