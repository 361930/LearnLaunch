import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

type StorageOptions = {
  requireAuthentication?: boolean;
};

/**
 * SecureStorage utility for securely storing sensitive data
 * 
 * Uses Expo SecureStore which stores data in the Keychain (iOS) 
 * or in EncryptedSharedPreferences (Android)
 * 
 * Falls back to AsyncStorage when running in environments where 
 * SecureStore is not available (e.g. web, dev mode without Expo)
 */
class SecureStorage {
  private static readonly useSecureStore = true;
  private static readonly SECURE_STORE_PREFIX = 'edu_connect_secure_';

  /**
   * Store a value securely
   */
  static async setItem(
    key: string, 
    value: string, 
    options: StorageOptions = {}
  ): Promise<void> {
    const storageKey = this.getStorageKey(key);

    try {
      if (this.useSecureStore) {
        await SecureStore.setItemAsync(storageKey, value, {
          requireAuthentication: options.requireAuthentication || false,
          keychainAccessible: SecureStore.WHEN_UNLOCKED,
        });
      } else {
        // Fallback to AsyncStorage with key prefix
        await AsyncStorage.setItem(storageKey, value);
      }
    } catch (error) {
      console.error(`SecureStorage setItem error for key ${key}:`, error);
      // Fallback to AsyncStorage if SecureStore fails
      await AsyncStorage.setItem(storageKey, value);
    }
  }

  /**
   * Retrieve a value from secure storage
   */
  static async getItem(key: string): Promise<string | null> {
    const storageKey = this.getStorageKey(key);

    try {
      if (this.useSecureStore) {
        return await SecureStore.getItemAsync(storageKey);
      } else {
        // Fallback to AsyncStorage with key prefix
        return await AsyncStorage.getItem(storageKey);
      }
    } catch (error) {
      console.error(`SecureStorage getItem error for key ${key}:`, error);
      // Fallback to AsyncStorage if SecureStore fails
      return await AsyncStorage.getItem(storageKey);
    }
  }

  /**
   * Delete a value from secure storage
   */
  static async removeItem(key: string): Promise<void> {
    const storageKey = this.getStorageKey(key);

    try {
      if (this.useSecureStore) {
        await SecureStore.deleteItemAsync(storageKey);
      } else {
        // Fallback to AsyncStorage with key prefix
        await AsyncStorage.removeItem(storageKey);
      }
    } catch (error) {
      console.error(`SecureStorage removeItem error for key ${key}:`, error);
      // Try fallback to AsyncStorage if SecureStore fails
      await AsyncStorage.removeItem(storageKey);
    }
  }

  /**
   * Clear all secure values with our prefix
   * Note: This is limited in SecureStore since we can't enumerate keys,
   * so we can only clear keys that we know about
   */
  static async clear(knownKeys: string[] = []): Promise<void> {
    try {
      if (this.useSecureStore) {
        // Remove each known key
        for (const key of knownKeys) {
          await SecureStore.deleteItemAsync(this.getStorageKey(key));
        }
      } else {
        // Get all keys from AsyncStorage
        const allKeys = await AsyncStorage.getAllKeys();
        
        // Filter keys that have our prefix
        const secureKeys = allKeys.filter(
          key => key.startsWith(this.SECURE_STORE_PREFIX)
        );
        
        // Remove all secure keys
        if (secureKeys.length > 0) {
          await AsyncStorage.multiRemove(secureKeys);
        }
      }
    } catch (error) {
      console.error('SecureStorage clear error:', error);
    }
  }

  /**
   * Format the storage key with our prefix
   */
  private static getStorageKey(key: string): string {
    return `${this.SECURE_STORE_PREFIX}${key}`;
  }
}

export default SecureStorage;