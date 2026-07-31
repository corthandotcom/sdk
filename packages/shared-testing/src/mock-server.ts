import express, { Request, Response } from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080;

// Helper envelope structures
function successEnvelope(data: any) {
  return {
    status: "success",
    data,
    meta: {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      trace_id: "tr-" + Math.random().toString(36).substring(2, 10)
    }
  };
}

function errorEnvelope(code: string, message: string) {
  return {
    status: "error",
    error: {
      code,
      message,
      resolution: "Ensure correct parameters and authentication status.",
      trace_id: "tr-err-" + Math.random().toString(36).substring(2, 10)
    },
    meta: {
      version: "1.0.0",
      timestamp: new Date().toISOString()
    }
  };
}

// 1. NativeAuth - POST /v1/auth
app.post("/v1/auth", (req: Request, res: Response): any => {
  const { device_id, tenant_id, nonce, timestamp, signature } = req.body;
  if (!device_id || !tenant_id || !nonce || !timestamp || !signature) {
    return res.status(400).json(errorEnvelope("INVALID_ASSERTION", "Missing required assertion parameters."));
  }
  // Baseline check for base64 signature format
  try {
    Buffer.from(signature, "base64");
  } catch (err) {
    return res.status(400).json(errorEnvelope("INVALID_SIGNATURE", "Signature must be base64-encoded."));
  }

  return res.status(200).json(successEnvelope({
    token: "mock-jwt-token-for-" + device_id
  }));
});

// 2. QRAuth - POST /v1/auth/qr/session
app.post("/v1/auth/qr/session", (req: Request, res: Response): any => {
  const { tenant_id } = req.body;
  return res.status(200).json(successEnvelope({
    qr_session_id: "qr-sess-12345",
    challenge: "challenge-nonce-abc",
    tenant_id: tenant_id || "tenant-default",
    expires_at: new Date(Date.now() + 120000).toISOString(),
    qr_payload: "corthan://auth/qr?session=qr-sess-12345"
  }));
});

// 3. QRAuth - POST /v1/auth/qr/confirm
app.post("/v1/auth/qr/confirm", (req: Request, res: Response): any => {
  const { qr_session_id, device_id, signature } = req.body;
  if (!qr_session_id || !device_id || !signature) {
    return res.status(400).json(errorEnvelope("INVALID_CONFIRM_REQUEST", "Missing required confirmation parameters."));
  }
  return res.status(200).json(successEnvelope({
    status: "confirmed",
    qr_session_id
  }));
});

// 4. QRAuth - GET /v1/auth/qr/session/:id
app.get("/v1/auth/qr/session/:id", (req: Request, res: Response): any => {
  const { id } = req.params;
  const { tenant_id } = req.query;
  if (!tenant_id) {
    return res.status(400).json(errorEnvelope("MISSING_TENANT", "Query parameter tenant_id is required."));
  }
  return res.status(200).json(successEnvelope({
    status: "completed",
    qr_session_id: id,
    token: "mock-jwt-token-for-qr-user",
    device_id: "dev-mock-qr-device"
  }));
});

// 5. Identity - POST /v1/identity
app.post("/v1/identity", (req: Request, res: Response): any => {
  const { identity_id, email, name } = req.body;
  if (!identity_id || !email || !name) {
    return res.status(400).json(errorEnvelope("INVALID_IDENTITY_BODY", "Missing required profile parameters."));
  }
  return res.status(200).json(successEnvelope({ identity_id, email, name }));
});

// 6. Identity - GET /v1/identity/:id
app.get("/v1/identity/:id", (req: Request, res: Response): any => {
  const { id } = req.params;
  return res.status(200).json(successEnvelope({
    identity_id: id,
    email: `${id}@corthan.mock`,
    name: `User ${id}`
  }));
});

// 7. Identity - PUT /v1/identity/:id
app.put("/v1/identity/:id", (req: Request, res: Response): any => {
  const { id } = req.params;
  const { email, name } = req.body;
  return res.status(200).json(successEnvelope({
    identity_id: id,
    email: email || `${id}@corthan.mock`,
    name: name || `User ${id}`
  }));
});

// 8. Permissions - GET /v1/permissions
app.get("/v1/permissions", (_req: Request, res: Response): any => {
  return res.status(200).json({
    role: "admin",
    scopes: ["identity:read", "identity:write", "sessions:read", "sessions:write", "devices:read", "devices:write"]
  });
});

// 9. Sessions - GET /v1/sessions
app.get("/v1/sessions", (_req: Request, res: Response): any => {
  return res.status(200).json(successEnvelope([
    {
      session_id: "sess-001",
      tenant_id: "tenant-mock",
      device_id: "device-mock-1",
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 86400000).toISOString(),
      revoked_at: null
    }
  ]));
});

