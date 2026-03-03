import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { DatePickerInput } from "@/components/date-picker-input";
import { useLocalSearchParams, router } from "expo-router";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";


/**
 * Public Consent Form Submission Page
 * 
 * Accessible via: changein://consent/[projectId] or web link
 * Parents/guardians can fill out and submit consent forms
 * No authentication required - public access
 */
export default function ConsentFormScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const colors = useColors();
  
  // Section 1: Participant Details
  const [childFullName, setChildFullName] = useState("");
  const [childDateOfBirth, setChildDateOfBirth] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [parentGuardianFullName, setParentGuardianFullName] = useState("");
  const [parentGuardianContactNumber, setParentGuardianContactNumber] = useState("");
  const [parentGuardianEmail, setParentGuardianEmail] = useState("");
  
  // Section 2: Photography and Video Consent
  const [consentType, setConsentType] = useState<"photographs" | "video" | "both" | "none">("none");
  
  // Section 3: Use of Images
  const [internalUseEvaluation, setInternalUseEvaluation] = useState(false);
  const [internalUseSafeguarding, setInternalUseSafeguarding] = useState(false);
  const [internalUseTraining, setInternalUseTraining] = useState(false);
  const [externalUseSocialMedia, setExternalUseSocialMedia] = useState(false);
  const [externalUseWebsite, setExternalUseWebsite] = useState(false);
  const [externalUsePrintedMaterials, setExternalUsePrintedMaterials] = useState(false);
  const [externalUseFundingReports, setExternalUseFundingReports] = useState(false);
  const [externalUseLocalMedia, setExternalUseLocalMedia] = useState(false);
  const [externalUseEducationalPresentations, setExternalUseEducationalPresentations] = useState(false);
  const [usePermissionType, setUsePermissionType] = useState<"internal_only" | "internal_and_external" | "internal_and_specific">("internal_only");
  const [specificExternalUses, setSpecificExternalUses] = useState("");
  
  // Section 4: Identification
  const [identificationType, setIdentificationType] = useState<"full_identification" | "first_name_only" | "anonymous" | "no_identification">("anonymous");
  
  // Section 5: Third-Party Sharing
  const [thirdPartySharing, setThirdPartySharing] = useState(false);
  
  // Section 6: Data Protection
  const [dataProtectionConfirmed, setDataProtectionConfirmed] = useState(false);
  
  // Section 8: Safeguarding
  const [safeguardingConfirmed, setSafeguardingConfirmed] = useState(false);
  
  // Section 9: Additional Information
  const [additionalInformation, setAdditionalInformation] = useState("");
  
  // Section 10: Consent Declaration
  const [parentGuardianPrintedName, setParentGuardianPrintedName] = useState("");
  const [consentDate, setConsentDate] = useState(new Date().toISOString().split("T")[0]);
  
  // Section 11: Second Parent/Guardian
  const [secondParentGuardianPrintedName, setSecondParentGuardianPrintedName] = useState("");
  const [secondParentConsentDate, setSecondParentConsentDate] = useState("");
  
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  
  const submitConsent = trpc.consent.submitConsentForm.useMutation();
  
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!childFullName || !childDateOfBirth || !schoolName || !parentGuardianFullName || !parentGuardianContactNumber || !parentGuardianEmail) {
          Alert.alert("Required Fields", "Please fill in all participant details including school name");
          return false;
        }
        break;
      case 2:
        if (consentType === "none") {
          Alert.alert("Required Selection", "Please select a consent option");
          return false;
        }
        break;
      case 5:
        if (!dataProtectionConfirmed) {
          Alert.alert("Required Confirmation", "Please confirm you have read the data protection information");
          return false;
        }
        if (!safeguardingConfirmed) {
          Alert.alert("Required Confirmation", "Please confirm the safeguarding declaration");
          return false;
        }
        break;
      case 6:
        if (!parentGuardianPrintedName) {
          Alert.alert("Required Field", "Please enter your printed name");
          return false;
        }
        break;
    }
    return true;
  };
  
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };
  
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    console.log('[Consent Form] Attempting to submit...');
    
    try {
      const payload = {
        projectId: parseInt(projectId),
        childFullName,
        childDateOfBirth,
        schoolName,
        yearGroup: yearGroup || undefined,
        parentGuardianFullName,
        parentGuardianContactNumber,
        parentGuardianEmail,
        photographsPermission: consentType === "photographs" || consentType === "both",
        videoPermission: consentType === "video" || consentType === "both",
        bothPermission: consentType === "both",
        noPermission: consentType === "none",
        internalUseEvaluation,
        internalUseSafeguarding,
        internalUseTraining,
        externalUseSocialMedia,
        externalUseWebsite,
        externalUsePrintedMaterials,
        externalUseFundingReports,
        externalUseLocalMedia,
        externalUseEducationalPresentations,
        usePermissionType,
        specificExternalUses: specificExternalUses || undefined,
        identificationType,
        thirdPartySharing,
        dataProtectionConfirmed,
        safeguardingConfirmed,
        additionalInformation: additionalInformation || undefined,
        parentGuardianPrintedName,
        consentDate,
        secondParentGuardianPrintedName: secondParentGuardianPrintedName || undefined,
        secondParentConsentDate: secondParentConsentDate || undefined,
      };
      
      console.log('[Consent Form] Payload:', JSON.stringify(payload, null, 2));
      
      const result = await submitConsent.mutateAsync(payload);
      
      console.log('[Consent Form] Success!', result);
      
      // Web-compatible success message
      if (Platform.OS === 'web') {
        alert('✅ Consent form submitted successfully! Thank you for completing the form.');
        window.location.reload();
      } else {
        Alert.alert(
          "Success",
          "Consent form submitted successfully. Thank you!",
          [{ text: "OK", onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('[Consent Form] Submit error:', error);
      const errorMsg = `Failed to submit consent form. ${error instanceof Error ? error.message : 'Please try again.'}`;
      if (Platform.OS === 'web') {
        alert('❌ ' + errorMsg);
      } else {
        Alert.alert("Error", errorMsg);
      }
    }
  };
  
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <View>
            <Text className="text-2xl font-bold text-foreground mb-2">
              Participant Details
            </Text>
            <Text className="text-sm text-muted mb-4">
              Section 1 of 6
            </Text>
            
            <View className="gap-4">
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Child's Full Name *
                </Text>
                <TextInput
                  className="bg-surface rounded-xl p-4 text-foreground border border-border"
                  placeholder="Enter child's full name"
                  placeholderTextColor={colors.muted}
                  value={childFullName}
                  onChangeText={setChildFullName}
                />
              </View>
              
              <DatePickerInput
                label="Date of Birth"
                value={childDateOfBirth}
                onChange={setChildDateOfBirth}
                required
                maxDate={new Date()} // Cannot select future dates
              />
              
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  School Name *
                </Text>
                <TextInput
                  className="bg-surface rounded-xl p-4 text-foreground border border-border"
                  placeholder="Enter school name"
                  placeholderTextColor={colors.muted}
                  value={schoolName}
                  onChangeText={setSchoolName}
                />
              </View>
              
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Year Group (Optional)
                </Text>
                <TextInput
                  className="bg-surface rounded-xl p-4 text-foreground border border-border"
                  placeholder="e.g., Year 7, Year 10"
                  placeholderTextColor={colors.muted}
                  value={yearGroup}
                  onChangeText={setYearGroup}
                />
              </View>
              
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Parent/Guardian Full Name *
                </Text>
                <TextInput
                  className="bg-surface rounded-xl p-4 text-foreground border border-border"
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.muted}
                  value={parentGuardianFullName}
                  onChangeText={setParentGuardianFullName}
                />
              </View>
              
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Contact Number *
                </Text>
                <TextInput
                  className="bg-surface rounded-xl p-4 text-foreground border border-border"
                  placeholder="Enter contact number"
                  placeholderTextColor={colors.muted}
                  value={parentGuardianContactNumber}
                  onChangeText={setParentGuardianContactNumber}
                  keyboardType="phone-pad"
                />
              </View>
              
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Email Address *
                </Text>
                <TextInput
                  className="bg-surface rounded-xl p-4 text-foreground border border-border"
                  placeholder="Enter email address"
                  placeholderTextColor={colors.muted}
                  value={parentGuardianEmail}
                  onChangeText={setParentGuardianEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          </View>
        );
      
      case 2:
        return (
          <View>
            <Text className="text-2xl font-bold text-foreground mb-2">
              Photography & Video Consent
            </Text>
            <Text className="text-sm text-muted mb-4">
              Section 2 of 6
            </Text>
            
            <Text className="text-sm text-foreground mb-4">
              I give permission for Change In Youth to take photographs and/or video recordings of my child during the Wellbeing Champions Programme activities.
            </Text>
            
            <View className="gap-3">
              {[
                { value: "photographs", label: "I give permission for photographs to be taken" },
                { value: "video", label: "I give permission for video recordings to be taken" },
                { value: "both", label: "I give permission for both photographs and video recordings" },
                { value: "none", label: "I do NOT give permission for any photography or video recording" },
              ].map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setConsentType(option.value as any)}
                  className={`p-4 rounded-xl border-2 ${
                    consentType === option.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-surface"
                  }`}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <View className="flex-row items-center">
                    <View
                      className={`w-5 h-5 rounded-full border-2 mr-3 ${
                        consentType === option.value
                          ? "border-primary bg-primary"
                          : "border-border"
                      }`}
                    />
                    <Text className="text-sm text-foreground flex-1">
                      {option.label}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        );
      
      case 3:
        return (
          <View>
            <Text className="text-2xl font-bold text-foreground mb-2">
              Use of Images & Recordings
            </Text>
            <Text className="text-sm text-muted mb-4">
              Section 3 of 6
            </Text>
            
            <Text className="text-base font-semibold text-foreground mb-3">
              Internal Use:
            </Text>
            <View className="gap-3 mb-4">
              {[
                { state: internalUseEvaluation, setState: setInternalUseEvaluation, label: "Programme evaluation and monitoring" },
                { state: internalUseSafeguarding, setState: setInternalUseSafeguarding, label: "Safeguarding and child protection purposes" },
                { state: internalUseTraining, setState: setInternalUseTraining, label: "Internal training and staff development" },
              ].map((item, index) => (
                <Pressable
                  key={index}
                  onPress={() => item.setState(!item.state)}
                  className="flex-row items-center p-3 rounded-xl bg-surface"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <View
                    className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                      item.state ? "border-primary bg-primary" : "border-border"
                    }`}
                  >
                    {item.state && <Text className="text-background font-bold">✓</Text>}
                  </View>
                  <Text className="text-sm text-foreground flex-1">{item.label}</Text>
                </Pressable>
              ))}
            </View>
            
            <Text className="text-base font-semibold text-foreground mb-3">
              External Use:
            </Text>
            <View className="gap-3">
              {[
                { state: externalUseSocialMedia, setState: setExternalUseSocialMedia, label: "Social media promotion" },
                { state: externalUseWebsite, setState: setExternalUseWebsite, label: "Website and digital platforms" },
                { state: externalUsePrintedMaterials, setState: setExternalUsePrintedMaterials, label: "Printed materials" },
                { state: externalUseFundingReports, setState: setExternalUseFundingReports, label: "Funding reports" },
                { state: externalUseLocalMedia, setState: setExternalUseLocalMedia, label: "Local media and press releases" },
                { state: externalUseEducationalPresentations, setState: setExternalUseEducationalPresentations, label: "Educational presentations" },
              ].map((item, index) => (
                <Pressable
                  key={index}
                  onPress={() => item.setState(!item.state)}
                  className="flex-row items-center p-3 rounded-xl bg-surface"
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <View
                    className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                      item.state ? "border-primary bg-primary" : "border-border"
                    }`}
                  >
                    {item.state && <Text className="text-background font-bold">✓</Text>}
                  </View>
                  <Text className="text-sm text-foreground flex-1">{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        );
      
      case 4:
        return (
          <View>
            <Text className="text-2xl font-bold text-foreground mb-2">
              Identification & Third-Party Sharing
            </Text>
            <Text className="text-sm text-muted mb-4">
              Section 4-5 of 6
            </Text>
            
            <Text className="text-base font-semibold text-foreground mb-3">
              Identification Preference:
            </Text>
            <View className="gap-3 mb-4">
              {[
                { value: "full_identification", label: "Full identification: My child's name and image can be used together" },
                { value: "first_name_only", label: "First name only: Only my child's first name can be used with their image" },
                { value: "anonymous", label: "Anonymous: My child's image can be used but without any identifying information" },
                { value: "no_identification", label: "No identification: I do not consent to any use of my child's image" },
              ].map((option) => (
                <Pressable
                  key={option.value}
                  onPress={() => setIdentificationType(option.value as any)}
                  className={`p-4 rounded-xl border-2 ${
                    identificationType === option.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-surface"
                  }`}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <View className="flex-row items-center">
                    <View
                      className={`w-5 h-5 rounded-full border-2 mr-3 ${
                        identificationType === option.value
                          ? "border-primary bg-primary"
                          : "border-border"
                      }`}
                    />
                    <Text className="text-sm text-foreground flex-1">
                      {option.label}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
            
            <Text className="text-base font-semibold text-foreground mb-3">
              Third-Party Sharing:
            </Text>
            <Text className="text-sm text-muted mb-3">
              Images may be shared with SNG (Spirit of 2012), TNLCF (The National Lottery Community Fund), and DCMS (Department for Culture, Media & Sport) for reporting and evaluation purposes.
            </Text>
            <Pressable
              onPress={() => setThirdPartySharing(!thirdPartySharing)}
              className="flex-row items-center p-4 rounded-xl bg-surface"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View
                className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                  thirdPartySharing ? "border-primary bg-primary" : "border-border"
                }`}
              >
                {thirdPartySharing && <Text className="text-background font-bold">✓</Text>}
              </View>
              <Text className="text-sm text-foreground flex-1">
                I give permission for images to be shared with funding bodies
              </Text>
            </Pressable>
          </View>
        );
      
      case 5:
        return (
          <View>
            <Text className="text-2xl font-bold text-foreground mb-2">
              Data Protection & Safeguarding
            </Text>
            <Text className="text-sm text-muted mb-4">
              Section 6-8 of 6
            </Text>
            
            <View className="bg-surface rounded-xl p-4 mb-4">
              <Text className="text-sm text-foreground mb-2">
                • Your child's data will be processed in accordance with UK GDPR
              </Text>
              <Text className="text-sm text-foreground mb-2">
                • Images will be stored securely
              </Text>
              <Text className="text-sm text-foreground mb-2">
                • You can request removal at any time
              </Text>
              <Text className="text-sm text-foreground">
                • Contact: deji@changeinyouth.org.uk or 07539445064
              </Text>
            </View>
            
            <View className="gap-4">
              <Pressable
                onPress={() => setDataProtectionConfirmed(!dataProtectionConfirmed)}
                className="flex-row items-center p-4 rounded-xl bg-surface"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View
                  className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                    dataProtectionConfirmed ? "border-primary bg-primary" : "border-border"
                  }`}
                >
                  {dataProtectionConfirmed && <Text className="text-background font-bold">✓</Text>}
                </View>
                <Text className="text-sm text-foreground flex-1">
                  I confirm I have read and understood the data protection information *
                </Text>
              </Pressable>
              
              <Pressable
                onPress={() => setSafeguardingConfirmed(!safeguardingConfirmed)}
                className="flex-row items-center p-4 rounded-xl bg-surface"
                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              >
                <View
                  className={`w-6 h-6 rounded border-2 mr-3 items-center justify-center ${
                    safeguardingConfirmed ? "border-primary bg-primary" : "border-border"
                  }`}
                >
                  {safeguardingConfirmed && <Text className="text-background font-bold">✓</Text>}
                </View>
                <Text className="text-sm text-foreground flex-1">
                  I confirm I am the parent/legal guardian and understand safeguarding procedures *
                </Text>
              </Pressable>
              
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Additional Information (Optional)
                </Text>
                <TextInput
                  className="bg-surface rounded-xl p-4 text-foreground border border-border"
                  placeholder="Any additional information, special needs, or concerns..."
                  placeholderTextColor={colors.muted}
                  value={additionalInformation}
                  onChangeText={setAdditionalInformation}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>
        );
      
      case 6:
        return (
          <View>
            <Text className="text-2xl font-bold text-foreground mb-2">
              Consent Declaration
            </Text>
            <Text className="text-sm text-muted mb-4">
              Final Step - Section 10-11 of 6
            </Text>
            
            <View className="bg-surface rounded-xl p-4 mb-4">
              <Text className="text-sm text-foreground mb-2">
                I have read and understood this consent form. I understand that:
              </Text>
              <Text className="text-sm text-muted mb-1">
                • My consent is voluntary and can be withdrawn at any time
              </Text>
              <Text className="text-sm text-muted mb-1">
                • Refusing consent will not affect my child's participation
              </Text>
              <Text className="text-sm text-muted leading-relaxed">
                • All images will be handled responsibly
              </Text>
            </View>
            
            <View className="gap-4">
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Parent/Guardian Printed Name *
                </Text>
                <TextInput
                  className="bg-surface rounded-xl p-4 text-foreground border border-border"
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.muted}
                  value={parentGuardianPrintedName}
                  onChangeText={setParentGuardianPrintedName}
                />
              </View>
              
              <View>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  Date
                </Text>
                <TextInput
                  className="bg-surface rounded-xl p-4 text-foreground border border-border"
                  value={consentDate}
                  editable={false}
                />
              </View>
              
              <View className="border-t border-border pt-4 mt-2">
                <Text className="text-base font-semibold text-foreground mb-3">
                  Second Parent/Guardian (Optional)
                </Text>
                
                <View className="gap-4">
                  <View>
                    <Text className="text-sm font-semibold text-foreground mb-2">
                      Second Parent/Guardian Name
                    </Text>
                    <TextInput
                      className="bg-surface rounded-xl p-4 text-foreground border border-border"
                      placeholder="Enter second parent/guardian name"
                      placeholderTextColor={colors.muted}
                      value={secondParentGuardianPrintedName}
                      onChangeText={setSecondParentGuardianPrintedName}
                    />
                  </View>
                  
                  <View>
                    <Text className="text-sm font-semibold text-foreground mb-2">
                      Date
                    </Text>
                    <TextInput
                      className="bg-surface rounded-xl p-4 text-foreground border border-border"
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={colors.muted}
                      value={secondParentConsentDate}
                      onChangeText={setSecondParentConsentDate}
                    />
                  </View>
                </View>
              </View>
            </View>
          </View>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Top Back Button */}
        <View className="px-4 pt-4 pb-2">
          <Pressable
            onPress={() => router.back()}
            className="flex-row items-center gap-2 w-fit"
            style={({ pressed }) => ({
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <Text className="text-lg" style={{ color: colors.primary }}>
              ←
            </Text>
            <Text className="text-base font-semibold" style={{ color: colors.primary }}>
              Back
            </Text>
          </Pressable>
        </View>
        
        <ScrollView className="flex-1 p-4">
          <View className="mb-4">
            <Text className="text-2xl font-bold text-foreground mb-2">
              Parent/Guardian Consent Form
            </Text>
            <Text className="text-base text-muted">
              Change In Youth – Wellbeing Champions Programme
            </Text>
          </View>
          
          {/* Progress Indicator */}
          <View className="flex-row mb-8">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <View
                key={index}
                className="flex-1 h-2 rounded-full mx-1"
                style={{
                  backgroundColor: index < currentStep ? colors.primary : colors.border,
                }}
              />
            ))}
          </View>
          
          {renderStep()}
        </ScrollView>
        
        {/* Navigation Buttons - Fixed at bottom */}
        <View 
          style={{
            padding: 16,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {currentStep > 1 && (
              <Pressable
                onPress={handleBack}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                  borderRadius: 9999,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ 
                  color: colors.foreground, 
                  fontWeight: '600', 
                  textAlign: 'center',
                  fontSize: 16,
                }}>
                  Back
                </Text>
              </Pressable>
            )}
            
            {currentStep < totalSteps ? (
              <Pressable
                onPress={handleNext}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: colors.primary,
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                  borderRadius: 9999,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ 
                  color: colors.background, 
                  fontWeight: '600', 
                  textAlign: 'center',
                  fontSize: 16,
                }}>
                  Next
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleSubmit}
                style={({ pressed }) => ({
                  flex: 1,
                  backgroundColor: colors.primary,
                  paddingHorizontal: 24,
                  paddingVertical: 16,
                  borderRadius: 9999,
                  opacity: pressed ? 0.7 : 1,
                })}
                disabled={submitConsent.isPending}
              >
                <Text style={{ 
                  color: colors.background, 
                  fontWeight: '600', 
                  textAlign: 'center',
                  fontSize: 16,
                }}>
                  {submitConsent.isPending ? "Submitting..." : "Submit Consent Form"}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
