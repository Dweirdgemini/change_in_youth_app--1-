import { View, Text, TouchableOpacity, ActivityIndicator, FlatList, Alert, TextInput, ScrollView } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useAuthContext } from "@/contexts/auth-context";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

export default function SurveysScreen() {
  const { isAuthenticated, loading: authLoading } = useAuthContext();
  const { data: surveys, isLoading } = (trpc.surveys as any).listSurveys.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [responses, setResponses] = useState<Record<number, string>>({});

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
            Sign in to access surveys
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

  const handleSubmitSurvey = () => {
    Alert.alert(
      "Survey Submitted",
      "Thank you for your feedback! (Demo mode - responses not saved to database yet)",
      [
        {
          text: "OK",
          onPress: () => {
            setSelectedSurvey(null);
            setResponses({});
          },
        },
      ]
    );
  };

  if (selectedSurvey) {
    return (
      <ScreenContainer>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
          <View className="p-6 gap-4">
            {/* Header */}
            <View className="flex-row items-center justify-between">
              <TouchableOpacity onPress={() => setSelectedSurvey(null)}>
                <Text className="text-primary text-lg">← Back</Text>
              </TouchableOpacity>
              <View style={{ width: 60 }} />
            </View>

            <View>
              <Text className="text-2xl font-bold text-foreground">{selectedSurvey.title}</Text>
              {selectedSurvey.description && (
                <Text className="text-base text-muted mt-2">{selectedSurvey.description}</Text>
              )}
            </View>

            {/* Questions */}
            <View className="gap-4">
              {selectedSurvey.questions?.map((question: any, index: number) => (
                <View key={question.id} className="bg-surface rounded-2xl p-4 border border-border">
                  <Text className="text-base font-semibold text-foreground mb-3">
                    {index + 1}. {question.question}
                    {question.required && <Text className="text-error"> *</Text>}
                  </Text>

                  {question.type === "text" && (
                    <TextInput
                      className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
                      value={responses[question.id] || ""}
                      onChangeText={(text) => setResponses({ ...responses, [question.id]: text })}
                      placeholder="Your answer..."
                      placeholderTextColor="#9BA1A6"
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  )}

                  {question.type === "rating" && (
                    <View className="flex-row gap-2 justify-center">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <TouchableOpacity
                          key={rating}
                          className={`w-12 h-12 rounded-full items-center justify-center ${
                            responses[question.id] === rating.toString()
                              ? "bg-primary"
                              : "bg-background border border-border"
                          }`}
                          onPress={() => setResponses({ ...responses, [question.id]: rating.toString() })}
                        >
                          <Text
                            className={`font-semibold ${
                              responses[question.id] === rating.toString() ? "text-background" : "text-foreground"
                            }`}
                          >
                            {rating}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {question.type === "multiple_choice" && question.options && (
                    <View className="gap-2">
                      {JSON.parse(question.options).map((option: string, optIndex: number) => (
                        <TouchableOpacity
                          key={optIndex}
                          className={`rounded-xl p-3 border ${
                            responses[question.id] === option
                              ? "bg-primary/10 border-primary"
                              : "bg-background border-border"
                          }`}
                          onPress={() => setResponses({ ...responses, [question.id]: option })}
                        >
                          <Text
                            className={`${
                              responses[question.id] === option ? "text-primary font-semibold" : "text-foreground"
                            }`}
                          >
                            {option}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {question.type === "yes_no" && (
                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        className={`flex-1 rounded-xl p-3 border ${
                          responses[question.id] === "Yes"
                            ? "bg-primary/10 border-primary"
                            : "bg-background border-border"
                        }`}
                        onPress={() => setResponses({ ...responses, [question.id]: "Yes" })}
                      >
                        <Text
                          className={`text-center font-semibold ${
                            responses[question.id] === "Yes" ? "text-primary" : "text-foreground"
                          }`}
                        >
                          Yes
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        className={`flex-1 rounded-xl p-3 border ${
                          responses[question.id] === "No"
                            ? "bg-primary/10 border-primary"
                            : "bg-background border-border"
                        }`}
                        onPress={() => setResponses({ ...responses, [question.id]: "No" })}
                      >
                        <Text
                          className={`text-center font-semibold ${
                            responses[question.id] === "No" ? "text-primary" : "text-foreground"
                          }`}
                        >
                          No
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className="bg-primary px-6 py-4 rounded-full active:opacity-80 mt-4"
              onPress={handleSubmitSurvey}
            >
              <Text className="text-background font-semibold text-lg text-center">Submit Survey</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="flex-1">
        {/* Header */}
        <View className="p-6 pb-4">
          <View className="flex-row items-center justify-between mb-2">
            
            <View style={{ width: 60 }} />
          </View>
          <Text className="text-2xl font-bold text-foreground">Surveys</Text>
          <Text className="text-base text-muted mt-1">Share your feedback</Text>
        </View>

        {/* Content */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" />
            <Text className="text-muted mt-4">Loading surveys...</Text>
          </View>
        ) : !surveys || surveys.length === 0 ? (
          <View className="flex-1 items-center justify-center p-6">
            <Text className="text-6xl mb-4">📋</Text>
            <Text className="text-xl font-semibold text-foreground text-center">
              No Surveys Available
            </Text>
            <Text className="text-base text-muted text-center mt-2">
              Surveys will appear here when they're created
            </Text>
          </View>
        ) : (
          <FlatList
            data={surveys}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ padding: 24, paddingTop: 0, gap: 12 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
                onPress={() => setSelectedSurvey(item)}
              >
                <View className="flex-row items-start gap-3">
                  <Text className="text-3xl">📋</Text>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-foreground">{item.title}</Text>
                    {item.description && (
                      <Text className="text-sm text-muted mt-1" numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                    <View className="flex-row items-center gap-2 mt-2">
                      <View className="bg-primary/10 px-3 py-1 rounded-full">
                        <Text className="text-primary text-xs font-medium capitalize">{item.status}</Text>
                      </View>
                      <Text className="text-xs text-muted leading-relaxed">
                        {item.questions?.length || 0} question{item.questions?.length !== 1 ? "s" : ""}
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
    </ScreenContainer>
  );
}
