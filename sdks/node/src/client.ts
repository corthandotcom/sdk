import { TransportClient } from "./transport";
import { Logger, NoOpLogger } from "./logger";

// Services
import { AuthService } from "./services/auth";
import { IdentityService } from "./services/identity";
import { SessionService } from "./services/session";
import { DeviceService } from "./services/device";
import { OrganisationService } from "./services/organisation";
import { DeveloperService } from "./services/developer";
import { BillingService } from "./services/billing";
import { AuditService } from "./services/audit";

/**
 * Customization parameters for the CorthanClient.
 */
export interface CorthanConfig {
  /** The base endpoint URL of the Corthan API. Defaults to 'https://api.corthan.com/v1'. */
  baseURL?: string;
  /** JWT Bearer token used for authorization headers. */
  token?: string;
  /** Timeout in milliseconds for request abort triggers. Defaults to 30000. */
  timeout?: number;
  /** Maximum retry attempts for transient network or server errors. Defaults to 3. */
  maxRetries?: number;
  /** Minimum delay duration in milliseconds for exponential backoffs. Defaults to 200. */
  retryMinDelay?: number;
  /** Maximum delay duration in milliseconds for exponential backoffs. Defaults to 5000. */
  retryMaxDelay?: number;
  /** Custom logger implementation. Defaults to NoOpLogger. */
  logger?: Logger;
}

/**
 * Root coordinator client for interacting with all Corthan API services.
 */
export class CorthanClient {
  private readonly config: Required<CorthanConfig>;
  private readonly transport: TransportClient;

  public readonly auth: AuthService;
  public readonly identity: IdentityService;
  public readonly session: SessionService;
  public readonly device: DeviceService;
  public readonly organisation: OrganisationService;
  public readonly developer: DeveloperService;
  public readonly billing: BillingService;
  public readonly audit: AuditService;

  constructor(config: CorthanConfig = {}) {
    this.config = {
      baseURL: config.baseURL ?? "https://api.corthan.com/v1",
      token: config.token ?? "",
      timeout: config.timeout ?? 30000,
      maxRetries: config.maxRetries ?? 3,
      retryMinDelay: config.retryMinDelay ?? 200,
      retryMaxDelay: config.retryMaxDelay ?? 5000,
      logger: config.logger ?? new NoOpLogger()
    };

    this.transport = new TransportClient({
      baseURL: this.config.baseURL,
      token: this.config.token,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      retryMinDelay: this.config.retryMinDelay,
      retryMaxDelay: this.config.retryMaxDelay,
      logger: this.config.logger
    });

    // Wire up services
    this.auth = new AuthService(this.transport);
    this.identity = new IdentityService(this.transport);
    this.session = new SessionService(this.transport);
    this.device = new DeviceService(this.transport);
    this.organisation = new OrganisationService(this.transport);
    this.developer = new DeveloperService(this.transport);
    this.billing = new BillingService(this.transport);
    this.audit = new AuditService(this.transport);
  }

  /**
   * Updates the Bearer authorization token dynamically for subsequent requests.
   */
  public setToken(token: string): void {
    this.config.token = token;
    this.transport.updateToken(token);
  }
}
