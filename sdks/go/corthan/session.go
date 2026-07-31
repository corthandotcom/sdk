package corthan

import (
	"context"
	"fmt"
	"net/http"
)

// SessionService wraps Session operations.
type SessionService struct {
	t *TransportClient
}

// List retrieves active sessions.
func (s *SessionService) List(ctx context.Context) (*SessionListSuccess, error) {
	var result SessionListSuccess
	err := s.t.Request(ctx, http.MethodGet, "/sessions", nil, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// Revoke terminates a session, invalidating its bound token.
func (s *SessionService) Revoke(ctx context.Context, id string) (*SessionRevokedSuccess, error) {
	path := fmt.Sprintf("/sessions/%s", id)
	var result SessionRevokedSuccess
	err := s.t.Request(ctx, http.MethodDelete, path, nil, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}
