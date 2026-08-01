import * as crypto from "crypto";
import { CorthanClient, StdLogger, generateAssertion } from "../src/index";

async function main() {
  console.log("--- Running Node.js SDK Smoke Example ---");

  // 1. Generate EC P-256 keys dynamically
  const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "P-256",
    privateKeyEncoding: { type: "sec1", format: "pem" },
    publicKeyEncoding: { type: "spki", format: "pem" }
  });

  // 2. Initialize Corthan Client with StdLogger
  const client = new CorthanClient({
    baseURL: "http://localhost:8080/v1",
    logger: new StdLogger(true) // Verbose logging to inspect transport redactions
  });

  // 3. Register device public key
  console.log("\n[Example] Registering device...");
  const regDevice = await client.device.register({
    device_id: "example-device-555",
    tenant_id: "tenant-999",
    public_key: publicKey
  });
  console.log(`[Example] Device status: ${regDevice.data.status}`);

  // 4. Authenticate device
  console.log("\n[Example] Authenticating device...");
  const assertion = generateAssertion("example-device-555", "tenant-999", "random-challenge-xyz", privateKey);
  const authRes = await client.auth.authenticate(assertion);
  console.log(`[Example] Obtained session token: ${authRes.data.token}`);

  // 5. Update token in client coordinator
  client.setToken(authRes.data.token);

  // 6. Query Billing usage info
  console.log("\n[Example] Querying billing usage details...");
  const billingRes = await client.billing.getTier();
  console.log(`[Example] Billing Tier: ${billingRes.data.tier}`);
  console.log(`[Example] API requests quota: ${billingRes.data.used} / ${billingRes.data.limit}`);

  console.log("\n--- Node.js SDK Smoke Example Completed Successfully! ---");
}

main().catch((err) => {
  console.error("SDK Example Execution failed:", err);
  process.exit(1);
});
