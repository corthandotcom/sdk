/* eslint-disable no-console */
import { SecureStorageAdapter } from "./storage.js";

class IOSKeychainStorage implements SecureStorageAdapter {
  private store = new Map<string, string>();

  public async getItem(key: string): Promise<string | null> {
    console.log(`[Corthan RN SDK] iOS Keychain: reading key "${key}"`);
    return this.store.get(key) || null;
  }

  public async setItem(key: string, value: string): Promise<void> {
    console.log(`[Corthan RN SDK] iOS Keychain: saving key "${key}"`);
    this.store.set(key, value);
  }

  public async removeItem(key: string): Promise<void> {
    console.log(`[Corthan RN SDK] iOS Keychain: deleting key "${key}"`);
    this.store.delete(key);
  }
}

export function getPlatformStorage(): SecureStorageAdapter {
  return new IOSKeychainStorage();
}
