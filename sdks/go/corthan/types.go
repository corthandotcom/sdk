package corthan

import "time"

// Meta contains common metadata returned in API responses.
type Meta struct {
	Version   string    `json:"version"`
	Timestamp time.Time `json:"timestamp"`
	TraceID   string    `json:"trace_id,omitempty"`
}

// Assertion represents native device cryptographic verification arguments.
type Assertion struct {
	DeviceID  string `json:"device_id"`
	TenantID  string `json:"tenant_id"`
	Nonce     string `json:"nonce"`
	Timestamp string `json:"timestamp"` // RFC3339 formatted
	Signature string `json:"signature"` // Base64 encoded signature
}

// AuthTokenSuccess represents a successful token issuance response.
type AuthTokenSuccess struct {
	Status string `json:"status"`
	Data   struct {
		Token string `json:"token"`
	} `json:"data"`
	Meta Meta `json:"meta"`
}

// QRSessionCreate contains the parameters for a pending QR authentication flow.
type QRSessionCreate struct {
	QRSessionID string    `json:"qr_session_id"`
	Challenge   string    `json:"challenge"`
	TenantID    string    `json:"tenant_id"`
	ExpiresAt   time.Time `json:"expires_at"`
	QRPayload   string    `json:"qr_payload"`
}

// QRSessionCreateSuccess represents the response when creating a QR authentication session.
type QRSessionCreateSuccess struct {
	Status string          `json:"status"`
	Data   QRSessionCreate `json:"data"`
	Meta   Meta            `json:"meta"`
}

// QRConfirmRequest defines assertion arguments including the QR session link identifier.
type QRConfirmRequest struct {
	Assertion
	QRSessionID string `json:"qr_session_id"`
}

// QRConfirmSuccess defines the response status after confirmation.
type QRConfirmSuccess struct {
	Status string `json:"status"`
	Data   struct {
		Status      string `json:"status"`
		QRSessionID string `json:"qr_session_id"`
	} `json:"data"`
	Meta Meta `json:"meta"`
}

// QRPollResult contains the status of a QR challenge.
type QRPollResult struct {
	Status      string `json:"status"` // pending, completed, expired, consumed
	QRSessionID string `json:"qr_session_id"`
	Token       string `json:"token,omitempty"`
	DeviceID    string `json:"device_id,omitempty"`
}

// QRPollSuccess represents the poll status query result envelope.
type QRPollSuccess struct {
	Status string       `json:"status"`
	Data   QRPollResult `json:"data"`
	Meta   Meta         `json:"meta"`
}

// ErrorDetails defines payload error diagnostics.
type ErrorDetails struct {
	Code       string `json:"code"`
	Message    string `json:"message"`
	Resolution string `json:"resolution,omitempty"`
	TraceID    string `json:"trace_id"`
}

// ErrorEnvelope wraps error messages returned from the API.
type ErrorEnvelope struct {
	Status string       `json:"status"`
	Error  ErrorDetails `json:"error"`
	Meta   Meta         `json:"meta"`
}

// Identity represents user identity attributes.
type Identity struct {
	IdentityID string `json:"identity_id"`
	Email      string `json:"email"`
	Name       string `json:"name"`
}

// IdentityUpdate represents fields allowed for profile modifications.
type IdentityUpdate struct {
	Email string `json:"email,omitempty"`
	Name  string `json:"name,omitempty"`
}

// IdentitySuccess represents the single profile query result envelope.
type IdentitySuccess struct {
	Status string   `json:"status"`
	Data   Identity `json:"data"`
	Meta   Meta     `json:"meta"`
}

// Session defines active token properties.
type Session struct {
	SessionID string     `json:"session_id"`
	TenantID  string     `json:"tenant_id"`
	DeviceID  string     `json:"device_id"`
	CreatedAt time.Time  `json:"created_at"`
	ExpiresAt time.Time  `json:"expires_at"`
	RevokedAt *time.Time `json:"revoked_at,omitempty"`
}

// SessionListSuccess represents active sessions response.
type SessionListSuccess struct {
	Status string    `json:"status"`
	Data   []Session `json:"data"`
	Meta   Meta      `json:"meta"`
}

// SessionRevokedSuccess defines the response after revoking a session.
type SessionRevokedSuccess struct {
	Status string `json:"status"`
	Data   struct {
		Status    string `json:"status"`
		SessionID string `json:"session_id"`
	} `json:"data"`
	Meta Meta `json:"meta"`
}

// Device defines registered public key structures.
type Device struct {
	DeviceID  string `json:"device_id"`
	TenantID  string `json:"tenant_id,omitempty"`
	PublicKey string `json:"public_key"`
	Status    string `json:"status"` // active, revoked
}

