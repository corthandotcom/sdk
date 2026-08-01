import { TransportClient } from "../transport.js";
import { DeveloperKeyCreateSuccess, DeveloperKeyListSuccess } from "../types.js";

/**
 * Service for managing developer access keys.
 */
export class DeveloperService {
  constructor(private transport: TransportClient) {}

  /**
   * Generates a new API developer access credential key.
   */
  public async createKey(name: string): Promise<DeveloperKeyCreateSuccess> {
    return this.transport.request<DeveloperKeyCreateSuccess>("POST", "/developers/keys", {
      name
    });
  }

  /**
   * Lists active developer access credentials created for the tenant.
   */
  public async listKeys(): Promise<DeveloperKeyListSuccess> {
    return this.transport.request<DeveloperKeyListSuccess>("GET", "/developers/keys");
  }

  /**
   * Revokes a developer API access key by its identifier.
   */
  public async revokeKey(id: string): Promise<any> {
    return this.transport.request<any>("DELETE", `/developers/keys/${id}`);
  }
}
