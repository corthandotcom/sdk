package corthan

import (
	"context"
	"net/http"
)

// BillingService wraps Billing operations.
type BillingService struct {
	t *TransportClient
}

// GetTier retrieves billing tier details and Aurora resource usage metering.
func (s *BillingService) GetTier(ctx context.Context) (*BillingTierSuccess, error) {
	var result BillingTierSuccess
	err := s.t.Request(ctx, http.MethodGet, "/billing/tier", nil, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}
