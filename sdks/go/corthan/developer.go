package corthan

import (
	"context"
	"fmt"
	"net/http"
)

// DeveloperService wraps Developer API key operations.
type DeveloperService struct {
	t *TransportClient
}

// ListKeys retrieves masked developer API keys.
func (s *DeveloperService) ListKeys(ctx context.Context) (*DeveloperKeyListSuccess, error) {
	var result DeveloperKeyListSuccess
	err := s.t.Request(ctx, http.MethodGet, "/developers/keys", nil, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// CreateKey creates a new developer API key, returning the plaintext secret exactly once.
func (s *DeveloperService) CreateKey(ctx context.Context, name string) (*DeveloperKeyCreateSuccess, error) {
	body := map[string]string{
		"name": name,
	}
	var result DeveloperKeyCreateSuccess
	err := s.t.Request(ctx, http.MethodPost, "/developers/keys", body, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// RevokeKey revokes a developer API key by ID.
func (s *DeveloperService) RevokeKey(ctx context.Context, id string) error {
	path := fmt.Sprintf("/developers/keys/%s", id)
	return s.t.Request(ctx, http.MethodDelete, path, nil, nil)
}
