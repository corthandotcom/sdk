package corthan

import (
	"fmt"
)

// APIError represents a structured error returned by the Corthan API.
type APIError struct {
	Code       string `json:"code"`
	Message    string `json:"message"`
	Resolution string `json:"resolution"`
	TraceID    string `json:"trace_id"`
	HTTPStatus int    `json:"-"`
	RawBody    string `json:"-"`
}

// Error implements the built-in error interface.
func (e *APIError) Error() string {
	if e.TraceID != "" {
		return fmt.Sprintf("Corthan API Error [%d - %s]: %s (Trace ID: %s)", e.HTTPStatus, e.Code, e.Message, e.TraceID)
	}
	return fmt.Sprintf("Corthan API Error [%d - %s]: %s", e.HTTPStatus, e.Code, e.Message)
}

// IsRetryableStatus returns true if the HTTP status code is retryable (e.g. 429 or 5xx).
func IsRetryableStatus(status int) bool {
	return status == 429 || (status >= 500 && status <= 599)
}