// DeviceCreate represents body parameters required for registration.
type DeviceCreate struct {
	DeviceID  string `json:"device_id"`
	TenantID  string `json:"tenant_id,omitempty"`
	PublicKey string `json:"public_key"`
}

// DeviceSuccess represents the single device result envelope.
type DeviceSuccess struct {
	Status string `json:"status"`
	Data   Device `json:"data"`
	Meta   Meta   `json:"meta"`
}

// DeviceListSuccess represents list active devices response.
type DeviceListSuccess struct {
	Status string   `json:"status"`
	Data   []Device `json:"data"`
	Meta   Meta     `json:"meta"`
}

// DeviceRevokedSuccess represents the deactivate response envelope.
type DeviceRevokedSuccess struct {
	Status string `json:"status"`
	Data   struct {
		Status   string `json:"status"`
		DeviceID string `json:"device_id"`
	} `json:"data"`
	Meta Meta `json:"meta"`
}

// Organization represents tenant settings.
type Organization struct {
	OrganizationID string `json:"organization_id"`
	Name           string `json:"name"`
	Domain         string `json:"domain"`
}

// OrganizationSuccess represents single organization query result.
type OrganizationSuccess struct {
	Status string       `json:"status"`
	Data   Organization `json:"data"`
	Meta   Meta         `json:"meta"`
}

// OrganizationListSuccess represents list organizations response.
type OrganizationListSuccess struct {
	Status string         `json:"status"`
	Data   []Organization `json:"data"`
	Meta   Meta           `json:"meta"`
}

// OrganizationMember represents a single user member of an organization.
type OrganizationMember struct {
	IdentityID string `json:"identity_id"`
	Email      string `json:"email"`
	Name       string `json:"name"`
	OrgID      string `json:"org_id"`
}

// OrganizationMemberListSuccess represents organization members list.
type OrganizationMemberListSuccess struct {
	Status string               `json:"status"`
	Data   []OrganizationMember `json:"data"`
	Meta   Meta                 `json:"meta"`
}

// BillingTier represents Auroras billing tier configurations.
type BillingTier struct {
	Tier       string  `json:"tier"`
	Limit      int     `json:"limit"`
	Used       int     `json:"used"`
	OverageFee float64 `json:"overage_fee"`
}

// BillingTierSuccess represents current usage metering envelope.
type BillingTierSuccess struct {
	Status string      `json:"status"`
	Data   BillingTier `json:"data"`
	Meta   Meta        `json:"meta"`
}

// DeveloperKey represents metadata credentials.
type DeveloperKey struct {
	KeyID     string    `json:"key_id"`
	TenantID  string    `json:"tenant_id"`
	Name      string    `json:"name"`
	Prefix    string    `json:"prefix"`
	CreatedAt time.Time `json:"created_at"`
}

// DeveloperKeyListSuccess represents list developer keys.
type DeveloperKeyListSuccess struct {
	Status string         `json:"status"`
	Data   []DeveloperKey `json:"data"`
	Meta   Meta           `json:"meta"`
}

// DeveloperKeyCreateResult represents key creation details including the secret returned once.
type DeveloperKeyCreateResult struct {
	KeyID     string    `json:"key_id"`
	TenantID  string    `json:"tenant_id"`
	Name      string    `json:"name"`
	Prefix    string    `json:"prefix"`
	Secret    string    `json:"secret"`
	CreatedAt time.Time `json:"created_at"`
}

// DeveloperKeyCreateSuccess represents key creation response.
type DeveloperKeyCreateSuccess struct {
	Status string                   `json:"status"`
	Data   DeveloperKeyCreateResult `json:"data"`
	Meta   Meta                     `json:"meta"`
}

// AuditLog represents structured security audit details.
type AuditLog struct {
	EventID   string    `json:"event_id"`
	Actor     string    `json:"actor"`
	Action    string    `json:"action"`
	Status    string    `json:"status"`
	Timestamp time.Time `json:"timestamp"`
}

// AuditLogListSuccess represents audit log read logs envelope.
type AuditLogListSuccess struct {
	Status string     `json:"status"`
	Data   []AuditLog `json:"data"`
	Meta   Meta       `json:"meta"`
}

// PermissionsResult represents active JWT scopes.
type PermissionsResult struct {
	Role   string   `json:"role"`
	Scopes []string `json:"scopes"`
}

// PermissionsSuccess wraps retrieve token scopes query.
type PermissionsSuccess struct {
	Role   string   `json:"role"`
	Scopes []string `json:"scopes"`
}
