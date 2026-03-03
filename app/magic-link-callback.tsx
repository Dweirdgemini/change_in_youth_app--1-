/**
 * Magic Link Callback Screen
 * 
 * Handles deep link callbacks from magic link emails.
 * Extracts the token from the URL and verifies it.
 * 
 * Deep link format:
 * manus20240115103045://auth/magic-link?token=<TOKEN>
 * or
 * https://changeinyouth.app/auth/magic-link?token=<TOKEN>
 */

import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { MagicLinkVerification } from "@/components/magic-link-verification";

export default function MagicLinkCallback() {
  const params = useLocalSearchParams();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Extract token from URL params
    const tokenParam = Array.isArray(params.token)
      ? params.token[0]
      : params.token;

    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [params]);

  return (
    <MagicLinkVerification
      token={token || undefined}
      onError={(error) => {
        console.error("Magic link verification failed:", error);
      }}
    />
  );
}
