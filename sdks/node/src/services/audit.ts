import { TransportClient } from "../transport.js";
import { AuditLogListSuccess, PermissionsSuccess, RiskAssessmentRequest, RiskAssessmentSuccess } from "../types.js";

/**
 * Service for querying audit log trails, evaluating device threat risks, and querying permissions.
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
   * Submits a real-time risk assessment threat check payload.
   */
  public async evaluateRisk(req: RiskAssessmentRequest): Promise<RiskAssessmentSuccess> {
    return this.transport.request<RiskAssessmentSuccess>("POST", "/risk/evaluate", req);
  }

  /**
   * Queries active client authorization scope rules.
   */
  public async getPermissions(): Promise<PermissionsSuccess> {
    return this.transport.request<PermissionsSuccess>("GET", "/permissions");
  }
}
