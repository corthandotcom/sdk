import * as crypto from "crypto";
import { CorthanClient } from "../src/client.js";
import { generateAssertion } from "../src/crypto.js";

describe("Corthan Node SDK Integration Tests", () => {
  let client: CorthanClient;
  let privateKey: string;
  let publicKey: string;

  beforeAll(() => {
    // Generate EC P-256 keys for integration test signatures
    const keys = crypto.generateKeyPairSync("ec", {
      namedCurve: "P-256",
      privateKeyEncoding: { type: "sec1", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" }
    });
    privateKey = keys.privateKey;
    publicKey = keys.publicKey;

    client = new CorthanClient({
      baseURL: "http://localhost:8080/v1",
      token: "initial-token-123",
      maxRetries: 1,
      timeout: 5000
    });
  });

  test("Auth Service - Device authentication", async () => {
    const assertion = generateAssertion("dev-123", "tenant-456", "nonce-789", privateKey);
    const authResult = await client.auth.authenticate(assertion);

    expect(authResult.status).toBe("success");
    expect(authResult.data.token).toBeDefined();
    expect(authResult.meta).toBeDefined();
  });

  test("Auth Service - QR session login flow", async () => {
    const sessionRes = await client.auth.createQRSession("tenant-456");
    expect(sessionRes.status).toBe("success");
    expect(sessionRes.data.qr_session_id).toBeDefined();

    const qrSessionId = sessionRes.data.qr_session_id;

    // Confirm QR session
    const confirmRes = await client.auth.confirmQRSession({
      qr_session_id: qrSessionId,
      device_id: "dev-123",
      tenant_id: "tenant-456",
      nonce: "nonce-abc",
      timestamp: new Date().toISOString(),
      signature: "dummy-signature"
    });
    expect(confirmRes.status).toBe("success");

    // Poll QR session
    const pollRes = await client.auth.pollQRSession(qrSessionId, "tenant-456");
    expect(pollRes.status).toBe("success");
    expect(pollRes.data.status).toBe("completed");
    expect(pollRes.data.token).toBeDefined();
  });

  test("Identity Service - Profile registration, get, update", async () => {
    const profile = {
      identity_id: "user-123",
      email: "test@corthan.com",
      name: "Corthan Tester"
    };

    const registerRes = await client.identity.register(profile);
    expect(registerRes.status).toBe("success");
    expect(registerRes.data.identity_id).toBe(profile.identity_id);

    const getRes = await client.identity.get(profile.identity_id);
    expect(getRes.status).toBe("success");
    expect(getRes.data.email).toBe("user-123@corthan.mock");

    const updateRes = await client.identity.update(profile.identity_id, {
      name: "Updated Tester"
    });
    expect(updateRes.status).toBe("success");
    expect(updateRes.data.name).toBe("Updated Tester");
  });

  test("Session Service - List and revoke", async () => {
    const listRes = await client.session.list();
    expect(listRes.status).toBe("success");
    expect(Array.isArray(listRes.data)).toBe(true);
    expect(listRes.data.length).toBeGreaterThan(0);

    const sessionId = listRes.data[0].session_id;
    const revokeRes = await client.session.revoke(sessionId);
    expect(revokeRes.status).toBe("success");
    expect(revokeRes.data.session_id).toBe(sessionId);
  });

  test("Device Service - Register, list, revoke", async () => {
    const registerRes = await client.device.register({
      device_id: "dev-999",
      tenant_id: "tenant-456",
      public_key: publicKey
    });
    expect(registerRes.status).toBe("success");
    expect(registerRes.data.device_id).toBe("dev-999");

    const listRes = await client.device.list();
    expect(listRes.status).toBe("success");
    expect(listRes.data.length).toBeGreaterThan(0);

    const revokeRes = await client.device.revoke("dev-999");
    expect(revokeRes.status).toBe("success");
    expect(revokeRes.data.device_id).toBe("dev-999");
  });

  test("Organisation Service - Create, list, members list", async () => {
    const org = {
      organization_id: "org-123",
      name: "Test Org",
      domain: "test-org.com"
    };

    const createRes = await client.organisation.create(org);
    expect(createRes.status).toBe("success");
    expect(createRes.data.organization_id).toBe(org.organization_id);


    const listRes = await client.organisation.list();
    expect(listRes.status).toBe("success");
    expect(listRes.data.length).toBeGreaterThan(0);

    const membersRes = await client.organisation.listMembers(org.organization_id);
    expect(membersRes.status).toBe("success");
    expect(membersRes.data.length).toBeGreaterThan(0);
  });

  test("Developer Service - Create, list, revoke keys", async () => {
    const createRes = await client.developer.createKey("test-api-key");
    expect(createRes.status).toBe("success");
    expect(createRes.data.name).toBe("test-api-key");
    expect(createRes.data.secret).toBeDefined();

    const keyId = createRes.data.key_id;

    const listRes = await client.developer.listKeys();
    expect(listRes.status).toBe("success");
    expect(listRes.data.length).toBeGreaterThan(0);

    const revokeRes = await client.developer.revokeKey(keyId);
    expect(revokeRes.status).toBe("success");
  });

  test("Billing Service - Get tier", async () => {
    const tierRes = await client.billing.getTier();
    expect(tierRes.status).toBe("success");
    expect(tierRes.data.tier).toBeDefined();
    expect(tierRes.data.limit).toBeGreaterThan(0);
  });

  test("Audit Service - Logs, threat evaluations, scopes", async () => {
    const logsRes = await client.audit.listLogs();
    expect(logsRes.status).toBe("success");
    expect(logsRes.data.length).toBeGreaterThan(0);

    const riskRes = await client.audit.evaluateRisk({
      device_id: "dev-123",
      ip: "192.168.1.1"
    });
    expect(riskRes.status).toBe("success");
    expect(riskRes.data.risk_score).toBeDefined();
    expect(riskRes.data.action).toBeDefined();

    const permRes = await client.audit.getPermissions();
    expect(permRes.role).toBeDefined();
    expect(Array.isArray(permRes.scopes)).toBe(true);
  });
});
