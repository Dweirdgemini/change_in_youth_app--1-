import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Modal } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function PayrollManagementScreen() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [showAddPayRate, setShowAddPayRate] = useState(false);
  const [showUploadPayslip, setShowUploadPayslip] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  // Pay Rate Form
  const [payRateForm, setPayRateForm] = useState({
    userId: 0,
    hourlyRate: "",
    sessionRate: "",
    effectiveDate: new Date().toISOString().split("T")[0],
    notes: "",
  });
  
  // Payslip Form
  const [payslipForm, setPayslipForm] = useState({
    userId: 0,
    payPeriodStart: "",
    payPeriodEnd: "",
    grossAmount: "",
    netAmount: "",
    fileUrl: "",
  });
  
  const createPayRateMutation = trpc.userProfile.createPayRate.useMutation({
    onSuccess: () => {
      setShowAddPayRate(false);
      setPayRateForm({
        userId: 0,
        hourlyRate: "",
        sessionRate: "",
        effectiveDate: new Date().toISOString().split("T")[0],
        notes: "",
      });
    },
  });
  
  const uploadPayslipMutation = trpc.userProfile.uploadPayslip.useMutation({
    onSuccess: () => {
      setShowUploadPayslip(false);
      setPayslipForm({
        userId: 0,
        payPeriodStart: "",
        payPeriodEnd: "",
        grossAmount: "",
        netAmount: "",
        fileUrl: "",
      });
    },
  });
  
  if (authLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }
  
  if (!isAuthenticated || (user?.role !== "admin" && user?.role !== "finance")) {
    return (
      <ScreenContainer className="p-4 justify-center">
        <View className="items-center gap-4">
          <Text className="text-2xl font-bold text-foreground text-center leading-tight">
            Access Denied
          </Text>
          <Text className="text-base text-muted text-center leading-relaxed">
            Only admins and finance team can access payroll management
          </Text>
          <TouchableOpacity
            className="bg-primary px-6 py-4 rounded-full mt-4 active:opacity-80"
            onPress={() => router.back()}
          >
            <Text className="text-background font-semibold text-lg">Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }
  
  const handleCreatePayRate = () => {
    if (!payRateForm.userId || (!payRateForm.hourlyRate && !payRateForm.sessionRate)) {
      alert("Please fill in user ID and at least one rate");
      return;
    }
    
    createPayRateMutation.mutate({
      userId: payRateForm.userId,
      hourlyRate: payRateForm.hourlyRate ? parseFloat(payRateForm.hourlyRate) : undefined,
      sessionRate: payRateForm.sessionRate ? parseFloat(payRateForm.sessionRate) : undefined,
      effectiveDate: new Date(payRateForm.effectiveDate),
      notes: payRateForm.notes || undefined,
    });
  };
  
  const handleUploadPayslip = () => {
    if (!payslipForm.userId || !payslipForm.payPeriodStart || !payslipForm.payPeriodEnd || 
        !payslipForm.grossAmount || !payslipForm.netAmount || !payslipForm.fileUrl) {
      alert("Please fill in all required fields");
      return;
    }
    
    uploadPayslipMutation.mutate({
      userId: payslipForm.userId,
      payPeriodStart: new Date(payslipForm.payPeriodStart),
      payPeriodEnd: new Date(payslipForm.payPeriodEnd),
      grossAmount: parseFloat(payslipForm.grossAmount),
      netAmount: parseFloat(payslipForm.netAmount),
      fileUrl: payslipForm.fileUrl,
    });
  };
  
  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-foreground">Payroll Management</Text>
              <Text className="text-base text-muted mt-1">Manage pay rates and payslips</Text>
            </View>
            <TouchableOpacity
              className="bg-surface w-10 h-10 rounded-full items-center justify-center border border-border active:opacity-70"
              onPress={() => router.back()}
            >
              <Text className="text-foreground text-lg">←</Text>
            </TouchableOpacity>
          </View>
          
          {/* Action Cards */}
          <View className="gap-3">
            <TouchableOpacity
              className="bg-primary/10 border border-primary/30 rounded-2xl p-4 active:opacity-70"
              onPress={() => setShowAddPayRate(true)}
            >
              <Text className="text-lg font-semibold text-foreground">💰 Set Pay Rate</Text>
              <Text className="text-sm text-muted mt-1">Update employee pay rates</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="bg-[#F5A962]/10 border border-[#F5A962]/30 rounded-2xl p-4 active:opacity-70"
              onPress={() => setShowUploadPayslip(true)}
            >
              <Text className="text-lg font-semibold text-foreground">📄 Upload Payslip</Text>
              <Text className="text-sm text-muted mt-1">Upload payslip documents</Text>
            </TouchableOpacity>
          </View>
          
          {/* Info Card */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-base font-semibold text-foreground mb-2">Payroll Features</Text>
            <Text className="text-sm text-muted leading-relaxed">
              • Track pay rates with effective dates{"\n"}
              • Upload and store payslip documents{"\n"}
              • View pay history for each employee{"\n"}
              • Automatic activity logging for audit trail
            </Text>
          </View>
        </View>
      </ScrollView>
      
      {/* Add Pay Rate Modal */}
      <Modal visible={showAddPayRate} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6" style={{ maxHeight: "80%" }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-bold text-foreground">Set Pay Rate</Text>
              <TouchableOpacity onPress={() => setShowAddPayRate(false)}>
                <Text className="text-2xl text-muted">×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView className="gap-4">
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">User ID *</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl p-3 text-foreground"
                  placeholder="Enter user ID"
                  placeholderTextColor="#9BA1A6"
                  keyboardType="numeric"
                  value={payRateForm.userId.toString()}
                  onChangeText={(text) => setPayRateForm({ ...payRateForm, userId: parseInt(text) || 0 })}
                />
              </View>
              
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Hourly Rate (£)</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl p-3 text-foreground"
                  placeholder="0.00"
                  placeholderTextColor="#9BA1A6"
                  keyboardType="decimal-pad"
                  value={payRateForm.hourlyRate}
                  onChangeText={(text) => setPayRateForm({ ...payRateForm, hourlyRate: text })}
                />
              </View>
              
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Session Rate (£)</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl p-3 text-foreground"
                  placeholder="0.00"
                  placeholderTextColor="#9BA1A6"
                  keyboardType="decimal-pad"
                  value={payRateForm.sessionRate}
                  onChangeText={(text) => setPayRateForm({ ...payRateForm, sessionRate: text })}
                />
              </View>
              
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Effective Date *</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl p-3 text-foreground"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9BA1A6"
                  value={payRateForm.effectiveDate}
                  onChangeText={(text) => setPayRateForm({ ...payRateForm, effectiveDate: text })}
                />
              </View>
              
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Notes</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl p-3 text-foreground"
                  placeholder="Optional notes..."
                  placeholderTextColor="#9BA1A6"
                  multiline
                  numberOfLines={3}
                  value={payRateForm.notes}
                  onChangeText={(text) => setPayRateForm({ ...payRateForm, notes: text })}
                />
              </View>
              
              <TouchableOpacity
                className="bg-primary py-4 rounded-full active:opacity-80 mt-4"
                onPress={handleCreatePayRate}
                disabled={createPayRateMutation.isPending}
              >
                <Text className="text-background font-semibold text-center text-lg">
                  {createPayRateMutation.isPending ? "Saving..." : "Save Pay Rate"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Upload Payslip Modal */}
      <Modal visible={showUploadPayslip} animationType="slide" transparent>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6" style={{ maxHeight: "80%" }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-bold text-foreground">Upload Payslip</Text>
              <TouchableOpacity onPress={() => setShowUploadPayslip(false)}>
                <Text className="text-2xl text-muted">×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView className="gap-4">
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">User ID *</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl p-3 text-foreground"
                  placeholder="Enter user ID"
                  placeholderTextColor="#9BA1A6"
                  keyboardType="numeric"
                  value={payslipForm.userId.toString()}
                  onChangeText={(text) => setPayslipForm({ ...payslipForm, userId: parseInt(text) || 0 })}
                />
              </View>
              
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Pay Period Start *</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl p-3 text-foreground"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9BA1A6"
                  value={payslipForm.payPeriodStart}
                  onChangeText={(text) => setPayslipForm({ ...payslipForm, payPeriodStart: text })}
                />
              </View>
              
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Pay Period End *</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl p-3 text-foreground"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9BA1A6"
                  value={payslipForm.payPeriodEnd}
                  onChangeText={(text) => setPayslipForm({ ...payslipForm, payPeriodEnd: text })}
                />
              </View>
              
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Gross Amount (£) *</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl p-3 text-foreground"
                  placeholder="0.00"
                  placeholderTextColor="#9BA1A6"
                  keyboardType="decimal-pad"
                  value={payslipForm.grossAmount}
                  onChangeText={(text) => setPayslipForm({ ...payslipForm, grossAmount: text })}
                />
              </View>
              
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">Net Amount (£) *</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl p-3 text-foreground"
                  placeholder="0.00"
                  placeholderTextColor="#9BA1A6"
                  keyboardType="decimal-pad"
                  value={payslipForm.netAmount}
                  onChangeText={(text) => setPayslipForm({ ...payslipForm, netAmount: text })}
                />
              </View>
              
              <View>
                <Text className="text-sm font-medium text-foreground mb-2">File URL *</Text>
                <TextInput
                  className="bg-surface border border-border rounded-xl p-3 text-foreground"
                  placeholder="https://..."
                  placeholderTextColor="#9BA1A6"
                  value={payslipForm.fileUrl}
                  onChangeText={(text) => setPayslipForm({ ...payslipForm, fileUrl: text })}
                />
              </View>
              
              <TouchableOpacity
                className="bg-primary py-4 rounded-full active:opacity-80 mt-4"
                onPress={handleUploadPayslip}
                disabled={uploadPayslipMutation.isPending}
              >
                <Text className="text-background font-semibold text-center text-lg">
                  {uploadPayslipMutation.isPending ? "Uploading..." : "Upload Payslip"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
