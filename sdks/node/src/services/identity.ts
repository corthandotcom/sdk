import { TransportClient } from "../transport";
import { Identity, IdentitySuccess, IdentityUpdate } from "../types";

/**
 * Service for managing Identity user profiles.
 */
export class IdentityService {
  constructor(private transport: TransportClient) {}

  /**
   * Registers a new user Identity profile record.
   */
  public async register(profile: Identity): Promise<IdentitySuccess> {
    return this.transport.request<IdentitySuccess>("POST", "/identity", profile);
  }

  /**
   * Retrieves an existing Identity profile by identifier.
   */
  public async get(id: string): Promise<IdentitySuccess> {
    return this.transport.request<IdentitySuccess>("GET", `/identity/${id}`);
  }

  /**
   * Updates fields of an existing user Identity profile.
   */
  public async update(id: string, profile: IdentityUpdate): Promise<IdentitySuccess> {
    return this.transport.request<IdentitySuccess>("PUT", `/identity/${id}`, profile);
  }
}
