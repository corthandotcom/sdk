package corthan

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestCalculateBackoff(t *testing.T) {
	c := NewTransportClient(nil, "http://localhost", "", 3, 10*time.Millisecond, 100*time.Millisecond, &NoOpLogger{})

	// Test Retry-After header with seconds
	headers := make(http.Header)
	headers.Set("Retry-After", "2")
	delay := c.calculateBackoff(1, headers)
	if delay != 2*time.Second {
		t.Errorf("expected Retry-After delay of 2s, got %v", delay)
	}

	// Test Retry-After header with HTTP date format
	headersDate := make(http.Header)
	targetTime := time.Now().Add(5 * time.Second).UTC().Format(http.TimeFormat)
	headersDate.Set("Retry-After", targetTime)
	delayDate := c.calculateBackoff(1, headersDate)
	if delayDate < 4*time.Second || delayDate > 6*time.Second {
		t.Errorf("expected Retry-After delay near 5s, got %v", delayDate)
	}

	// Test exponential delay bounds
	headersEmpty := make(http.Header)
	delay1 := c.calculateBackoff(1, headersEmpty)
	if delay1 < 10*time.Millisecond || delay1 > 13*time.Millisecond {
		t.Errorf("expected delay between 10ms and 13ms, got %v", delay1)
	}

	delayLarge := c.calculateBackoff(10, headersEmpty)
	if delayLarge != 100*time.Millisecond {
		t.Errorf("expected delay capped at ceiling 100ms, got %v", delayLarge)
	}
}

func TestJSONRedaction(t *testing.T) {
	c := NewTransportClient(nil, "http://localhost", "", 3, 10*time.Millisecond, 100*time.Millisecond, &NoOpLogger{})

	inputJSON := []byte(`{
		"token": "secret-jwt",
		"secret": "plain-text-key",
		"nested": {
			"limit": 1000,
			"safe": "hello"
		},
		"array": [{"password": "123"}, {"safe": 1}]
	}`)

	redacted := c.redactJSON(inputJSON)

	var parsed map[string]interface{}
	if err := json.Unmarshal([]byte(redacted), &parsed); err != nil {
		t.Fatalf("failed to parse redacted JSON: %v", err)
	}

	if parsed["token"] != "[REDACTED]" {
		t.Errorf("expected token to be redacted, got %v", parsed["token"])
	}
	if parsed["secret"] != "[REDACTED]" {
		t.Errorf("expected secret to be redacted, got %v", parsed["secret"])
	}

	nested := parsed["nested"].(map[string]interface{})
	if nested["limit"] != "[REDACTED]" {
		t.Errorf("expected nested limit to be redacted, got %v", nested["limit"])
	}
	if nested["safe"] != "hello" {
		t.Errorf("expected safe value to remain intact, got %v", nested["safe"])
	}

	arr := parsed["array"].([]interface{})
	item1 := arr[0].(map[string]interface{})
	if item1["password"] != "[REDACTED]" {
		t.Errorf("expected array item password to be redacted, got %v", item1["password"])
	}
}

func TestClientRequestRetry(t *testing.T) {
	var attempts int
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		if attempts < 3 {
			w.WriteHeader(http.StatusServiceUnavailable) // Retryable status 503
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"success"}`))
	}))
	defer server.Close()

	c := NewTransportClient(server.Client(), server.URL, "", 3, 5*time.Millisecond, 20*time.Millisecond, &NoOpLogger{})

	var out struct {
		Status string `json:"status"`
	}
	err := c.Request(context.Background(), http.MethodPost, "/", nil, &out)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	if attempts != 3 {
		t.Errorf("expected exactly 3 request attempts, got %d", attempts)
	}
	if out.Status != "success" {
		t.Errorf("expected success status, got %q", out.Status)
	}
}
