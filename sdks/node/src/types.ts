export interface Meta {
  version: string;
  timestamp: string;
  trace_id?: string;
}

export interface Assertion {
  device_id: string;
  tenant_id: string;
  nonce: string;
  timestamp: string; // RFC3339 formatted
  signature: string; // Base64 encoded signature
}

export interface AuthTokenSuccess {
  status: string;
  data: {
    token: string;
  };
  meta: Meta;
}

export interface QRSessionCreate {
  qr_session_id: string;
  challenge: string;
  tenant_id: string;
  expires_at: string;
  qr_payload: string;
}

export interface QRSessionCreateSuccess {
  status: string;
  data: QRSessionCreate;
  meta: Meta;
}

export interface QRConfirmRequest {
  qr_session_id: string;
  device_id: string;
  tenant_id: string;
  nonce: string;
  timestamp: string;
  signature: string;
}

export interface QRConfirmSuccess {
  status: string;
  data: {
    status: string;
    qr_session_id: string;
  };
  meta: Meta;
}

export interface QRPollResult {
  status: string; // pending, completed, expired, consumed
  qr_session_id: string;
  token?: string;
  device_id?: string;
}

export interface QRPollSuccess {
  status: string;
  data: QRPollResult;
  meta: Meta;
}

export interface ErrorDetails {
  code: string;
  message: string;
  resolution?: string;
  trace_id: string;
}

export interface ErrorEnvelope {
  status: string;
  error: ErrorDetails;
  meta: Meta;
}

export interface Identity {
  identity_id: string;
  email: string;
  name: string;
}

export interface IdentityUpdate {
  email?: string;
  name?: string;
}

export interface IdentitySuccess {
  status: string;
  data: Identity;
  meta: Meta;
}

export interface Session {
  session_id: string;
  tenant_id: string;
  device_id: string;
  created_at: string;
  expires_at: string;
  revoked_at?: string | null;
}

export interface SessionListSuccess {
  status: string;
  data: Session[];
  meta: Meta;
}

export interface SessionRevokedSuccess {
  status: string;
  data: {
    status: string;
    session_id: string;
  };
  meta: Meta;
}

export interface Device {
  device_id: string;
  tenant_id?: string;
  public_key: string;
  status: string; // active, revoked
}

export interface DeviceCreate {
  device_id: string;
  tenant_id?: string;
  public_key: string;
}

export interface DeviceSuccess {
  status: string;
  data: Device;
  meta: Meta;
}

export interface DeviceListSuccess {
  status: string;
  data: Device[];
  meta: Meta;
}

export interface DeviceRevokedSuccess {
  status: string;
  data: {
    status: string;
    device_id: string;
  };
  meta: Meta;
}

export interface Organization {
  organization_id: string;
  name: string;
  domain: string;
}

export interface OrganizationSuccess {
  status: string;
  data: Organization;
  meta: Meta;
}

export interface OrganizationListSuccess {
  status: string;
  data: Organization[];
  meta: Meta;
}

export interface OrganizationMember {
  identity_id: string;
  email: string;
  name: string;
  org_id: string;
}

export interface OrganizationMemberListSuccess {
  status: string;
  data: OrganizationMember[];
  meta: Meta;
}

export interface RiskAssessmentRequest {
  device_id: string;
  ip?: string;
}

export interface RiskAssessmentSuccess {
  status: string;
  data: {
    risk_score: number;
    action: string; // allow, flag, deny
  };
  meta: Meta;
}

export interface BillingTier {
  tier: string;
  limit: number;
  used: number;
  overage_fee: number;
}

export interface BillingTierSuccess {
  status: string;
  data: BillingTier;
  meta: Meta;
}

export interface DeveloperKey {
  key_id: string;
  tenant_id: string;
  name: string;
  prefix: string;
  created_at: string;
}

export interface DeveloperKeyListSuccess {
  status: string;
  data: DeveloperKey[];
  meta: Meta;
}

export interface DeveloperKeyCreateResult {
  key_id: string;
  tenant_id: string;
  name: string;
  prefix: string;
  secret: string;
  created_at: string;
}

export interface DeveloperKeyCreateSuccess {
  status: string;
  data: DeveloperKeyCreateResult;
  meta: Meta;
}

export interface AuditLog {
  event_id: string;
  actor: string;
  action: string;
  status: string;
  timestamp: string;
}

export interface AuditLogListSuccess {
  status: string;
  data: AuditLog[];
  meta: Meta;
}

export interface PermissionsSuccess {
  role: string;
  scopes: string[];
}
