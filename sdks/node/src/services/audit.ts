import { TransportClient } from "../transport.js";
import { AuditLogListSuccess, PermissionsSuccess } from "../types.js";

/**
 * Service for querying audit log trails and querying permissions.
 */
export class AuditService {
  constructor(private transport: TransportClient) {}

  /**
   * Retrieves audit trail event records for user identity activities.
   */
  public async listLogs(): Promise<AuditLogListSuccess> {
    return this.transport.request<AuditLogListSuccess>("GET", "/audit/logs");
  }

  /**
   * Queries active client authorization scope rules.
   */
  public async getPermissions(): Promise<PermissionsSuccess> {
    return this.transport.request<PermissionsSuccess>("GET", "/permissions");
  }
}
