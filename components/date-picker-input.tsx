import { View, Text, Pressable, Platform } from "react-native";
import { useState } from "react";
import { useColors } from "@/hooks/use-colors";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";

interface DatePickerInputProps {
  label: string;
  value: string; // ISO date string (YYYY-MM-DD)
  onChange: (date: string) => void;
  placeholder?: string;
  required?: boolean;
  maxDate?: Date;
  minDate?: Date;
}

/**
 * A cross-platform date picker input component
 * On iOS/Android: Uses native date picker
 * On Web: Uses HTML5 date input
 */
export function DatePickerInput({
  label,
  value,
  onChange,
  placeholder = "Select date",
  required = false,
  maxDate,
  minDate,
}: DatePickerInputProps) {
  const colors = useColors();
  const [showPicker, setShowPicker] = useState(false);
  
  // Parse the ISO date string to a Date object
  const selectedDate = value ? new Date(value + "T00:00:00") : new Date();
  
  const handleDateChange = (event: any, date?: Date) => {
    if (Platform.OS !== "web") {
      setShowPicker(false);
    }
    
    if (date) {
      // Convert to ISO date string (YYYY-MM-DD)
      const isoDate = date.toISOString().split("T")[0];
      onChange(isoDate);
    }
  };
  
  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return placeholder;
    try {
      const date = new Date(dateString + "T00:00:00");
      return date.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return placeholder;
    }
  };

  return (
    <View>
      <Text className="text-sm font-semibold text-foreground mb-2">
        {label} {required && <Text className="text-error">*</Text>}
      </Text>
      
      {Platform.OS === "web" ? (
        // Web: Use HTML5 date input
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.surface,
            color: colors.foreground,
            fontSize: 16,
            fontFamily: "inherit",
          }}
          max={maxDate?.toISOString().split("T")[0]}
          min={minDate?.toISOString().split("T")[0]}
        />
      ) : (
        // Mobile: Use native date picker
        <>
          <Pressable
            onPress={() => setShowPicker(true)}
            style={{
              backgroundColor: colors.surface,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: 12,
              paddingHorizontal: 12,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                color: value ? colors.foreground : colors.muted,
                fontSize: 16,
              }}
            >
              {formatDisplayDate(value)}
            </Text>
            <Ionicons name="calendar" size={20} color={colors.primary} />
          </Pressable>
          
          {showPicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              maximumDate={maxDate}
              minimumDate={minDate}
            />
          )}
        </>
      )}
    </View>
  );
}
