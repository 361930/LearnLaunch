/**
 * SecureStorage utility for GlobalEduConnect mobile app
 * 
 * Provides an API for securely storing sensitive data like:
 * - Authentication tokens
 * - User credentials
 * - Personal information
 * 
 * Implements cross-platform encrypted storage with fallbacks:
 * - Uses Expo SecureStore on native platforms
 * - Falls back to encrypted AsyncStorage on web
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import CryptoJS from 'crypto-js';

// Default encryption options
const DEFAULT_OPTIONS = {
  requireAuthentication: false, // Whether to require device authentication 
  keychainAccessible: SecureStore.WHEN_UNLOCKED, // When keychain is accessible
};

// Encryption key for web fallback (in real-world, this would be environment-specific)
const ENCRYPTION_KEY = 'GlobalEduConnect_SecureStorage_Key_2023';

/**
 * Checks if secure storage is available on the current platform
 * @returns {Promise<boolean>} True if secure storage is available
 */
export async function isAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return true; // Web fallback is always available
  }
  
  return await SecureStore.isAvailableAsync();
}

/**
 * Securely stores a key-value pair
 * @param {string} key - The key to store the value under
 * @param {string} value - The value to store
 * @param {object} options - SecureStore options
 * @returns {Promise<void>}
 */
export async function setItem(
  key: string,
  value: string,
  options = DEFAULT_OPTIONS
): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // For web, we encrypt the value before storing in AsyncStorage
      const encryptedValue = CryptoJS.AES.encrypt(value, ENCRYPTION_KEY).toString();
      await AsyncStorage.setItem(`secure_${key}`, encryptedValue);
    } else {
      // For native platforms, use SecureStore
      await SecureStore.setItemAsync(key, value, options);
    }
  } catch (error) {
    console.error('SecureStorage setItem error:', error);
    throw new Error('Failed to securely store item');
  }
}

/**
 * Retrieves a value by key from secure storage
 * @param {string} key - The key to retrieve
 * @returns {Promise<string | null>} The retrieved value or null if not found
 */
export async function getItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      // For web, get from AsyncStorage and decrypt
      const encryptedValue = await AsyncStorage.getItem(`secure_${key}`);
      
      if (!encryptedValue) {
        return null;
      }
      
      // Decrypt the value
      const decryptedValue = CryptoJS.AES.decrypt(encryptedValue, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
      return decryptedValue || null;
    } else {
      // For native platforms, use SecureStore
      return await SecureStore.getItemAsync(key);
    }
  } catch (error) {
    console.error('SecureStorage getItem error:', error);
    return null;
  }
}

/**
 * Deletes a value by key from secure storage
 * @param {string} key - The key to delete
 * @returns {Promise<void>}
 */
export async function deleteItem(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(`secure_${key}`);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  } catch (error) {
    console.error('SecureStorage deleteItem error:', error);
    throw new Error('Failed to delete secure item');
  }
}

/**
 * Clears all secure storage items for the app
 * Warning: This will remove all secure data
 * @returns {Promise<void>}
 */
export async function clearAll(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      // Get all keys from AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Filter for secure keys only
      const secureKeys = allKeys.filter(key => key.startsWith('secure_'));
      
      // Remove all secure keys
      if (secureKeys.length > 0) {
        await AsyncStorage.multiRemove(secureKeys);
      }
    } else {
      // For native platforms, there's no direct "clear all" in SecureStore
      // So we need to manually keep track of keys we've used
      
      // Get the list of keys we've stored
      const storedKeysJson = await SecureStore.getItemAsync('gec_secure_keys') || '[]';
      const storedKeys = JSON.parse(storedKeysJson) as string[];
      
      // Delete each key
      for (const key of storedKeys) {
        await SecureStore.deleteItemAsync(key);
      }
      
      // Clear the keys list itself
      await SecureStore.deleteItemAsync('gec_secure_keys');
    }
  } catch (error) {
    console.error('SecureStorage clearAll error:', error);
    throw new Error('Failed to clear secure storage');
  }
}

/**
 * Updates the stored keys list for native platforms
 * Used internally to keep track of all keys for clearAll()
 * @param {string} key - The key being added
 */
async function _updateStoredKeys(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    return; // Not needed for web
  }
  
  try {
    // Get current keys list
    const storedKeysJson = await SecureStore.getItemAsync('gec_secure_keys') || '[]';
    const storedKeys = JSON.parse(storedKeysJson) as string[];
    
    // Add key if not already present
    if (!storedKeys.includes(key)) {
      storedKeys.push(key);
      await SecureStore.setItemAsync('gec_secure_keys', JSON.stringify(storedKeys));
    }
  } catch (error) {
    console.error('Error updating stored keys:', error);
  }
}

// Automatically update stored keys list when setting an item
const originalSetItem = setItem;
setItem = async function(key: string, value: string, options = DEFAULT_OPTIONS): Promise<void> {
  await originalSetItem(key, value, options);
  
  if (Platform.OS !== 'web') {
    await _updateStoredKeys(key);
  }
};

export default {
  isAvailable,
  setItem,
  getItem,
  deleteItem,
  clearAll,
};