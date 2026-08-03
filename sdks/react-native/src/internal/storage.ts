export interface SecureStorageAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

class InMemoryStorage implements SecureStorageAdapter {
  private store = new Map<string, string>();

  public async getItem(key: string): Promise<string | null> {
    return this.store.get(key) || null;
  }

  public async setItem(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  public async removeItem(key: string): Promise<void> {
    this.store.delete(key);
  }
}

/**
 * Returns default platform-specific storage. Under Metro bundling, this acts as the
 * fallback/default storage implementation when running on non-mobile targets.
 */
export function getPlatformStorage(): SecureStorageAdapter {
  return new InMemoryStorage();
}