// 10. Sessions - DELETE /v1/sessions/:id
app.delete("/v1/sessions/:id", (req: Request, res: Response): any => {
  const { id } = req.params;
  return res.status(200).json(successEnvelope({
    status: "revoked",
    session_id: id
  }));
});

// 11. Devices - GET /v1/devices
app.get("/v1/devices", (_req: Request, res: Response): any => {
  return res.status(200).json(successEnvelope([
    {
      device_id: "dev-001",
      tenant_id: "tenant-mock",
      public_key: "MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...",
      status: "active"
    }
  ]));
});

// 12. Devices - POST /v1/devices
app.post("/v1/devices", (req: Request, res: Response): any => {
  const { device_id, public_key, tenant_id } = req.body;
  if (!device_id || !public_key) {
    return res.status(400).json(errorEnvelope("INVALID_DEVICE_BODY", "Missing device_id or public_key."));
  }
  return res.status(200).json(successEnvelope({
    device_id,
    tenant_id: tenant_id || "tenant-mock",
    public_key,
    status: "active"
  }));
});

// 13. Devices - DELETE /v1/devices/:id
app.delete("/v1/devices/:id", (req: Request, res: Response): any => {
  const { id } = req.params;
  return res.status(200).json(successEnvelope({
    status: "revoked",
    device_id: id
  }));
});

// 14. Organizations - GET /v1/organizations
app.get("/v1/organizations", (_req: Request, res: Response): any => {
  return res.status(200).json(successEnvelope([
    {
      organization_id: "org-001",
      name: "Mock Org",
      domain: "mock.org"
    }
  ]));
});

// 15. Organizations - POST /v1/organizations
app.post("/v1/organizations", (req: Request, res: Response): any => {
  const { organization_id, name, domain } = req.body;
  if (!organization_id || !name || !domain) {
    return res.status(400).json(errorEnvelope("INVALID_ORG_BODY", "Missing required organization parameters."));
  }
  return res.status(200).json(successEnvelope({ organization_id, name, domain }));
});

// 16. Organizations - GET /v1/organizations/:id/members
app.get("/v1/organizations/:id/members", (req: Request, res: Response): any => {
  const { id } = req.params;
  return res.status(200).json(successEnvelope([
    {
      identity_id: "member-001",
      email: "member@mock.org",
      name: "Mock Member",
      org_id: id
    }
  ]));
});

// 17. Risk - POST /v1/risk/evaluate
app.post("/v1/risk/evaluate", (req: Request, res: Response): any => {
  const { device_id } = req.body;
  if (!device_id) {
    return res.status(400).json(errorEnvelope("INVALID_RISK_BODY", "Missing device_id."));
  }
  return res.status(200).json(successEnvelope({
    risk_score: 0.15,
    action: "allow"
  }));
});

// 18. Billing - GET /v1/billing/tier
app.get("/v1/billing/tier", (_req: Request, res: Response): any => {
  return res.status(200).json(successEnvelope({
    tier: "enterprise",
    limit: 1000000,
    used: 45000,
    overage_fee: 0.00
  }));
});

// 19. Developers - GET /v1/developers/keys
app.get("/v1/developers/keys", (_req: Request, res: Response): any => {
  return res.status(200).json(successEnvelope([
    {
      key_id: "key-001",
      tenant_id: "tenant-mock",
      name: "Admin Key",
      prefix: "crth_live_",
      created_at: new Date().toISOString()
    }
  ]));
});

// 20. Developers - POST /v1/developers/keys
app.post("/v1/developers/keys", (req: Request, res: Response): any => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json(errorEnvelope("INVALID_KEY_BODY", "Missing key name."));
  }
  return res.status(201).json(successEnvelope({
    key_id: "key-12345",
    tenant_id: "tenant-mock",
    name,
    prefix: "crth_live_",
    secret: "crth_live_secret_key_plain_text_exactly_once",
    created_at: new Date().toISOString()
  }));
});

// 21. Developers - DELETE /v1/developers/keys/:id
app.delete("/v1/developers/keys/:id", (req: Request, res: Response): any => {
  return res.status(200).json(successEnvelope({
    status: "revoked",
    key_id: req.params.id
  }));
});

// 22. Audit - GET /v1/audit/logs
app.get("/v1/audit/logs", (_req: Request, res: Response): any => {
  return res.status(200).json(successEnvelope([
    {
      event_id: "evt-001",
      actor: "device-001",
      action: "device.authenticate",
      status: "success",
      timestamp: new Date().toISOString()
    }
  ]));
});

// Start listening
const server = app.listen(PORT, () => {
  console.log(`Mock server running on port ${PORT}`);
});

process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Mock server closed.");
  });
});
