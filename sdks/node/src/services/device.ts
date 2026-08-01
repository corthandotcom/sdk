import { TransportClient } from "../transport";
import { DeviceCreate, DeviceListSuccess, DeviceRevokedSuccess, DeviceSuccess } from "../types";

/**
 * Service for registering and auditing client hardware devices.
 */
export class DeviceService {
  constructor(private transport: TransportClient) {}

  /**
   * Registers a hardware device and public key combination for authentication verification.
   */
  public async register(device: DeviceCreate): Promise<DeviceSuccess> {
    return this.transport.request<DeviceSuccess>("POST", "/devices", device);
  }

  /**
   * Retrieves all registered device keys for the authenticated profile.
   */
  public async list(): Promise<DeviceListSuccess> {
    return this.transport.request<DeviceListSuccess>("GET", "/devices");
  }

  /**
   * Revokes authentication privileges of a device public key.
   */
  public async revoke(id: string): Promise<DeviceRevokedSuccess> {
    return this.transport.request<DeviceRevokedSuccess>("DELETE", `/devices/${id}`);
  }
}
