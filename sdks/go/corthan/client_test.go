package corthan_test

import (
	"net/http"
	"testing"
	"time"

	"github.com/corthandotcom/sdk/sdks/go/corthan"
)

func TestNewClientDefaults(t *testing.T) {
	config := &corthan.ClientConfig{}
	client := corthan.NewClient(config)

	if client == nil {
		t.Fatal("client should not be nil")
	}

	// Verify that sub-services are initialized
	if client.Auth == nil {
		t.Error("AuthService is nil")
	}
	if client.Identity == nil {
		t.Error("IdentityService is nil")
	}
	if client.Session == nil {
		t.Error("SessionService is nil")
	}
	if client.Device == nil {
		t.Error("DeviceService is nil")
	}
}

func TestNewClientCustomOverrides(t *testing.T) {
	customClient := &http.Client{Timeout: 10 * time.Second}
	logger := corthan.NewStdLogger(true)

	config := &corthan.ClientConfig{
		BaseURL:       "http://custom-api:8080/v1",
		Token:         "initial-token",
		Timeout:       5 * time.Second,
		MaxRetries:    5,
		RetryMinDelay: 50 * time.Millisecond,
		RetryMaxDelay: 1 * time.Second,
		Logger:        logger,
		HTTPClient:    customClient,
	}

	client := corthan.NewClient(config)

	if client == nil {
		t.Fatal("client should not be nil")
	}

	// Test updating token dynamically
	client.SetToken("updated-token")
}
