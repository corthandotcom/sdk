package corthan

import (
	"context"
	"net/http"
)

// AuditService wraps Audit logs, risk evaluation, and permissions query.
type AuditService struct {
	t *TransportClient
}

// GetAuditLogs retrieves tenant security audit log entries.
func (s *AuditService) GetAuditLogs(ctx context.Context) (*AuditLogListSuccess, error) {
	var result AuditLogListSuccess
	err := s.t.Request(ctx, http.MethodGet, "/audit/logs", nil, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// GetPermissions retrieves role and active permission scopes for the current JWT.
func (s *AuditService) GetPermissions(ctx context.Context) (*PermissionsSuccess, error) {
	var result PermissionsSuccess
	err := s.t.Request(ctx, http.MethodGet, "/permissions", nil, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// EvaluateRisk performs evaluation of authentication threat signals.
func (s *AuditService) EvaluateRisk(ctx context.Context, riskReq *RiskAssessmentRequest) (*RiskAssessmentSuccess, error) {
	var result RiskAssessmentSuccess
	err := s.t.Request(ctx, http.MethodPost, "/risk/evaluate", riskReq, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}
