/* eslint-disable no-console */
import { SecureStorageAdapter } from "./storage.js";

class AndroidKeyStoreStorage implements SecureStorageAdapter {
  private store = new Map<string, string>();

  public async getItem(key: string): Promise<string | null> {
    console.log(`[Corthan RN SDK] Android KeyStore: reading key "${key}"`);
    return this.store.get(key) || null;
  }

  public async setItem(key: string, value: string): Promise<void> {
    console.log(`[Corthan RN SDK] Android KeyStore: saving key "${key}"`);
    this.store.set(key, value);
  }

  public async removeItem(key: string): Promise<void> {
    console.log(`[Corthan RN SDK] Android KeyStore: deleting key "${key}"`);
    this.store.delete(key);
  }
}

export function getPlatformStorage(): SecureStorageAdapter {
  return new AndroidKeyStoreStorage();
}
