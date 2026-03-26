import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { router } from "expo-router";
import { useAuthContext } from "@/contexts/auth-context";

export default function CalendarScreen() {
  const { user } = useAuthContext();
  const isAdmin = user?.role === "admin" || user?.role === "finance";
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week">("month");

  // Get current month range
  const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

  const { data: calendarData, isLoading } = trpc.calendar.getCalendarView.useQuery({
    startDate: startOfMonth.toISOString(),
    endDate: endOfMonth.toISOString(),
  });

  const utils = trpc.useUtils();
  const setAvailability = trpc.calendar.setAvailability.useMutation({
    onSuccess: () => {
      utils.calendar.getCalendarView.invalidate();
      Alert.alert("Success", "Availability updated successfully");
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to update availability");
    },
  });

  // Generate calendar grid
  const generateCalendarDays = () => {
    const days = [];
    const firstDay = startOfMonth.getDay();
    const daysInMonth = endOfMonth.getDate();

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days;
  };

  const getDayData = (day: number) => {
    const date = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day);
    const dateStr = date.toISOString().split("T")[0];

    const availability = calendarData?.availability.find(
      (a) => new Date(a.date).toISOString().split("T")[0] === dateStr
    );

    const sessions = calendarData?.sessions.filter(
      (s) => new Date(s.startTime).toDateString() === date.toDateString()
    );

    return { availability, sessions, date };
  };

  const toggleAvailability = async (day: number) => {
    try {
      const { date, availability } = getDayData(day);
      const newAvailability = !availability?.isAvailable;
      
      await setAvailability.mutateAsync({
        date: date.toISOString(),
        isAvailable: newAvailability,
      });
    } catch (error) {
      console.error("Failed to toggle availability:", error);
    }
  };

  if (isLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  const calendarDays = generateCalendarDays();
  const monthName = selectedDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="p-6 gap-4">
          {/* Header with back button */}
          <View className="flex-row items-center">
            
            <Text className="text-2xl font-bold text-foreground">Calendar</Text>
          </View>

          {/* Month Navigation */}
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              className="bg-surface px-4 py-2 rounded-lg active:opacity-70"
              onPress={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(newDate.getMonth() - 1);
                setSelectedDate(newDate);
              }}
            >
              <Text className="text-foreground font-semibold">← Prev</Text>
            </TouchableOpacity>

            <Text className="text-xl font-bold text-foreground">{monthName}</Text>

            <TouchableOpacity
              className="bg-surface px-4 py-2 rounded-lg active:opacity-70"
              onPress={() => {
                const newDate = new Date(selectedDate);
                newDate.setMonth(newDate.getMonth() + 1);
                setSelectedDate(newDate);
              }}
            >
              <Text className="text-foreground font-semibold">Next →</Text>
            </TouchableOpacity>
          </View>

          {/* Day Headers */}
          <View className="flex-row">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <View key={day} className="flex-1 items-center py-2">
                <Text className="text-sm font-semibold text-muted">{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View className="flex-row flex-wrap">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <View key={`empty-${index}`} className="w-[14.28%] aspect-square p-1" />;
              }

              const { availability, sessions } = getDayData(day);
              const isAvailable = availability?.isAvailable ?? true;
              const hasSessions = (sessions?.length || 0) > 0;

              return (
                <TouchableOpacity
                  key={day}
                  className="w-[14.28%] aspect-square p-1"
                  onPress={() => {
                    if (isAdmin) {
                      // Admins tap to view team availability
                      router.push(`/calendar/day?date=${getDayData(day).date.toISOString()}` as any);
                    } else {
                      // Regular users tap to toggle their own availability
                      toggleAvailability(day);
                    }
                  }}
                  onLongPress={() => {
                    if (hasSessions) {
                      // Navigate to day detail
                      router.push(`/calendar/day?date=${getDayData(day).date.toISOString()}` as any);
                    }
                  }}
                >
                  <View
                    className={`flex-1 rounded-lg items-center justify-center ${
                      hasSessions
                        ? "bg-primary"
                        : isAvailable
                        ? "bg-success/20 border border-success"
                        : "bg-error/20 border border-error"
                    }`}
                  >
                    <Text
                      className={`text-base font-semibold ${
                        hasSessions ? "text-background" : "text-foreground"
                      }`}
                    >
                      {day}
                    </Text>
                    {hasSessions && (
                      <Text className="text-xs text-background mt-1">
                        {sessions?.length} session{sessions?.length !== 1 ? "s" : ""}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Legend */}
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Legend:</Text>
            <View className="flex-row gap-4">
              <View className="flex-row items-center gap-2">
                <View className="w-6 h-6 rounded bg-primary" />
                <Text className="text-sm text-muted leading-relaxed">Has Sessions</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-6 h-6 rounded bg-success/20 border border-success" />
                <Text className="text-sm text-muted leading-relaxed">Available</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-6 h-6 rounded bg-error/20 border border-error" />
                <Text className="text-sm text-muted leading-relaxed">Unavailable</Text>
              </View>
            </View>
            <Text className="text-xs text-muted leading-relaxed mt-2">
              Tap a date to toggle availability. Long press dates with sessions to view details.
            </Text>
          </View>

          {/* Upcoming Sessions */}
          {calendarData && calendarData.sessions.length > 0 && (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Upcoming Sessions</Text>
              {calendarData.sessions.slice(0, 5).map((session) => (
                <TouchableOpacity
                  key={session.id}
                  className="bg-surface rounded-2xl p-4 border border-border active:opacity-70"
                  onPress={() => router.push(`/materials/session?id=${session.id}` as any)}
                >
                  <Text className="text-base font-semibold text-foreground">{session.title}</Text>
                  <Text className="text-sm text-muted mt-1">{session.venue}</Text>
                  <Text className="text-sm text-muted leading-relaxed">
                    {new Date(session.startTime).toLocaleString()}
                  </Text>
                  {session.clockedIn && (
                    <View className="bg-success/20 px-3 py-1 rounded-full self-start mt-2">
                      <Text className="text-xs text-success font-medium">Clocked In</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
