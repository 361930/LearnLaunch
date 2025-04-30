import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/**
 * SecureStorage utility provides a unified API for storing sensitive data
 * on both native mobile platforms and web.
 * 
 * On native platforms, it uses Expo's SecureStore which provides
 * encrypted storage. On web, it falls back to AsyncStorage.
 */

// Check if running on a native platform
const isNative = Platform.OS !== 'web';

// Set a reasonable maximum value size
const MAX_VALUE_SIZE = 2000;

// Interface for SecureStorage
interface ISecureStorage {
  setItem(key: string, value: string): Promise<void>;
  getItem(key: string): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

/**
 * A class providing secure storage functionality with web fallback.
 */
class SecureStorage implements ISecureStorage {
  /**
   * Store a value securely
   * 
   * @param key Storage key
   * @param value Value to store
   * @returns Promise that resolves when the operation completes
   */
  async setItem(key: string, value: string): Promise<void> {
    try {
      // Validate value length
      if (value && value.length > MAX_VALUE_SIZE) {
        throw new Error(`Value for ${key} exceeds maximum size (${value.length} > ${MAX_VALUE_SIZE})`);
      }
      
      if (isNative) {
        // Use SecureStore on native platforms
        await SecureStore.setItemAsync(key, value);
      } else {
        // Use AsyncStorage on web
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
      throw new Error(`Failed to store ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve a value from secure storage
   * 
   * @param key Storage key
   * @returns Promise that resolves with the stored value, or null if not found
   */
  async getItem(key: string): Promise<string | null> {
    try {
      if (isNative) {
        // Use SecureStore on native platforms
        return await SecureStore.getItemAsync(key);
      } else {
        // Use AsyncStorage on web
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      throw new Error(`Failed to retrieve ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove a value from secure storage
   * 
   * @param key Storage key
   * @returns Promise that resolves when the operation completes
   */
  async removeItem(key: string): Promise<void> {
    try {
      if (isNative) {
        // Use SecureStore on native platforms
        await SecureStore.deleteItemAsync(key);
      } else {
        // Use AsyncStorage on web
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      throw new Error(`Failed to remove ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Clear all items from secure storage
   * This is intentionally not implemented for SecureStore
   * as it doesn't provide a clear all method. AsyncStorage is used on web.
   * 
   * @returns Promise that resolves when the operation completes
   */
  async clear(): Promise<void> {
    try {
      if (isNative) {
        // SecureStore doesn't have a clearAll method
        // We would need to maintain a list of keys to clear
        console.warn('clear() is not fully supported on native platforms');
      } else {
        // Use AsyncStorage on web
        await AsyncStorage.clear();
      }
    } catch (error) {
      console.error('Error clearing secure storage:', error);
      throw new Error(`Failed to clear storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Store an object securely by serializing it to JSON
   * 
   * @param key Storage key
   * @param value Object to store
   * @returns Promise that resolves when the operation completes
   */
  async setObject<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await this.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error storing object ${key}:`, error);
      throw new Error(`Failed to store object ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve and parse an object from secure storage
   * 
   * @param key Storage key
   * @returns Promise that resolves with the parsed object, or null if not found
   */
  async getObject<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await this.getItem(key);
      
      if (!jsonValue) {
        return null;
      }
      
      return JSON.parse(jsonValue) as T;
    } catch (error) {
      console.error(`Error retrieving object ${key}:`, error);
      throw new Error(`Failed to retrieve object ${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Create and export a singleton instance
const secureStorage = new SecureStorage();
export default secureStorage;