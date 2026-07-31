package corthan

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"strconv"
	"strings"
	"time"
)

// TransportClient is the underlying HTTP transport wrapper with retry, mapping, and logging capability.
type TransportClient struct {
	httpClient    *http.Client
	baseURL       string
	token         string
	maxRetries    int
	retryMinDelay time.Duration
	retryMaxDelay time.Duration
	logger        Logger
}

// NewTransportClient instantiates the transport client.
func NewTransportClient(hc *http.Client, baseURL, token string, maxRetries int, minDelay, maxDelay time.Duration, logger Logger) *TransportClient {
	if hc == nil {
		hc = &http.Client{Timeout: 30 * time.Second}
	}
	return &TransportClient{
		httpClient:    hc,
		baseURL:       strings.TrimSuffix(baseURL, "/"),
		token:         token,
		maxRetries:    maxRetries,
		retryMinDelay: minDelay,
		retryMaxDelay: maxDelay,
		logger:        logger,
	}
}

// RequestOption allows overriding client properties per call.
type RequestOption func(*http.Request)

// Request performs a HTTP request with full retry logic, redirection logging, and error mapping.
func (c *TransportClient) Request(ctx context.Context, method, path string, body interface{}, out interface{}, opts ...RequestOption) error {
	url := fmt.Sprintf("%s%s", c.baseURL, path)

	var bodyReader io.Reader
	var rawBody []byte
	if body != nil {
		var err error
		rawBody, err = json.Marshal(body)
		if err != nil {
			return fmt.Errorf("failed to marshal request body: %w", err)
		}
		bodyReader = bytes.NewReader(rawBody)
	}

	var attempts int
	for {
		attempts++

		req, err := http.NewRequestWithContext(ctx, method, url, bodyReader)
		if err != nil {
			return fmt.Errorf("failed to create HTTP request: %w", err)
		}

		// Standard Headers
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("User-Agent", "corthan-go-sdk/1.0.0")

		if c.token != "" {
			req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.token))
		}

		for _, opt := range opts {
			opt(req)
		}

		// Log request
		c.logRequest(method, url, rawBody)

		start := time.Now()
		resp, respErr := c.httpClient.Do(req)
		duration := time.Since(start)

		var shouldRetry bool
		var retryDelay time.Duration

		if respErr != nil {
			c.logger.Warn(fmt.Sprintf("HTTP request failed: %v", respErr), "attempt", attempts)
			shouldRetry = true
			retryDelay = c.calculateBackoff(attempts, nil)
		} else {
			defer resp.Body.Close()

			// Log response status
			c.logger.Debug(fmt.Sprintf("HTTP response: %s %d (duration: %s)", resp.Status, resp.StatusCode, duration))

			if IsRetryableStatus(resp.StatusCode) {
				shouldRetry = true
				retryDelay = c.calculateBackoff(attempts, resp.Header)
			}
		}

		// Execute retry if applicable
		if shouldRetry && attempts <= c.maxRetries {
			c.logger.Info(fmt.Sprintf("Retrying request in %v (attempt %d/%d)...", retryDelay, attempts, c.maxRetries))
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(retryDelay):
				// Reset reader if body is populated
				if rawBody != nil {
					bodyReader = bytes.NewReader(rawBody)
				}
				continue
			}
		}

		if respErr != nil {
			return fmt.Errorf("HTTP request failed after max attempts: %w", respErr)
		}

		// Handle error response (non-2xx)
		if resp.StatusCode < 200 || resp.StatusCode >= 300 {
			return c.parseErrorResponse(resp)
		}

		// Parse success response
		if out != nil {
			respBytes, readErr := io.ReadAll(resp.Body)
			if readErr != nil {
				return fmt.Errorf("failed to read response body: %w", readErr)
			}

			c.logResponse(respBytes)

			if err := json.Unmarshal(respBytes, out); err != nil {
				return fmt.Errorf("failed to unmarshal response: %w (body: %s)", err, string(respBytes))
			}
		}

		return nil
	}
}

