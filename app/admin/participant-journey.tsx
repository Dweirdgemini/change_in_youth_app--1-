import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";
import { router } from "expo-router";

export default function ParticipantJourneyScreen() {
  const colors = useColors();
  const [selectedParticipant, setSelectedParticipant] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newInteraction, setNewInteraction] = useState({
    type: "note" as any,
    title: "",
    description: "",
    notes: "",
  });

  const { data: participants } = trpc.participantJourney.getAllParticipants.useQuery();
  const { data: journey, refetch: refetchJourney } = trpc.participantJourney.getParticipantJourney.useQuery(
    { participantId: selectedParticipant! },
    { enabled: !!selectedParticipant }
  );
  const logMutation = trpc.participantJourney.logInteraction.useMutation();

  const interactionTypes = [
    { value: "outreach", label: "Outreach", color: "#3B82F6" },
    { value: "survey", label: "Survey", color: "#8B5CF6" },
    { value: "app_download", label: "App Download", color: "#10B981" },
    { value: "mentoring", label: "Mentoring", color: "#F59E0B" },
    { value: "meeting", label: "Meeting", color: "#EF4444" },
    { value: "note", label: "Note", color: "#6B7280" },
    { value: "phone_call", label: "Phone Call", color: "#06B6D4" },
    { value: "email", label: "Email", color: "#8B5CF6" },
    { value: "workshop", label: "Workshop", color: "#10B981" },
    { value: "other", label: "Other", color: "#6B7280" },
  ];

  const handleAddInteraction = async () => {
    if (!selectedParticipant || !newInteraction.title) {
      alert("Please fill in required fields");
      return;
    }

    try {
      await logMutation.mutateAsync({
        participantId: selectedParticipant,
        interactionType: newInteraction.type,
        title: newInteraction.title,
        description: newInteraction.description,
        notes: newInteraction.notes,
      });
      setShowAddModal(false);
      setNewInteraction({ type: "note", title: "", description: "", notes: "" });
      refetchJourney();
    } catch (error: any) {
      alert(error.message || "Failed to add interaction");
    }
  };

  const getTypeColor = (type: string) => {
    return interactionTypes.find((t) => t.value === type)?.color || "#6B7280";
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="gap-4">
          {/* Header */}
          <View>
            <Text className="text-2xl font-bold text-foreground">Participant Journey</Text>
            <Text className="text-sm text-muted mt-1">
              Track all interactions and touchpoints
            </Text>
          </View>

          {/* Participant List */}
          {!selectedParticipant ? (
            <View>
              <Text className="text-xl font-bold text-foreground mb-3">
                Select Participant
              </Text>

              {!participants || participants.length === 0 ? (
                <View className="bg-surface rounded-2xl p-6 items-center border border-border">
                  <Text className="text-muted text-center">
                    No participants found
                  </Text>
                </View>
              ) : (
                <View className="gap-3">
                  {participants.map((participant) => (
                    <TouchableOpacity
                      key={participant.participantId}
                      onPress={() => setSelectedParticipant(participant.participantId)}
                      className="bg-surface rounded-2xl p-4 border border-border"
                    >
                      <View className="flex-row justify-between items-center">
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-foreground">
                            {participant.participantName}
                          </Text>
                          {participant.participantEmail && (
                            <Text className="text-sm text-muted mt-1">
                              {participant.participantEmail}
                            </Text>
                          )}
                        </View>
                        <View className="items-end">
                          <Text className="text-lg font-bold text-primary">
                            {participant.interactionCount}
                          </Text>
                          <Text className="text-xs text-muted leading-relaxed">interactions</Text>
                        </View>
                      </View>
                      {participant.lastInteraction && (
                        <Text className="text-xs text-muted leading-relaxed mt-2">
                          Last: {formatDate(participant.lastInteraction)}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ) : (
            <>
              {/* Back Button */}
              <TouchableOpacity
                onPress={() => setSelectedParticipant(null)}
                className="flex-row items-center gap-2"
              >
                <Text className="text-primary font-medium">← Back to Participants</Text>
              </TouchableOpacity>

              {/* Add Interaction Button */}
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                style={{ backgroundColor: colors.primary }}
                className="py-3 rounded-lg items-center"
              >
                <Text className="text-white font-semibold">+ Log New Interaction</Text>
              </TouchableOpacity>

              {/* Journey Timeline */}
              <View>
                <Text className="text-xl font-bold text-foreground mb-3">
                  Interaction Timeline
                </Text>

                {!journey || journey.length === 0 ? (
                  <View className="bg-surface rounded-2xl p-6 items-center border border-border">
                    <Text className="text-muted text-center">
                      No interactions recorded yet
                    </Text>
                  </View>
                ) : (
                  <View className="gap-4">
                    {journey.map((interaction, index) => (
                      <View key={interaction.id} className="flex-row gap-3">
                        {/* Timeline Line */}
                        <View className="items-center">
                          <View
                            style={{ backgroundColor: getTypeColor(interaction.type) }}
                            className="w-3 h-3 rounded-full"
                          />
                          {index < journey.length - 1 && (
                            <View
                              style={{ backgroundColor: colors.border }}
                              className="w-0.5 flex-1 my-1"
                            />
                          )}
                        </View>

                        {/* Content */}
                        <View className="flex-1 bg-surface rounded-2xl p-4 border border-border mb-2">
                          <View className="flex-row justify-between items-start mb-2">
                            <View className="flex-1">
                              <Text className="text-base font-semibold text-foreground">
                                {interaction.title}
                              </Text>
                              <View className="flex-row items-center gap-2 mt-1">
                                <View
                                  style={{ backgroundColor: getTypeColor(interaction.type) }}
                                  className="px-2 py-1 rounded"
                                >
                                  <Text className="text-white text-xs font-medium">
                                    {interaction.type.replace(/_/g, " ").toUpperCase()}
                                  </Text>
                                </View>
                                <Text className="text-xs text-muted leading-relaxed">
                                  {formatDate(interaction.interactionDate)}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {interaction.description && (
                            <Text className="text-sm text-foreground mt-2">
                              {interaction.description}
                            </Text>
                          )}

                          {interaction.notes && (
                            <View className="mt-3 bg-background rounded-lg p-3">
                              <Text className="text-xs font-medium text-muted mb-1">
                                Notes:
                              </Text>
                              <Text className="text-sm text-foreground">
                                {interaction.notes}
                              </Text>
                            </View>
                          )}

                          <Text className="text-xs text-muted leading-relaxed mt-3">
                            Recorded by: {interaction.recordedBy || "Unknown"}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Add Interaction Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{ backgroundColor: colors.background }} className="rounded-t-3xl p-6">
            <Text className="text-2xl font-bold text-foreground mb-4">
              Log New Interaction
            </Text>

            {/* Interaction Type */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">Type</Text>
              <View className="flex-row flex-wrap gap-2">
                {interactionTypes.slice(0, 6).map((type) => (
                  <TouchableOpacity
                    key={type.value}
                    onPress={() => setNewInteraction({ ...newInteraction, type: type.value as any })}
                    style={{
                      backgroundColor: newInteraction.type === type.value ? type.color : colors.surface,
                      borderColor: colors.border,
                      borderWidth: 1,
                    }}
                    className="px-4 py-2 rounded-full"
                  >
                    <Text
                      style={{
                        color: newInteraction.type === type.value ? "#FFFFFF" : colors.foreground,
                      }}
                      className="text-sm font-medium"
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Title */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">Title *</Text>
              <TextInput
                value={newInteraction.title}
                onChangeText={(text) => setNewInteraction({ ...newInteraction, title: text })}
                placeholder="e.g., First mentoring session"
                placeholderTextColor={colors.muted}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>

            {/* Description */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">Description</Text>
              <TextInput
                value={newInteraction.description}
                onChangeText={(text) => setNewInteraction({ ...newInteraction, description: text })}
                placeholder="Brief description"
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={2}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>

            {/* Notes */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">Notes</Text>
              <TextInput
                value={newInteraction.notes}
                onChangeText={(text) => setNewInteraction({ ...newInteraction, notes: text })}
                placeholder="Detailed notes..."
                placeholderTextColor={colors.muted}
                multiline
                numberOfLines={3}
                className="bg-surface border border-border rounded-lg px-4 py-3 text-foreground"
              />
            </View>

            {/* Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                className="flex-1 py-3 rounded-lg items-center border border-border"
              >
                <Text className="text-foreground font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddInteraction}
                style={{ backgroundColor: colors.primary }}
                className="flex-1 py-3 rounded-lg items-center"
              >
                <Text className="text-white font-semibold">Add Interaction</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
