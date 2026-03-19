import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Platform-safe storage utility
 * Uses localStorage on web, expo-secure-store on native
 */

export async function getItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      const value = window.localStorage.getItem(key);
      return value;
    } else {
      const value = await SecureStore.getItemAsync(key);
      return value;
    }
  } catch (error) {
    console.error(`[Storage] Error getting item "${key}":`, error);
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.error(`[Storage] Error setting item "${key}":`, error);
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error(`[Storage] Error removing item "${key}":`, error);
  }
}
