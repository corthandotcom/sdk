//go:build integration

package corthan_test

import (
	"context"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"testing"
	"time"

	"github.com/corthandotcom/sdk/sdks/go/corthan"
)

func TestIntegrationMockServer(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	config := corthan.DefaultConfig()
	config.BaseURL = "http://localhost:8080/v1"
	config.Token = "mock-initial-token"
	client := corthan.NewClient(config)

	// 1. Test Auth (Authenticate)
	privKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("failed to generate key: %v", err)
	}
	assertion, err := corthan.GenerateAssertion("dev-1234", "tenant-test", "nonce-12345", privKey)
	if err != nil {
		t.Fatalf("failed to generate assertion: %v", err)
	}
	authRes, err := client.Auth.Authenticate(ctx, assertion)
	if err != nil {
		t.Fatalf("Auth.Authenticate failed: %v", err)
	}
	if authRes.Data.Token == "" {
		t.Error("expected auth token, got empty string")
	}

	// Set active client token for subsequent tests
	client.SetToken(authRes.Data.Token)

	// 2. Test QR Auth Flow
	qrSessionRes, err := client.Auth.CreateQRSession(ctx, "tenant-test")
	if err != nil {
		t.Fatalf("Auth.CreateQRSession failed: %v", err)
	}
	if qrSessionRes.Data.QRSessionID == "" {
		t.Error("expected QR session ID, got empty")
	}

	confirmRes, err := client.Auth.ConfirmQRSession(ctx, &corthan.QRConfirmRequest{
		Assertion:   *assertion,
		QRSessionID: qrSessionRes.Data.QRSessionID,
	})
	if err != nil {
		t.Fatalf("Auth.ConfirmQRSession failed: %v", err)
	}
	if confirmRes.Data.Status != "confirmed" {
		t.Errorf("expected confirmed, got %s", confirmRes.Data.Status)
	}

	pollRes, err := client.Auth.PollQRSession(ctx, qrSessionRes.Data.QRSessionID, "tenant-test")
	if err != nil {
		t.Fatalf("Auth.PollQRSession failed: %v", err)
	}
	if pollRes.Data.Status != "completed" {
		t.Errorf("expected completed status, got %s", pollRes.Data.Status)
	}

	// 3. Test Identity Service
	idProfile := &corthan.Identity{
		IdentityID: "user-123",
		Email:      "user-123@mock.com",
		Name:       "Test User",
	}
	regRes, err := client.Identity.Register(ctx, idProfile)
	if err != nil {
		t.Fatalf("Identity.Register failed: %v", err)
	}
	if regRes.Data.IdentityID != idProfile.IdentityID {
		t.Errorf("expected identity %s, got %s", idProfile.IdentityID, regRes.Data.IdentityID)
	}

	getRes, err := client.Identity.Get(ctx, "user-123")
	if err != nil {
		t.Fatalf("Identity.Get failed: %v", err)
	}
	if getRes.Data.Email != "user-123@corthan.mock" {
		t.Errorf("expected user-123@corthan.mock, got %s", getRes.Data.Email)
	}

	updateRes, err := client.Identity.Update(ctx, "user-123", &corthan.IdentityUpdate{Name: "New User Name"})
	if err != nil {
		t.Fatalf("Identity.Update failed: %v", err)
	}
	if updateRes.Data.Name != "New User Name" {
		t.Errorf("expected New User Name, got %s", updateRes.Data.Name)
	}

	// 4. Test Sessions Service
	sessList, err := client.Session.List(ctx)
	if err != nil {
		t.Fatalf("Session.List failed: %v", err)
	}
	if len(sessList.Data) == 0 {
		t.Error("expected active sessions list")
	}

	revokeSess, err := client.Session.Revoke(ctx, "sess-001")
	if err != nil {
		t.Fatalf("Session.Revoke failed: %v", err)
	}
	if revokeSess.Data.Status != "revoked" {
		t.Errorf("expected revoked, got %s", revokeSess.Data.Status)
	}

	// 5. Test Device Service
	devList, err := client.Device.List(ctx)
	if err != nil {
		t.Fatalf("Device.List failed: %v", err)
	}
	if len(devList.Data) == 0 {
		t.Error("expected devices, got empty")
	}

	newDevice := &corthan.DeviceCreate{
		DeviceID:  "dev-new-id",
		PublicKey: "mock-pubkey-base64",
	}
	regDev, err := client.Device.Register(ctx, newDevice)
	if err != nil {
		t.Fatalf("Device.Register failed: %v", err)
	}
	if regDev.Data.DeviceID != newDevice.DeviceID {
		t.Errorf("expected device %s, got %s", newDevice.DeviceID, regDev.Data.DeviceID)
	}

	deactDev, err := client.Device.Deactivate(ctx, "dev-new-id")
	if err != nil {
		t.Fatalf("Device.Deactivate failed: %v", err)
	}
	if deactDev.Data.Status != "revoked" {
		t.Errorf("expected revoked status, got %s", deactDev.Data.Status)
	}

	// 6. Test Organisation Service
	orgList, err := client.Organisation.List(ctx)
	if err != nil {
		t.Fatalf("Organisation.List failed: %v", err)
	}
	if len(orgList.Data) == 0 {
		t.Error("expected organisations list, got empty")
	}

	newOrg := &corthan.Organization{
		OrganizationID: "org-new",
		Name:           "New Org Name",
		Domain:         "new-org.domain",
	}
	createOrg, err := client.Organisation.Create(ctx, newOrg)
	if err != nil {
		t.Fatalf("Organisation.Create failed: %v", err)
	}
	if createOrg.Data.OrganizationID != newOrg.OrganizationID {
		t.Errorf("expected organization %s, got %s", newOrg.OrganizationID, createOrg.Data.OrganizationID)
	}

	membersRes, err := client.Organisation.ListMembers(ctx, "org-new")
	if err != nil {
		t.Fatalf("Organisation.ListMembers failed: %v", err)
	}
	if len(membersRes.Data) == 0 {
		t.Error("expected members, got empty")
	}

	// 7. Test Billing Service
	billingRes, err := client.Billing.GetTier(ctx)
	if err != nil {
		t.Fatalf("Billing.GetTier failed: %v", err)
	}
	if billingRes.Data.Tier != "enterprise" {
		t.Errorf("expected enterprise, got %s", billingRes.Data.Tier)
	}

	// 8. Test Developer Service
	keyList, err := client.Developer.ListKeys(ctx)
	if err != nil {
		t.Fatalf("Developer.ListKeys failed: %v", err)
	}
	if len(keyList.Data) == 0 {
		t.Error("expected keys list, got empty")
	}

	newKey, err := client.Developer.CreateKey(ctx, "Deploy Key")
	if err != nil {
		t.Fatalf("Developer.CreateKey failed: %v", err)
	}
	if newKey.Data.Name != "Deploy Key" || newKey.Data.Secret == "" {
		t.Error("expected valid key creation details and secret")
	}

	err = client.Developer.RevokeKey(ctx, "key-12345")
	if err != nil {
		t.Fatalf("Developer.RevokeKey failed: %v", err)
	}

	// 9. Test Audit Service
	auditLogs, err := client.Audit.GetAuditLogs(ctx)
	if err != nil {
		t.Fatalf("Audit.GetAuditLogs failed: %v", err)
	}
	if len(auditLogs.Data) == 0 {
		t.Error("expected audit logs, got empty")
	}

	permissions, err := client.Audit.GetPermissions(ctx)
	if err != nil {
		t.Fatalf("Audit.GetPermissions failed: %v", err)
	}
	if len(permissions.Scopes) == 0 {
		t.Error("expected scopes list, got empty")
	}

	riskRes, err := client.Audit.EvaluateRisk(ctx, &corthan.RiskAssessmentRequest{
		DeviceID: "dev-1234",
	})
	if err != nil {
		t.Fatalf("Audit.EvaluateRisk failed: %v", err)
	}
	if riskRes.Data.Action != "allow" {
		t.Errorf("expected allow, got %s", riskRes.Data.Action)
	}
}
