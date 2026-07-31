package corthan_test

import (
	"testing"

	"github.com/corthandotcom/sdk/sdks/go/corthan"
)

func TestAPIErrorString(t *testing.T) {
	apiErr := &corthan.APIError{
		HTTPStatus: 400,
		Code:       "INVALID_PARAMETER",
		Message:    "Email is invalid",
		Resolution: "Fix email format",
		TraceID:    "tr-12345",
	}

	errStr := apiErr.Error()
	expected := "Corthan API Error [400 - INVALID_PARAMETER]: Email is invalid (Trace ID: tr-12345)"
	if errStr != expected {
		t.Errorf("expected string %q, got %q", expected, errStr)
	}

	apiErrNoTrace := &corthan.APIError{
		HTTPStatus: 401,
		Code:       "UNAUTHORIZED",
		Message:    "Token is expired",
	}
	errStrNoTrace := apiErrNoTrace.Error()
	expectedNoTrace := "Corthan API Error [401 - UNAUTHORIZED]: Token is expired"
	if errStrNoTrace != expectedNoTrace {
		t.Errorf("expected string %q, got %q", expectedNoTrace, errStrNoTrace)
	}
}

func TestIsRetryableStatus(t *testing.T) {
	retryable := []int{429, 500, 502, 503, 504}
	nonRetryable := []int{200, 201, 301, 400, 401, 403, 404, 409}

	for _, s := range retryable {
		if !corthan.IsRetryableStatus(s) {
			t.Errorf("expected status %d to be retryable, got false", s)
		}
	}

	for _, s := range nonRetryable {
		if corthan.IsRetryableStatus(s) {
			t.Errorf("expected status %d to not be retryable, got true", s)
		}
	}
}
