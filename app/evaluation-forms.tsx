import { View, Text, TouchableOpacity, ScrollView, Linking, Alert, Modal, Share, Platform, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { router } from "expo-router";
import { useAuthContext } from "@/contexts/auth-context";
import * as WebBrowser from "expo-web-browser";
import QRCode from "react-native-qrcode-svg";
import { useState } from "react";

const evaluationForms = [
  {
    id: 1,
    title: "Tree of Life Post Questionnaire",
    description: "Post-session evaluation form for Tree of Life program participants",
    url: "https://forms.office.com/pages/responsepage.aspx?id=slTDN7CF9UeyIge0jXdO4-2ZvPFKP4VErCR-wO5mEv5UNUxPUlFMU09OMEZJQUhKS1NaRFpCM0pCVy4u&route=shorturl",
    icon: "🌳",
    category: "Tree of Life",
  },
  {
    id: 2,
    title: "Positive ID Evaluation",
    description: "Session feedback form for Positive ID participants",
    url: "https://app.changeinyouth.org/evaluations/positive-id",
    icon: "🆔",
    category: "Positive ID",
    isNative: true, // Use in-app form instead of external link
  },
  {
    id: 3,
    title: "Social Media Preneur Evaluation",
    description: "Post-workshop evaluation for Social Media Preneur program",
    url: "#",
    icon: "📱",
    category: "Social Media Preneur",
  },
  {
    id: 4,
    title: "Job Opportunities",
    description: "Share this QR code for public access to all active job postings",
    url: "https://app.changeinyouth.org/public/jobs",
    icon: "💼",
    category: "Public Access",
  },
];

export default function EvaluationFormsScreen() {
  const { user, isAuthenticated } = useAuthContext();
  const [selectedFormForQR, setSelectedFormForQR] = useState<typeof evaluationForms[0] | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedFormForEmail, setSelectedFormForEmail] = useState<typeof evaluationForms[0] | null>(null);
  const [emailAddresses, setEmailAddresses] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const handleShareQR = async (form: typeof evaluationForms[0]) => {
    try {
      await Share.share({
        message: `Scan this QR code or visit: ${form.url}`,
        url: form.url,
        title: form.title,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleShareViaMessage = async (form: typeof evaluationForms[0]) => {
    const message = `Hi! Please complete this evaluation form: ${form.title}\n\n${form.url}\n\nThank you!`;
    
    try {
      await Share.share({
        message,
        title: form.title,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const handleOpenEmailModal = (form: typeof evaluationForms[0]) => {
    setSelectedFormForEmail(form);
    setEmailMessage(`Hi,\n\nPlease complete the ${form.title} evaluation form:\n\n${form.url}\n\nThank you for your participation!\n\nBest regards,\nChange In Youth Team`);
    setShowEmailModal(true);
  };

  const handleSendEmail = async () => {
    if (!emailAddresses.trim()) {
      Alert.alert("Email Required", "Please enter at least one email address");
      return;
    }

    const emails = emailAddresses.split(/[,;\s]+/).filter(e => e.trim());
    const invalidEmails = emails.filter(email => !email.includes('@'));
    
    if (invalidEmails.length > 0) {
      Alert.alert("Invalid Email", `Please check these email addresses: ${invalidEmails.join(', ')}`);
      return;
    }

    try {
      // Create mailto link with multiple recipients
      const subject = encodeURIComponent(selectedFormForEmail?.title || "Evaluation Form");
      const body = encodeURIComponent(emailMessage);
      const mailtoUrl = `mailto:${emails.join(',')}?subject=${subject}&body=${body}`;
      
      await Linking.openURL(mailtoUrl);
      
      Alert.alert(
        "Email Client Opened",
        "Your default email app has been opened. Please review and send the email.",
        [
          {
            text: "OK",
            onPress: () => {
              setShowEmailModal(false);
              setEmailAddresses("");
              setEmailMessage("");
              setSelectedFormForEmail(null);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to open email client. Please check your email app settings.");
      console.error("Email error:", error);
    }
  };

  const handleOpenForm = async (form: typeof evaluationForms[0]) => {
    if (form.url === "#") {
      Alert.alert("Coming Soon", "This evaluation form will be available soon.");
      return;
    }

    // Check if it's a native in-app form
    if ((form as any).isNative) {
      router.push("/evaluations/positive-id" as any);
      return;
    }

    try {
      // Open form in in-app browser
      await WebBrowser.openBrowserAsync(form.url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        controlsColor: "#0a7ea4",
      });
    } catch (error) {
      // Fallback to external browser
      await Linking.openURL(form.url);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Header */}
          <View className="flex-row items-center justify-between">
            
            <View style={{ width: 60 }} />
          </View>

          <View>
            <Text className="text-2xl font-bold text-foreground">Evaluation Forms</Text>
            <Text className="text-base text-muted mt-1">
              Access post-session evaluation questionnaires
            </Text>
          </View>

          {/* Info Banner */}
          <View className="bg-primary/10 border border-primary/30 rounded-2xl p-4">
            <Text className="text-sm text-foreground">
              ℹ️ Complete evaluation forms after each session to help us improve our programs and track participant progress.
            </Text>
          </View>

          {/* Forms List */}
          <View className="gap-3">
            {evaluationForms.map((form) => (
              <View key={form.id} className="gap-2">
                <TouchableOpacity
                  className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
                  onPress={() => handleOpenForm(form)}
                >
                  <View className="flex-row items-start gap-3">
                    <View className="bg-primary/10 w-12 h-12 rounded-full items-center justify-center">
                      <Text className="text-2xl">{form.icon}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-base font-semibold text-foreground">{form.title}</Text>
                      <Text className="text-sm text-muted mt-1">{form.description}</Text>
                      <View className="bg-primary/10 px-2 py-1 rounded mt-2 self-start">
                        <Text className="text-primary text-xs font-medium">{form.category}</Text>
                      </View>
                    </View>
                    <Text className="text-primary text-xl">→</Text>
                  </View>
                </TouchableOpacity>
                <View className="flex-row gap-2">
                  <TouchableOpacity
                    className="flex-1 bg-primary/10 rounded-xl p-3 active:opacity-70"
                    onPress={() => setSelectedFormForQR(form)}
                  >
                    <Text className="text-primary font-semibold text-center text-sm">📱 QR Code</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-success/10 rounded-xl p-3 active:opacity-70"
                    onPress={() => handleShareViaMessage(form)}
                  >
                    <Text className="text-success font-semibold text-center text-sm">💬 Share</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 bg-warning/10 rounded-xl p-3 active:opacity-70"
                    onPress={() => handleOpenEmailModal(form)}
                  >
                    <Text className="text-warning font-semibold text-center text-sm">📧 Email</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* QR Code Modal */}
          <Modal
            visible={!!selectedFormForQR}
            transparent
            animationType="fade"
            onRequestClose={() => setSelectedFormForQR(null)}
          >
            <View className="flex-1 bg-black/50 items-center justify-center p-6">
              <View className="bg-background rounded-3xl p-6 w-full max-w-sm">
                <Text className="text-2xl font-bold text-foreground text-center mb-2">
                  {selectedFormForQR?.title}
                </Text>
                <Text className="text-sm text-muted text-center mb-4">
                  Scan this QR code to access the evaluation form
                </Text>
                
                {selectedFormForQR && (
                  <View className="bg-white p-6 rounded-2xl items-center mb-4">
                    <QRCode
                      value={selectedFormForQR.url}
                      size={220}
                      backgroundColor="white"
                      color="black"
                    />
                  </View>
                )}

                <View className="gap-3">
                  <TouchableOpacity
                    className="bg-primary px-6 py-4 rounded-full active:opacity-80"
                    onPress={() => selectedFormForQR && handleShareQR(selectedFormForQR)}
                  >
                    <Text className="text-background font-semibold text-center">Share QR Code</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="bg-surface px-6 py-4 rounded-full active:opacity-80"
                    onPress={() => setSelectedFormForQR(null)}
                  >
                    <Text className="text-foreground font-semibold text-center">Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Email Modal */}
          <Modal
            visible={showEmailModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowEmailModal(false)}
          >
            <View className="flex-1 bg-black/50 items-center justify-end">
              <View className="bg-background rounded-t-3xl p-6 w-full">
                <Text className="text-2xl font-bold text-foreground mb-2">
                  Email Evaluation Form
                </Text>
                <Text className="text-sm text-muted mb-4">
                  {selectedFormForEmail?.title}
                </Text>

                {/* Email Addresses Input */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Student Email Addresses *
                  </Text>
                  <TextInput
                    className="bg-surface rounded-xl p-4 text-foreground border border-border"
                    placeholder="student1@example.com, student2@example.com"
                    placeholderTextColor="#9BA1A6"
                    value={emailAddresses}
                    onChangeText={setEmailAddresses}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Text className="text-xs text-muted leading-relaxed mt-1">
                    Separate multiple emails with commas, semicolons, or spaces
                  </Text>
                </View>

                {/* Email Message Input */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-foreground mb-2">
                    Message
                  </Text>
                  <TextInput
                    className="bg-surface rounded-xl p-4 text-foreground border border-border"
                    placeholder="Enter your message..."
                    placeholderTextColor="#9BA1A6"
                    value={emailMessage}
                    onChangeText={setEmailMessage}
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                </View>

                {/* Action Buttons */}
                <View className="gap-3">
                  <TouchableOpacity
                    className="bg-primary px-6 py-4 rounded-full active:opacity-80"
                    onPress={handleSendEmail}
                  >
                    <Text className="text-background font-semibold text-center text-base">
                      📧 Open Email Client
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="bg-surface px-6 py-4 rounded-full active:opacity-80 border border-border"
                    onPress={() => {
                      setShowEmailModal(false);
                      setEmailAddresses("");
                      setEmailMessage("");
                      setSelectedFormForEmail(null);
                    }}
                  >
                    <Text className="text-foreground font-semibold text-center">Cancel</Text>
                  </TouchableOpacity>
                </View>

                <Text className="text-xs text-muted leading-relaxed text-center mt-4">
                  Your default email app will open with the pre-filled message. Review and send from there.
                </Text>
              </View>
            </View>
          </Modal>

          {/* Help Section */}
          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-base font-semibold text-foreground mb-2">Need Help?</Text>
            <Text className="text-sm text-muted leading-relaxed">
              If you're having trouble accessing or completing an evaluation form, please contact your program coordinator or admin.
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
