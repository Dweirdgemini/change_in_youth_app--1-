import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";

export default function ReportsScreen() {
  const colors = useColors();
  const [reportType, setReportType] = useState<"participant_summary" | "session_statistics" | "individual_journey" | "group_outcomes" | "financial_overview">("participant_summary");
  const [title, setTitle] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [generating, setGenerating] = useState(false);

  const { data: reports, refetch } = trpc.funderReports.getAllReports.useQuery();
  const generateMutation = trpc.funderReports.generateReport.useMutation();
  const deleteMutation = trpc.funderReports.deleteReport.useMutation();

  const reportTypes = [
    { value: "participant_summary", label: "Participant Summary" },
    { value: "session_statistics", label: "Session Statistics" },
    { value: "individual_journey", label: "Individual Journey" },
    { value: "group_outcomes", label: "Group Outcomes" },
    { value: "financial_overview", label: "Financial Overview" },
  ];

  const handleGenerate = async () => {
    if (!title || !dateFrom || !dateTo) {
      alert("Please fill in all fields");
      return;
    }

    setGenerating(true);
    try {
      await generateMutation.mutateAsync({
        title,
        reportType,
        dateFrom,
        dateTo,
      });
      alert("Report generated successfully!");
      setTitle("");
      setDateFrom("");
      setDateTo("");
      refetch();
    } catch (error: any) {
      alert(error.message || "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (reportId: number) => {
    try {
      await deleteMutation.mutateAsync({ reportId });
      refetch();
    } catch (error: any) {
      alert(error.message || "Failed to delete report");
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {/* Header */}
          <View>
            <Text className="text-2xl font-bold text-foreground">Funder Reports</Text>
            <Text className="text-sm text-muted mt-1">
              Generate professional reports for funders
            </Text>
          </View>

          {/* Report Generator */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Generate New Report
            </Text>

            {/* Report Title */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">Report Title</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Q4 2025 Impact Report"
                placeholderTextColor={colors.muted}
                className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>

            {/* Report Type */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">Report Type</Text>
              <View className="flex-row flex-wrap gap-2">
                {reportTypes.map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => setReportType(type.value as any)}
                    style={{
                      backgroundColor: reportType === type.value ? colors.primary : colors.surface,
                      borderColor: colors.border,
                      borderWidth: 1,
                    }}
                    className="px-4 py-2 rounded-full"
                  >
                    <Text
                      style={{
                        color: reportType === type.value ? "#FFFFFF" : colors.foreground,
                      }}
                      className="text-sm font-medium"
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Date Range */}
            <View className="flex-row gap-4 mb-4">
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground mb-2">From Date</Text>
                <TextInput
                  value={dateFrom}
                  onChangeText={setDateFrom}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.muted}
                  className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground mb-2">To Date</Text>
                <TextInput
                  value={dateTo}
                  onChangeText={setDateTo}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.muted}
                  className="bg-background border border-border rounded-lg px-4 py-3 text-foreground"
                />
              </View>
            </View>

            {/* Generate Button */}
            <TouchableOpacity
              onPress={handleGenerate}
              disabled={generating}
              style={{ backgroundColor: colors.primary }}
              className="py-3 rounded-lg items-center"
            >
              {generating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold">Generate Report</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Existing Reports */}
          <View>
            <Text className="text-xl font-bold text-foreground mb-3">
              Generated Reports
            </Text>

            {!reports || reports.length === 0 ? (
              <View className="bg-surface rounded-2xl p-6 items-center border border-border">
                <Text className="text-muted text-center">
                  No reports generated yet
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {reports.map((report) => (
                  <View
                    key={report.id}
                    className="bg-surface rounded-2xl p-4 border border-border"
                  >
                    <View className="flex-row justify-between items-start mb-2">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground">
                          {report.title}
                        </Text>
                        <Text className="text-sm text-muted mt-1">
                          {report.reportType.replace(/_/g, " ").toUpperCase()}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleDelete(report.id)}
                        className="px-3 py-1 bg-error rounded-lg"
                      >
                        <Text className="text-white text-xs font-medium">Delete</Text>
                      </TouchableOpacity>
                    </View>

                    <View className="flex-row gap-4 mt-2">
                      <Text className="text-xs text-muted leading-relaxed">
                        From: {formatDate(report.dateFrom)}
                      </Text>
                      <Text className="text-xs text-muted leading-relaxed">
                        To: {formatDate(report.dateTo)}
                      </Text>
                    </View>

                    <View className="flex-row gap-2 mt-3">
                      <TouchableOpacity
                        onPress={() => router.push(`/admin/report-view/${report.id}` as any)}
                        style={{ backgroundColor: colors.primary }}
                        className="flex-1 py-2 rounded-lg items-center"
                      >
                        <Text className="text-white text-sm font-medium">View Report</Text>
                      </TouchableOpacity>
                      {report.pdfUrl && (
                        <TouchableOpacity
                          style={{ backgroundColor: colors.success }}
                          className="flex-1 py-2 rounded-lg items-center"
                        >
                          <Text className="text-white text-sm font-medium">Download PDF</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
