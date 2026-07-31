package corthan_test

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"testing"

	"github.com/corthandotcom/sdk/sdks/go/corthan"
)

func TestParseECDSAPrivateKey(t *testing.T) {
	// 1. Generate P-256 key
	privKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("failed to generate private key: %v", err)
	}

	// 2. Marshal to SEC1 PEM
	sec1Bytes, err := x509.MarshalECPrivateKey(privKey)
	if err != nil {
		t.Fatalf("failed to marshal EC private key: %v", err)
	}
	pemBlock := &pem.Block{
		Type:  "EC PRIVATE KEY",
		Bytes: sec1Bytes,
	}
	pemBytes := pem.EncodeToMemory(pemBlock)

	// 3. Parse key using ParseECDSAPrivateKey
	parsedKey, err := corthan.ParseECDSAPrivateKey(pemBytes)
	if err != nil {
		t.Fatalf("failed to parse private key: %v", err)
	}

	if parsedKey.D.Cmp(privKey.D) != 0 {
		t.Error("parsed private key D component does not match original")
	}
}

func TestGenerateAssertion(t *testing.T) {
	privKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("failed to generate private key: %v", err)
	}

	deviceID := "dev-1234"
	tenantID := "tenant-test"
	nonce := "random-nonce-xyz"

	assertion, err := corthan.GenerateAssertion(deviceID, tenantID, nonce, privKey)
	if err != nil {
		t.Fatalf("failed to generate assertion: %v", err)
	}

	if assertion.DeviceID != deviceID {
		t.Errorf("expected device ID %s, got %s", deviceID, assertion.DeviceID)
	}
	if assertion.TenantID != tenantID {
		t.Errorf("expected tenant ID %s, got %s", tenantID, assertion.TenantID)
	}
	if assertion.Nonce != nonce {
		t.Errorf("expected nonce %s, got %s", nonce, assertion.Nonce)
	}
	if assertion.Timestamp == "" {
		t.Error("timestamp should not be empty")
	}

	// Verify ECDSA signature
	sigBytes, err := base64.StdEncoding.DecodeString(assertion.Signature)
	if err != nil {
		t.Fatalf("failed to decode signature from base64: %v", err)
	}

	message := deviceID + ":" + tenantID + ":" + nonce + ":" + assertion.Timestamp
	hash := sha256.Sum256([]byte(message))

	valid := ecdsa.VerifyASN1(&privKey.PublicKey, hash[:], sigBytes)
	if !valid {
		t.Error("cryptographic signature verification failed")
	}
}
