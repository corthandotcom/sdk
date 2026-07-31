package corthan

import (
	"crypto/ecdsa"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"fmt"
	"time"
)

// ParseECDSAPrivateKey parses an ECDSA private key from a PEM-encoded byte slice.
func ParseECDSAPrivateKey(pemBytes []byte) (*ecdsa.PrivateKey, error) {
	block, _ := pem.Decode(pemBytes)
	if block == nil {
		return nil, errors.New("failed to parse PEM block from private key")
	}

	// Try PKCS#8 first
	if key, err := x509.ParsePKCS8PrivateKey(block.Bytes); err == nil {
		if ecKey, ok := key.(*ecdsa.PrivateKey); ok {
			return ecKey, nil
		}
		return nil, errors.New("private key is PKCS#8 but not ECDSA type")
	}

	// Fallback to SEC1
	key, err := x509.ParseECPrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse ECDSA private key: %w", err)
	}

	return key, nil
}

// GenerateAssertion signs a device auth assertion payload using ECDSA P-256 private key.
// Format signed: "device_id:tenant_id:nonce:timestamp"
func GenerateAssertion(deviceID, tenantID, nonce string, privKey *ecdsa.PrivateKey) (*Assertion, error) {
	timestamp := time.Now().UTC().Format(time.RFC3339)
	payload := fmt.Sprintf("%s:%s:%s:%s", deviceID, tenantID, nonce, timestamp)

	hash := sha256.Sum256([]byte(payload))
	sigBytes, err := ecdsa.SignASN1(rand.Reader, privKey, hash[:])
	if err != nil {
		return nil, fmt.Errorf("failed to sign assertion payload: %w", err)
	}

	signatureB64 := base64.StdEncoding.EncodeToString(sigBytes)

	return &Assertion{
		DeviceID:  deviceID,
		TenantID:  tenantID,
		Nonce:     nonce,
		Timestamp: timestamp,
		Signature: signatureB64,
	}, nil
}
