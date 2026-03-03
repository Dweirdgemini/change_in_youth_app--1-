import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Share,
  Modal,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";
import { getConsentFormUrl } from "@/constants/config";

/**
 * Admin Consent Forms Management Screen
 * 
 * View all submitted consent forms
 * Generate and share consent form links
 * Mark forms as received
 */
export default function ConsentFormsScreen() {
  const colors = useColors();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrProjectId, setQrProjectId] = useState<number | null>(null);
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receivedBy, setReceivedBy] = useState("");
  const [storedIn, setStoredIn] = useState("");
  
  const { data: projects } = (trpc.admin as any).getProjects.useQuery();
  const { data: allForms } = trpc.consent.getAllConsentForms.useQuery();
  const markAsReceived = trpc.consent.markAsReceived.useMutation();
  
  const utils = trpc.useUtils();
  
  // Get unique schools for filter dropdown
  const uniqueSchools = Array.from(new Set(allForms?.map((f) => f.schoolName).filter(Boolean))) as string[];
  
  const filteredForms = allForms?.filter((f) => {
    if (selectedProject && f.projectId !== selectedProject) return false;
    if (selectedSchool && f.schoolName !== selectedSchool) return false;
    return true;
  });
  
  const handleShareLink = async (projectId: number) => {
    const link = `changein://consent/${projectId}`;
    const webLink = getConsentFormUrl(projectId);
    
    try {
      await Share.share({
        message: `Please fill out the consent form for our programme:\n\n${webLink}\n\nOr open in app: ${link}`,
        title: "Consent Form Link",
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share link");
    }
  };
  
  const handleCopyLink = async (projectId: number) => {
    const webLink = getConsentFormUrl(projectId);
    await Clipboard.setStringAsync(webLink);
    Alert.alert("Copied", "Link copied to clipboard");
  };
  
  const handleEmailLink = async (projectId: number) => {
    const project = projects?.find((p) => p.id === projectId);
    const webLink = getConsentFormUrl(projectId);
    const subject = `Consent Form - ${project?.name || "Change In Youth"}`;
    const body = `Dear Parent/Guardian,\n\nPlease complete the consent form for ${project?.name || "our programme"} by clicking the link below:\n\n${webLink}\n\nThank you,\nChange In Youth CIC`;
    
    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    try {
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
      } else {
        Alert.alert("Error", "Unable to open email client");
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open email");
    }
  };
  
  const handleViewDetails = (form: any) => {
    setSelectedForm(form);
    setShowDetailModal(true);
  };
  
  const handleMarkReceived = async () => {
    if (!selectedForm || !receivedBy || !storedIn) {
      Alert.alert("Required Fields", "Please fill in all fields");
      return;
    }
    
    try {
      await markAsReceived.mutateAsync({
        id: selectedForm.id,
        receivedBy,
        storedIn,
      });
      
      Alert.alert("Success", "Consent form marked as received");
      setShowReceiveModal(false);
      setReceivedBy("");
      setStoredIn("");
      utils.consent.getAllConsentForms.invalidate();
    } catch (error) {
      Alert.alert("Error", "Failed to mark as received");
    }
  };
  
  return (
    <ScreenContainer className="p-4">
      <ScrollView>
        <View className="mb-4">
          <Pressable
            onPress={() => router.back()}
            className="mb-4"
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text className="text-primary text-base">← Back</Text>
          </Pressable>
          
          <Text className="text-2xl font-bold text-foreground mb-2">
            Consent Forms
          </Text>
          <Text className="text-base text-muted">
            Manage parent/guardian consent forms
          </Text>
        </View>
        
        {/* Project Filter */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-3">
            Filter by Project:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
            <Pressable
              onPress={() => setSelectedProject(null)}
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedProject === null ? "bg-primary" : "bg-surface border border-border"
              }`}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedProject === null ? "text-background" : "text-foreground"
                }`}
              >
                All Projects
              </Text>
            </Pressable>
            
            {projects?.map((project) => (
              <Pressable
                key={project.id}
                onPress={() => setSelectedProject(project.id)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  selectedProject === project.id
                    ? "bg-primary"
                    : "bg-surface border border-border"
                }`}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedProject === project.id ? "text-background" : "text-foreground"
                  }`}
                >
                  {project.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        
        {/* School Filter */}
        <View className="mb-4">
          <Text className="text-sm font-semibold text-foreground mb-3">
            Filter by School:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
            <Pressable
              onPress={() => setSelectedSchool(null)}
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedSchool === null ? "bg-primary" : "bg-surface border border-border"
              }`}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedSchool === null ? "text-background" : "text-foreground"
                }`}
              >
                All Schools
              </Text>
            </Pressable>
            
            {uniqueSchools.map((school) => (
              <Pressable
                key={school}
                onPress={() => setSelectedSchool(school)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  selectedSchool === school
                    ? "bg-primary"
                    : "bg-surface border border-border"
                }`}
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedSchool === school ? "text-background" : "text-foreground"
                  }`}
                >
                  {school}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
        
        {/* Generate Links Section */}
        <View className="bg-surface rounded-xl p-4 mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Generate Consent Form Link
          </Text>
          <Text className="text-sm text-muted mb-4">
            Share consent form links with parents/guardians
          </Text>
          
          {projects?.map((project) => (
            <View
              key={project.id}
              className="flex-row items-center justify-between py-3 border-b border-border"
            >
              <Text className="text-sm font-medium text-foreground flex-1">
                {project.name}
              </Text>
              <View className="flex-row gap-2 flex-wrap">
                <Pressable
                  onPress={() => {
                    setQrProjectId(project.id);
                    setShowQRModal(true);
                  }}
                  className="bg-primary px-3 py-2 rounded-lg"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text className="text-foreground text-xs font-semibold">QR Code</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleCopyLink(project.id)}
                  className="bg-primary px-3 py-2 rounded-lg"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text className="text-foreground text-xs font-semibold">Copy</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleEmailLink(project.id)}
                  className="bg-primary px-3 py-2 rounded-lg"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text className="text-foreground text-xs font-semibold">Email</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleShareLink(project.id)}
                  className="bg-primary px-3 py-2 rounded-lg"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <Text className="text-foreground text-xs font-semibold">Share</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </View>
        
        {/* Submitted Forms */}
        <View className="mb-4">
          <Text className="text-lg font-semibold text-foreground mb-3">
            Submitted Forms ({filteredForms?.length || 0})
          </Text>
          
          {filteredForms && filteredForms.length > 0 ? (
            <View className="gap-3">
              {filteredForms.map((form) => {
                const project = projects?.find((p) => p.id === form.projectId);
                return (
                  <View
                    key={form.id}
                    className="bg-surface rounded-xl p-4 border border-border"
                  >
                    <View className="flex-row items-start justify-between mb-3">
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-foreground mb-1">
                          {form.childFullName}
                        </Text>
                        <Text className="text-sm text-muted leading-relaxed">
                          Parent: {form.parentGuardianFullName}
                        </Text>
                        <Text className="text-sm text-muted leading-relaxed">
                          School: {form.schoolName || "Not specified"}
                        </Text>
                        {form.yearGroup && (
                          <Text className="text-sm text-muted leading-relaxed">
                            Year: {form.yearGroup}
                          </Text>
                        )}
                        <Text className="text-sm text-muted leading-relaxed">
                          Project: {project?.name || "Unknown"}
                        </Text>
                      </View>
                      {form.receivedBy && (
                        <View className="bg-success/20 px-3 py-1 rounded-full">
                          <Text className="text-success text-xs font-semibold">Received</Text>
                        </View>
                      )}
                    </View>
                    
                    <View className="flex-row items-center gap-2 mb-3">
                      <Text className="text-xs text-muted leading-relaxed">
                        Submitted: {new Date(form.submittedAt).toLocaleDateString()}
                      </Text>
                      {form.photographsPermission && (
                        <View className="bg-primary/20 px-2 py-1 rounded">
                          <Text className="text-primary text-xs">📷 Photos</Text>
                        </View>
                      )}
                      {form.videoPermission && (
                        <View className="bg-primary/20 px-2 py-1 rounded">
                          <Text className="text-primary text-xs">🎥 Video</Text>
                        </View>
                      )}
                    </View>
                    
                    <View className="flex-row gap-2">
                      <Pressable
                        onPress={() => handleViewDetails(form)}
                        className="flex-1 bg-primary px-4 py-3 rounded-full"
                        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                      >
                        <Text className="font-semibold text-center text-sm" style={{ color: '#000000' }}>
                          View Details
                        </Text>
                      </Pressable>
                      
                      {!form.receivedBy && (
                        <Pressable
                          onPress={() => {
                            setSelectedForm(form);
                            setShowReceiveModal(true);
                          }}
                          className="flex-1 bg-success px-4 py-3 rounded-full ml-2"
                          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                        >
                          <Text className="font-semibold text-center text-sm" style={{ color: '#000000' }}>
                            Mark Received
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View className="bg-surface rounded-xl p-8 items-center">
              <Text className="text-muted text-center">
                No consent forms submitted yet
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <ScreenContainer className="p-4">
          <ScrollView>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-2xl font-bold text-foreground">
                Consent Form Details
              </Text>
              <Pressable
                onPress={() => setShowDetailModal(false)}
                className="bg-surface px-4 py-2 rounded-lg"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text className="text-foreground font-semibold">Close</Text>
              </Pressable>
            </View>
            
            {selectedForm && (
              <View className="gap-4">
                <View className="bg-surface rounded-xl p-4">
                  <Text className="text-sm font-semibold text-muted mb-2">
                    Participant Details
                  </Text>
                  <Text className="text-base text-foreground mb-1">
                    <Text className="font-semibold">Child:</Text> {selectedForm.childFullName}
                  </Text>
                  <Text className="text-base text-foreground mb-1">
                    <Text className="font-semibold">DOB:</Text> {selectedForm.childDateOfBirth instanceof Date ? selectedForm.childDateOfBirth.toLocaleDateString() : selectedForm.childDateOfBirth}
                  </Text>
                  <Text className="text-base text-foreground mb-1">
                    <Text className="font-semibold">Parent/Guardian:</Text>{" "}
                    {selectedForm.parentGuardianFullName}
                  </Text>
                  <Text className="text-base text-foreground mb-1">
                    <Text className="font-semibold">Contact:</Text>{" "}
                    {selectedForm.parentGuardianContactNumber}
                  </Text>
                  <Text className="text-base text-foreground">
                    <Text className="font-semibold">Email:</Text> {selectedForm.parentGuardianEmail}
                  </Text>
                </View>
                
                <View className="bg-surface rounded-xl p-4">
                  <Text className="text-sm font-semibold text-muted mb-2">
                    Photography & Video Consent
                  </Text>
                  <Text className="text-base text-foreground">
                    {selectedForm.photographsPermission && "✓ Photographs allowed\n"}
                    {selectedForm.videoPermission && "✓ Video recordings allowed\n"}
                    {selectedForm.bothPermission && "✓ Both allowed\n"}
                    {selectedForm.noPermission && "✗ No permission given"}
                  </Text>
                </View>
                
                <View className="bg-surface rounded-xl p-4">
                  <Text className="text-sm font-semibold text-muted mb-2">
                    Use Permissions
                  </Text>
                  <Text className="text-sm font-semibold text-foreground mb-1">Internal:</Text>
                  <Text className="text-base text-foreground mb-2">
                    {selectedForm.internalUseEvaluation && "✓ Evaluation\n"}
                    {selectedForm.internalUseSafeguarding && "✓ Safeguarding\n"}
                    {selectedForm.internalUseTraining && "✓ Training"}
                  </Text>
                  <Text className="text-sm font-semibold text-foreground mb-1">External:</Text>
                  <Text className="text-base text-foreground">
                    {selectedForm.externalUseSocialMedia && "✓ Social Media\n"}
                    {selectedForm.externalUseWebsite && "✓ Website\n"}
                    {selectedForm.externalUsePrintedMaterials && "✓ Printed Materials\n"}
                    {selectedForm.externalUseFundingReports && "✓ Funding Reports\n"}
                    {selectedForm.externalUseLocalMedia && "✓ Local Media\n"}
                    {selectedForm.externalUseEducationalPresentations &&
                      "✓ Educational Presentations"}
                  </Text>
                </View>
                
                <View className="bg-surface rounded-xl p-4">
                  <Text className="text-sm font-semibold text-muted mb-2">
                    Identification Preference
                  </Text>
                  <Text className="text-base text-foreground">
                    {selectedForm.identificationType === "full_identification" &&
                      "Full identification allowed"}
                    {selectedForm.identificationType === "first_name_only" &&
                      "First name only"}
                    {selectedForm.identificationType === "anonymous" && "Anonymous"}
                    {selectedForm.identificationType === "no_identification" &&
                      "No identification"}
                  </Text>
                </View>
                
                {selectedForm.additionalInformation && (
                  <View className="bg-surface rounded-xl p-4">
                    <Text className="text-sm font-semibold text-muted mb-2">
                      Additional Information
                    </Text>
                    <Text className="text-base text-foreground">
                      {selectedForm.additionalInformation}
                    </Text>
                  </View>
                )}
                
                <View className="bg-surface rounded-xl p-4">
                  <Text className="text-sm font-semibold text-muted mb-2">
                    Consent Declaration
                  </Text>
                  <Text className="text-base text-foreground mb-1">
                    <Text className="font-semibold">Signed by:</Text>{" "}
                    {selectedForm.parentGuardianPrintedName}
                  </Text>
                  <Text className="text-base text-foreground">
                    <Text className="font-semibold">Date:</Text> {selectedForm.consentDate instanceof Date ? selectedForm.consentDate.toLocaleDateString() : selectedForm.consentDate}
                  </Text>
                </View>
                
                {selectedForm.receivedBy && (
                  <View className="bg-success/20 rounded-xl p-4">
                    <Text className="text-sm font-semibold text-success mb-2">
                      Change In Youth Confirmation
                    </Text>
                    <Text className="text-base text-foreground mb-1">
                      <Text className="font-semibold">Received by:</Text> {selectedForm.receivedBy}
                    </Text>
                    <Text className="text-base text-foreground mb-1">
                      <Text className="font-semibold">Date received:</Text>{" "}
                      {selectedForm.dateReceived}
                    </Text>
                    <Text className="text-base text-foreground">
                      <Text className="font-semibold">Stored in:</Text> {selectedForm.storedIn}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </ScreenContainer>
      </Modal>
      
      {/* Mark as Received Modal */}
      <Modal
        visible={showReceiveModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowReceiveModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background rounded-t-3xl p-6">
            <Text className="text-xl font-bold text-foreground mb-4">
              Mark as Received
            </Text>
            
            <View className="gap-4 mb-4">
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Received By *
                </Text>
                <TextInput
                  className="bg-surface rounded-xl p-4 text-foreground border border-border"
                  placeholder="Your name"
                  placeholderTextColor={colors.muted}
                  value={receivedBy}
                  onChangeText={setReceivedBy}
                />
              </View>
              
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Stored In *
                </Text>
                <TextInput
                  className="bg-surface rounded-xl p-4 text-foreground border border-border"
                  placeholder="e.g., Filing Cabinet A, Folder 2"
                  placeholderTextColor={colors.muted}
                  value={storedIn}
                  onChangeText={setStoredIn}
                />
              </View>
            </View>
            
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => {
                  setShowReceiveModal(false);
                  setReceivedBy("");
                  setStoredIn("");
                }}
                className="flex-1 bg-surface border border-border px-6 py-4 rounded-full"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text className="text-foreground font-semibold text-center">Cancel</Text>
              </Pressable>
              
              <Pressable
                onPress={handleMarkReceived}
                className="flex-1 bg-primary px-6 py-4 rounded-full"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text className="text-background font-semibold text-center">Confirm</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowQRModal(false)}
      >
        <ScreenContainer className="p-6">
          <View className="flex-1 items-center justify-center">
            <View className="items-center gap-4">
              <Text className="text-2xl font-bold text-foreground text-center leading-tight">
                Scan QR Code
              </Text>
              <Text className="text-base text-muted text-center leading-relaxed">
                {projects?.find((p) => p.id === qrProjectId)?.name}
              </Text>
              
              {qrProjectId && (
                <View className="bg-white p-6 rounded-2xl">
                  <QRCode
                    value={getConsentFormUrl(qrProjectId)}
                    size={250}
                  />
                </View>
              )}
              
              <Text className="text-sm text-muted text-center max-w-xs">
                Parents can scan this QR code with their phone camera to open the consent form
              </Text>
              
              <Pressable
                onPress={() => setShowQRModal(false)}
                className="bg-primary px-6 py-4 rounded-full mt-4"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <Text className="text-foreground font-semibold">Close</Text>
              </Pressable>
            </View>
          </View>
        </ScreenContainer>
      </Modal>
    </ScreenContainer>
  );
}
