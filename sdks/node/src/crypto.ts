import * as crypto from "crypto";
import { Assertion } from "./types.js";

/**
 * Signs a device auth assertion using a PEM-encoded P-256 ECDSA private key.
 * The payload signature covers "device_id:tenant_id:nonce:timestamp".
 *
 * @param deviceId Client identifier of the registering device.
 * @param tenantId Tenant identifier.
 * @param nonce Unique random challenge verification token.
 * @param privateKeyPem PEM-encoded EC Private Key string (SEC1 or PKCS8 format).
 * @returns Formatted assertion payload.
 */
export function generateAssertion(
  deviceId: string,
  tenantId: string,
  nonce: string,
  privateKeyPem: string
): Assertion {
  const timestamp = new Date().toISOString();
  const payload = `${deviceId}:${tenantId}:${nonce}:${timestamp}`;

  const signer = crypto.createSign("SHA256");
  signer.update(payload);

  const signatureDer = signer.sign({
    key: privateKeyPem,
    format: "pem"
  });

  const signature = signatureDer.toString("base64");

  return {
    device_id: deviceId,
    tenant_id: tenantId,
    nonce,
    timestamp,
    signature
  };
}