// UpdateToken updates the authorization token for the client.
func (c *TransportClient) UpdateToken(token string) {
	c.token = token
}

func (c *TransportClient) calculateBackoff(attempt int, headers http.Header) time.Duration {
	if headers != nil {
		if retryAfter := headers.Get("Retry-After"); retryAfter != "" {
			if seconds, err := strconv.Atoi(retryAfter); err == nil {
				return time.Duration(seconds) * time.Second
			}
			if date, err := http.ParseTime(retryAfter); err == nil {
				if delay := time.Until(date); delay > 0 {
					return delay
				}
			}
		}
	}

	// Jittered exponential backoff
	factor := float64(int(1) << (attempt - 1))
	delay := float64(c.retryMinDelay) * factor

	// Add random jitter up to 25% of the delay
	jitter := (rand.Float64() * 0.25) * delay
	finalDelay := time.Duration(delay + jitter)

	if finalDelay > c.retryMaxDelay {
		return c.retryMaxDelay
	}
	return finalDelay
}

func (c *TransportClient) parseErrorResponse(resp *http.Response) error {
	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return &APIError{
			HTTPStatus: resp.StatusCode,
			Code:       "UNKNOWN_ERROR",
			Message:    "Failed to read error response body.",
		}
	}

	var envelope ErrorEnvelope
	if err := json.Unmarshal(bodyBytes, &envelope); err == nil && envelope.Error.Code != "" {
		return &APIError{
			HTTPStatus: resp.StatusCode,
			Code:       envelope.Error.Code,
			Message:    envelope.Error.Message,
			Resolution: envelope.Error.Resolution,
			TraceID:    envelope.Error.TraceID,
			RawBody:    string(bodyBytes),
		}
	}

	// Fallback raw error
	return &APIError{
		HTTPStatus: resp.StatusCode,
		Code:       "RAW_ERROR",
		Message:    fmt.Sprintf("Raw HTTP failure status: %d", resp.StatusCode),
		RawBody:    string(bodyBytes),
	}
}

// logRequest logs the request body after redacting sensitive keys.
func (c *TransportClient) logRequest(method, url string, rawBody []byte) {
	if rawBody == nil {
		c.logger.Debug(fmt.Sprintf("HTTP Request: %s %s", method, url))
		return
	}
	redacted := c.redactJSON(rawBody)
	c.logger.Debug(fmt.Sprintf("HTTP Request: %s %s Payload: %s", method, url, redacted))
}

// logResponse logs the response body after redacting sensitive keys.
func (c *TransportClient) logResponse(rawBody []byte) {
	redacted := c.redactJSON(rawBody)
	c.logger.Debug(fmt.Sprintf("HTTP Response Payload: %s", redacted))
}

// redactJSON parses a JSON string, recursively redacts secret variables, and returns the serialized output.
func (c *TransportClient) redactJSON(body []byte) string {
	var parsed interface{}
	if err := json.Unmarshal(body, &parsed); err != nil {
		return string(body) // Return raw if unparseable
	}

	redactNode(parsed)
	redactedBytes, err := json.Marshal(parsed)
	if err != nil {
		return string(body)
	}
	return string(redactedBytes)
}

func redactNode(node interface{}) {
	switch typedNode := node.(type) {
	case map[string]interface{}:
		for k, v := range typedNode {
			if isSensitiveKey(k) {
				typedNode[k] = "[REDACTED]"
			} else {
				redactNode(v)
			}
		}
	case []interface{}:
		for _, item := range typedNode {
			redactNode(item)
		}
	}
}

func isSensitiveKey(key string) bool {
	k := strings.ToLower(key)
	return strings.Contains(k, "token") ||
		strings.Contains(k, "secret") ||
		strings.Contains(k, "password") ||
		strings.Contains(k, "private_key") ||
		strings.Contains(k, "limit") ||
		strings.Contains(k, "used") ||
		strings.Contains(k, "overage")
}
