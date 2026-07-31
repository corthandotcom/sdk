package corthan_test

import (
	"github.com/corthandotcom/sdk/sdks/go/corthan"
	"testing"
)

func TestGetSDKVersion(t *testing.T) {
	version := corthan.GetSDKVersion()
	if version != "1.0.0" {
		t.Errorf("Expected 1.0.0, got %s", version)
	}
}
