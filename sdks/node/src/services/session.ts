import { TransportClient } from "../transport.js";
import { SessionListSuccess, SessionRevokedSuccess } from "../types.js";

/**
 * Service for managing active sessions.
 */
export class SessionService {
  constructor(private transport: TransportClient) {}

  /**
   * Retrieves a list of active token sessions.
   */
  public async list(): Promise<SessionListSuccess> {
    return this.transport.request<SessionListSuccess>("GET", "/sessions");
  }

  /**
   * Invalidates a session by terminating its bound token.
   */
  public async revoke(id: string): Promise<SessionRevokedSuccess> {
    return this.transport.request<SessionRevokedSuccess>("DELETE", `/sessions/${id}`);
  }
}
