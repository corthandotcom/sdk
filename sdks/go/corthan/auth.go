package corthan

import (
	"context"
	"fmt"
	"net/http"
)

// AuthService wraps authentication flows.
type AuthService struct {
	t *TransportClient
}

// Authenticate verifies ECDSA assertion payloads and issues a JWT token.
func (s *AuthService) Authenticate(ctx context.Context, assertion *Assertion) (*AuthTokenSuccess, error) {
	var result AuthTokenSuccess
	err := s.t.Request(ctx, http.MethodPost, "/auth", assertion, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// CreateQRSession initiates a single-use short-lived challenge for QR authentication.
func (s *AuthService) CreateQRSession(ctx context.Context, tenantID string) (*QRSessionCreateSuccess, error) {
	body := map[string]string{
		"tenant_id": tenantID,
	}
	var result QRSessionCreateSuccess
	err := s.t.Request(ctx, http.MethodPost, "/auth/qr/session", body, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// ConfirmQRSession confirms a QR session link identifier via signed device assertions.
func (s *AuthService) ConfirmQRSession(ctx context.Context, confirmReq *QRConfirmRequest) (*QRConfirmSuccess, error) {
	var result QRConfirmSuccess
	err := s.t.Request(ctx, http.MethodPost, "/auth/qr/confirm", confirmReq, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// PollQRSession polls status results for active QR sessions.
func (s *AuthService) PollQRSession(ctx context.Context, qrSessionID, tenantID string) (*QRPollSuccess, error) {
	path := fmt.Sprintf("/auth/qr/session/%s", qrSessionID)
	var result QRPollSuccess
	err := s.t.Request(ctx, http.MethodGet, path, nil, &result, func(req *http.Request) {
		q := req.URL.Query()
		q.Set("tenant_id", tenantID)
		req.URL.RawQuery = q.Encode()
	})
	if err != nil {
		return nil, err
	}
	return &result, nil
}
