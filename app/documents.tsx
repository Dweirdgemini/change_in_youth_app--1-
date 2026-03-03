import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput, Modal, ScrollView, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuth } from "@/hooks/use-auth";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { useColors } from "@/hooks/use-colors";
import * as DocumentPicker from "expo-document-picker";

export default function DocumentsScreen() {
  const colors = useColors();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { data: documents, isLoading, refetch } = trpc.documents.listDocuments.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    description: "",
    type: "resource" as "register" | "evaluation_form" | "consent_form" | "resource",
    fileUri: "",
    fileName: "",
  });

  const uploadDocumentMutation = trpc.documents.uploadDocument.useMutation();

  if (authLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  if (!isAuthenticated) {
    return (
      <ScreenContainer className="p-4 justify-center">
        <View className="items-center gap-4">
          <Text className="text-2xl font-bold text-foreground text-center leading-tight">
            Sign in to access documents
          </Text>
          <TouchableOpacity
            className="bg-primary px-6 py-4 rounded-full mt-4 active:opacity-80"
            onPress={() => router.push("/login" as any)}
          >
            <Text className="text-background font-semibold text-lg">Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "register":
        return "📋";
      case "evaluation_form":
        return "📝";
      case "consent_form":
        return "✅";
      case "resource":
        return "📚";
      default:
        return "📄";
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "register":
        return "Register";
      case "evaluation_form":
        return "Evaluation Form";
      case "consent_form":
        return "Consent Form";
      case "resource":
        return "Resource";
      default:
        return "Document";
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const file = result.assets[0];
        setUploadForm(prev => ({
          ...prev,
          fileUri: file.uri,
          fileName: file.name,
        }));
      }
    } catch (error) {
      if (Platform.OS === "web") {
        alert("Error picking document. Please try again.");
      } else {
        Alert.alert("Error", "Failed to pick document. Please try again.");
      }
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.title.trim()) {
      if (Platform.OS === "web") {
        alert("Please enter a document title");
      } else {
        Alert.alert("Validation Error", "Please enter a document title");
      }
      return;
    }

    if (!uploadForm.fileUri) {
      if (Platform.OS === "web") {
        alert("Please select a file to upload");
      } else {
        Alert.alert("Validation Error", "Please select a file to upload");
      }
      return;
    }

    try {
      // For now, use a placeholder URL. In production, upload to S3 first.
      const fileUrl = uploadForm.fileUri || `https://placeholder.com/documents/${uploadForm.fileName}`;

      await uploadDocumentMutation.mutateAsync({
        title: uploadForm.title.trim(),
        description: uploadForm.description.trim(),
        documentType: uploadForm.type,
        fileUrl: fileUrl,
      });

      if (Platform.OS === "web") {
        alert("Document uploaded successfully!");
      } else {
        Alert.alert("Success", "Document uploaded successfully!");
      }

      setShowUploadModal(false);
      setUploadForm({
        title: "",
        description: "",
        type: "resource",
        fileUri: "",
        fileName: "",
      });
      refetch();
    } catch (error: any) {
      if (Platform.OS === "web") {
        alert(`Error uploading document: ${error.message}`);
      } else {
        Alert.alert("Error", `Failed to upload document: ${error.message}`);
      }
    }
  };

  const handleDownload = (doc: any) => {
    if (Platform.OS === "web") {
      if (confirm(`Would you like to download "${doc.title}"?`)) {
        if (doc.fileUrl) {
          window.open(doc.fileUrl, "_blank");
        } else {
          alert("Document URL not available");
        }
      }
    } else {
      Alert.alert(
        "Download Document",
        `Would you like to download "${doc.title}"?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Download",
            onPress: () => {
              if (doc.fileUrl) {
                // Open document URL
                Alert.alert("Success", "Opening document...");
              } else {
                Alert.alert("Error", "Document URL not available");
              }
            },
          },
        ]
      );
    }
  };

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="p-6 pb-4">
          <View className="flex-row items-center justify-between mb-2">
            
            {isAdmin && (
              <TouchableOpacity
                className="bg-primary px-4 py-2 rounded-full active:opacity-80"
                onPress={() => setShowUploadModal(true)}
              >
                <Text className="text-background font-semibold text-sm">+ Upload</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text className="text-2xl font-bold text-foreground">Documents</Text>
          <Text className="text-base text-muted mt-1">Forms, registers & resources</Text>
        </View>

        {/* Content */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" />
            <Text className="text-muted mt-4">Loading documents...</Text>
          </View>
        ) : !documents || documents.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-6xl mb-4">📄</Text>
            <Text className="text-xl font-semibold text-foreground text-center">
              No Documents Yet
            </Text>
            <Text className="text-base text-muted text-center mt-2">
              {isAdmin ? "Upload documents using the + Upload button" : "Documents will appear here once they're uploaded"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={documents}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 24, paddingTop: 0, gap: 12 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
                onPress={() => handleDownload(item)}
              >
                <View className="flex-row items-start gap-3">
                  <Text className="text-3xl">{getDocumentIcon(item.type)}</Text>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">
                      {item.title}
                    </Text>
                    {item.description && (
                      <Text className="text-sm text-muted mt-1" numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                    <View className="flex-row items-center gap-2 mt-2">
                      <View className="bg-primary/10 px-3 py-1 rounded-full">
                        <Text className="text-primary text-xs font-medium">
                          {getDocumentTypeLabel(item.type)}
                        </Text>
                      </View>
                      <Text className="text-xs text-muted leading-relaxed">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-primary text-xl">→</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6" style={{ maxHeight: "90%" }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="gap-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-2xl font-bold text-foreground">Upload Document</Text>
                  <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                    <Text className="text-muted text-2xl">×</Text>
                  </TouchableOpacity>
                </View>

                {/* Document Title */}
                <View>
                  <Text className="text-base font-semibold text-foreground mb-2">Title *</Text>
                  <TextInput
                    value={uploadForm.title}
                    onChangeText={(text) => setUploadForm(prev => ({ ...prev, title: text }))}
                    placeholder="e.g., Session Register Template"
                    placeholderTextColor={colors.muted}
                    className="bg-surface border border-border rounded-xl p-4 text-base text-foreground"
                  />
                </View>

                {/* Description */}
                <View>
                  <Text className="text-base font-semibold text-foreground mb-2">Description (Optional)</Text>
                  <TextInput
                    value={uploadForm.description}
                    onChangeText={(text) => setUploadForm(prev => ({ ...prev, description: text }))}
                    placeholder="Brief description of the document"
                    placeholderTextColor={colors.muted}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                    className="bg-surface border border-border rounded-xl p-4 text-base text-foreground"
                    style={{ minHeight: 80 }}
                  />
                </View>

                {/* Document Type */}
                <View>
                  <Text className="text-base font-semibold text-foreground mb-2">Document Type *</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {(["register", "evaluation_form", "consent_form", "resource"] as const).map((type) => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => setUploadForm(prev => ({ ...prev, type }))}
                        className={`px-4 py-2 rounded-full border ${
                          uploadForm.type === type
                            ? "bg-primary border-primary"
                            : "bg-surface border-border"
                        }`}
                      >
                        <Text
                          className={`text-sm font-medium ${
                            uploadForm.type === type ? "text-background" : "text-foreground"
                          }`}
                        >
                          {getDocumentTypeLabel(type)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* File Picker */}
                <View>
                  <Text className="text-base font-semibold text-foreground mb-2">File *</Text>
                  <TouchableOpacity
                    onPress={handlePickDocument}
                    className="bg-surface border border-border rounded-xl p-4 active:opacity-70"
                  >
                    {uploadForm.fileName ? (
                      <View className="flex-row items-center gap-2">
                        <Text className="text-2xl">📎</Text>
                        <Text className="text-base text-foreground flex-1" numberOfLines={1}>
                          {uploadForm.fileName}
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-base text-muted text-center leading-relaxed">
                        Tap to select a file
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-3 mt-4">
                  <TouchableOpacity
                    onPress={() => setShowUploadModal(false)}
                    className="flex-1 bg-surface border border-border rounded-full py-4"
                    activeOpacity={0.7}
                  >
                    <Text className="text-center text-foreground font-semibold text-base">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleUpload}
                    className="flex-1 bg-primary rounded-full py-4"
                    activeOpacity={0.7}
                    disabled={uploadDocumentMutation.isPending}
                  >
                    <Text className="text-center text-background font-semibold text-base">
                      {uploadDocumentMutation.isPending ? "Uploading..." : "Upload"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
