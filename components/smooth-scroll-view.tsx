import React from "react";
import { ScrollView, type ScrollViewProps } from "react-native";

export function SmoothScrollView({
  decelerationRate = 0.98,
  scrollEventThrottle = 16,
  ...props
}: ScrollViewProps) {
  return (
    <ScrollView
      decelerationRate={decelerationRate}
      scrollEventThrottle={scrollEventThrottle}
      {...props}
    />
  );
}
