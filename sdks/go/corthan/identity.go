package corthan

import (
	"context"
	"fmt"
	"net/http"
)

// IdentityService wraps Identity profile operations.
type IdentityService struct {
	t *TransportClient
}

// Register creates a new Identity profile record.
func (s *IdentityService) Register(ctx context.Context, profile *Identity) (*IdentitySuccess, error) {
	var result IdentitySuccess
	err := s.t.Request(ctx, http.MethodPost, "/identity", profile, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// Get retrieves an existing Identity profile by ID.
func (s *IdentityService) Get(ctx context.Context, id string) (*IdentitySuccess, error) {
	path := fmt.Sprintf("/identity/%s", id)
	var result IdentitySuccess
	err := s.t.Request(ctx, http.MethodGet, path, nil, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// Update updates fields of an existing Identity profile.
func (s *IdentityService) Update(ctx context.Context, id string, profile *IdentityUpdate) (*IdentitySuccess, error) {
	path := fmt.Sprintf("/identity/%s", id)
	var result IdentitySuccess
	err := s.t.Request(ctx, http.MethodPut, path, profile, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}
