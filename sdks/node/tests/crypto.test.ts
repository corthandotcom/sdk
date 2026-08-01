import * as crypto from "crypto";
import { generateAssertion } from "../src/crypto.js";

describe("Crypto Assertion Signer", () => {
  it("should generate a valid ECDSA P-256 DER signature assertion", () => {
    // Generate P-256 keypair for testing
    const { privateKey, publicKey } = crypto.generateKeyPairSync("ec", {
      namedCurve: "P-256",
      privateKeyEncoding: {
        type: "sec1",
        format: "pem"
      },
      publicKeyEncoding: {
        type: "spki",
        format: "pem"
      }
    });

    const deviceId = "test-device-id";
    const tenantId = "test-tenant-id";
    const nonce = "test-nonce-12345";

    // Generate assertion
    const assertion = generateAssertion(deviceId, tenantId, nonce, privateKey);

    expect(assertion).toBeDefined();
    expect(assertion.device_id).toBe(deviceId);
    expect(assertion.tenant_id).toBe(tenantId);
    expect(assertion.nonce).toBe(nonce);
    expect(assertion.timestamp).toBeDefined();
    expect(assertion.signature).toBeDefined();

    // Verify signature using the public key
    const payload = `${deviceId}:${tenantId}:${nonce}:${assertion.timestamp}`;
    const verifier = crypto.createVerify("SHA256");
    verifier.update(payload);

    const isValid = verifier.verify(publicKey, Buffer.from(assertion.signature, "base64"));
    expect(isValid).toBe(true);
  });
});
