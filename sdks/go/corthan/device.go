package corthan

import (
	"context"
	"fmt"
	"net/http"
)

// DeviceService wraps Device operations.
type DeviceService struct {
	t *TransportClient
}

// List retrieves registered devices.
func (s *DeviceService) List(ctx context.Context) (*DeviceListSuccess, error) {
	var result DeviceListSuccess
	err := s.t.Request(ctx, http.MethodGet, "/devices", nil, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// Register registers a new device public key.
func (s *DeviceService) Register(ctx context.Context, dev *DeviceCreate) (*DeviceSuccess, error) {
	var result DeviceSuccess
	err := s.t.Request(ctx, http.MethodPost, "/devices", dev, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// Deactivate deactivates (soft-revokes) a device.
func (s *DeviceService) Deactivate(ctx context.Context, id string) (*DeviceRevokedSuccess, error) {
	path := fmt.Sprintf("/devices/%s", id)
	var result DeviceRevokedSuccess
	err := s.t.Request(ctx, http.MethodDelete, path, nil, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}
