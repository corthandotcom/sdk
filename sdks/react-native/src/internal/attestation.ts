export interface DeviceAttestationProvider {
  getAttestation: (challenge: string) => Promise<string>;
}
