import { TransportClient } from "../transport.js";
import { Assertion, AuthTokenSuccess, QRSessionCreateSuccess, QRConfirmRequest, QRConfirmSuccess, QRPollSuccess } from "../types.js";

/**
 * Service for managing Corthan authentication mechanisms.
 */
export class AuthService {
  constructor(private transport: TransportClient) {}

  /**
   * Performs authentication via signed device assertions to obtain a JWT session token.
   */
  public async authenticate(assertion: Assertion): Promise<AuthTokenSuccess> {
    return this.transport.request<AuthTokenSuccess>("POST", "/auth", assertion);
  }

  /**
   * Starts a pending QR session authentication challenge flow.
   */
  public async createQRSession(tenantId: string): Promise<QRSessionCreateSuccess> {
    return this.transport.request<QRSessionCreateSuccess>("POST", "/auth/qr/session", {
      tenant_id: tenantId
    });
  }

  /**
   * Confirms a pending QR session challenge link via signed device assertions.
   */
  public async confirmQRSession(confirmReq: QRConfirmRequest): Promise<QRConfirmSuccess> {
    return this.transport.request<QRConfirmSuccess>("POST", "/auth/qr/confirm", confirmReq);
  }

  /**
   * Queries status and gets JWT token details for a QR authentication flow session.
   */
  public async pollQRSession(qrSessionId: string, tenantId: string): Promise<QRPollSuccess> {
    return this.transport.request<QRPollSuccess>("GET", `/auth/qr/session/${qrSessionId}`, undefined, {
      query: { tenant_id: tenantId }
    });
  }
}
