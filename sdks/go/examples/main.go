package main

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"fmt"
	"log"
	"time"

	"github.com/corthandotcom/sdk/sdks/go/corthan"
)

func main() {
	fmt.Println("--- Corthan Go SDK Smoke Test ---")

	// 1. Generate local P-256 ECDSA key
	privKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		log.Fatalf("Failed to generate private key: %v", err)
	}

	// 2. Setup Config pointing to local mock server
	config := corthan.DefaultConfig()
	config.BaseURL = "http://localhost:8080/v1"
	config.Logger = corthan.NewStdLogger(true) // Enable verbose debug logging

	client := corthan.NewClient(config)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 3. Create device assertion signature
	assertion, err := corthan.GenerateAssertion("dev-smoke-1", "tenant-smoke", "nonce-smoke-789", privKey)
	if err != nil {
		log.Fatalf("Failed to generate assertion: %v", err)
	}

	fmt.Println("Authenticating device...")
	authRes, err := client.Auth.Authenticate(ctx, assertion)
	if err != nil {
		log.Fatalf("Authenticate failed: %v", err)
	}
	fmt.Printf("Device authenticated successfully! Token obtained: %s\n\n", authRes.Data.Token)

	// Set auth token on client
	client.SetToken(authRes.Data.Token)

	// 4. Query sessions
	fmt.Println("Querying active sessions...")
	sessRes, err := client.Session.List(ctx)
	if err != nil {
		log.Fatalf("Failed to query sessions: %v", err)
	}
	fmt.Printf("Found %d active sessions. Session ID: %s\n\n", len(sessRes.Data), sessRes.Data[0].SessionID)

	// 5. Query billing tier
	fmt.Println("Querying billing tier...")
	billingRes, err := client.Billing.GetTier(ctx)
	if err != nil {
		log.Fatalf("Failed to query billing: %v", err)
	}
	fmt.Printf("Billing Tier: %s (resource limit: %d, used: %d)\n\n", billingRes.Data.Tier, billingRes.Data.Limit, billingRes.Data.Used)

	// 6. Query audit logs
	fmt.Println("Querying audit logs...")
	auditRes, err := client.Audit.GetAuditLogs(ctx)
	if err != nil {
		log.Fatalf("Failed to query audit logs: %v", err)
	}
	fmt.Printf("Audit logs retrieve success! Event: %s, Action: %s\n\n", auditRes.Data[0].EventID, auditRes.Data[0].Action)

	fmt.Println("--- Smoke Test Completed Successfully! ---")
}
