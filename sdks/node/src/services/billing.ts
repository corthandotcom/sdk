import { TransportClient } from "../transport";
import { BillingTierSuccess } from "../types";

/**
 * Service for querying billing tier limits and usage meters.
 */
export class BillingService {
  constructor(private transport: TransportClient) {}

  /**
   * Retrieves active billing tier details and quota usage rates.
   */
  public async getTier(): Promise<BillingTierSuccess> {
    return this.transport.request<BillingTierSuccess>("GET", "/billing/tier");
  }
}
