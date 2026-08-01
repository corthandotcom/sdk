import { CorthanError, isRetryableStatus } from "./error.js";
import { Logger } from "./logger.js";
import { ErrorEnvelope } from "./types.js";

export interface TransportOptions {
  baseURL: string;
  token?: string;
  maxRetries: number;
  retryMinDelay: number;
  retryMaxDelay: number;
  logger: Logger;
  timeout: number;
}

/**
 * Underlying HTTP transport client wrapping standard fetch.
 */
export class TransportClient {
  private baseURL: string;
  private token?: string;
  private maxRetries: number;
  private retryMinDelay: number;
  private retryMaxDelay: number;
  private logger: Logger;
  private timeout: number;

  constructor(options: TransportOptions) {
    this.baseURL = options.baseURL.replace(/\/$/, "");
    this.token = options.token;
    this.maxRetries = options.maxRetries;
    this.retryMinDelay = options.retryMinDelay;
    this.retryMaxDelay = options.retryMaxDelay;
    this.logger = options.logger;
    this.timeout = options.timeout;
  }

  public updateToken(token: string): void {
    this.token = token;
  }

  /**
   * Execute an HTTP request with retries, timeout, and diagnostic logging.
   */
  public async request<T>(
    method: string,
    path: string,
    body?: any,
    options?: { headers?: Record<string, string>; query?: Record<string, string> }
  ): Promise<T> {
    const urlObj = new URL(this.baseURL + path);
    if (options?.query) {
      for (const [k, v] of Object.entries(options.query)) {
        if (v !== undefined) {
          urlObj.searchParams.set(k, v);
        }
      }
    }
    const url = urlObj.toString();

    let serializedBody: string | undefined;
    if (body !== undefined) {
      serializedBody = JSON.stringify(body);
    }

    let attempts = 0;
    while (true) {
      attempts++;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "corthan-node-sdk/1.0.0",
        ...options?.headers
      };

      if (this.token) {
        headers["Authorization"] = `Bearer ${this.token}`;
      }

      this.logRequest(method, url, serializedBody);
      const start = Date.now();

      let response: Response | undefined = undefined;
      let networkError: any = null;

      try {
        response = await fetch(url, {
          method,
          headers,
          body: serializedBody,
          signal: controller.signal
        });
      } catch (err: any) {
        networkError = err;
      } finally {
        clearTimeout(timeoutId);
      }

      const duration = Date.now() - start;
      let shouldRetry = false;
      let delay = 0;

      if (networkError) {
        this.logger.warn(`HTTP request failed: ${networkError.message || networkError}`, { attempt: attempts });
        shouldRetry = true;
        delay = this.calculateBackoff(attempts, null);
      } else {
        const resp = response!;
        this.logger.debug(`HTTP response: ${resp.status} ${resp.statusText} (duration: ${duration}ms)`);

        if (isRetryableStatus(resp.status)) {
          shouldRetry = true;
          delay = this.calculateBackoff(attempts, resp.headers);
        }
      }

      if (shouldRetry && attempts <= this.maxRetries) {
        this.logger.info(`Retrying request in ${delay}ms (attempt ${attempts}/${this.maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (networkError) {
        throw new Error(`HTTP request failed after max attempts: ${networkError.message || networkError}`);
      }

      const resp = response!;
      // Handle non-2xx errors
      if (resp.status < 200 || resp.status >= 300) {
        throw await this.parseErrorResponse(resp, url);
      }

      // Parse success response
      const rawText = await resp.text();
      this.logResponse(rawText);

      if (!rawText) {
        return {} as T;
      }

      try {
        return JSON.parse(rawText) as T;
      } catch (err: any) {
        throw new Error(`Failed to parse response JSON: ${err.message} (body: ${rawText})`);
      }
    }
  }

  private calculateBackoff(attempt: number, headers: Headers | null): number {
    if (headers) {
      const retryAfter = headers.get("Retry-After");
      if (retryAfter) {
        const seconds = parseInt(retryAfter, 10);
        if (!isNaN(seconds)) {
          return seconds * 1000;
        }
        const date = Date.parse(retryAfter);
        if (!isNaN(date)) {
          const delay = date - Date.now();
          if (delay > 0) {
            return delay;
          }
        }
      }
    }

    // Jittered exponential backoff
    const factor = Math.pow(2, attempt - 1);
    const delay = this.retryMinDelay * factor;
    const jitter = Math.random() * 0.25 * delay;
    const finalDelay = delay + jitter;

    return Math.min(finalDelay, this.retryMaxDelay);
  }

  private async parseErrorResponse(response: Response, url: string): Promise<CorthanError> {
    const rawBody = await response.text();
    try {
      const envelope = JSON.parse(rawBody) as ErrorEnvelope;
      if (envelope?.error?.code) {
        return new CorthanError({
          httpStatus: response.status,
          code: envelope.error.code,
          message: envelope.error.message,
          resolution: envelope.error.resolution,
          traceId: envelope.error.trace_id,
          rawBody
        });
      }
    } catch {
      // Body is not JSON
    }

    return new CorthanError({
      httpStatus: response.status,
      code: "RAW_ERROR",
      message: `Raw HTTP failure status: ${response.status} at ${url}`,
      rawBody
    });
  }

  private logRequest(method: string, url: string, rawBody?: string): void {
    if (!rawBody) {
      this.logger.debug(`HTTP Request: ${method} ${url}`);
      return;
    }
    const redacted = this.redactJSON(rawBody);
    this.logger.debug(`HTTP Request: ${method} ${url} Payload: ${redacted}`);
  }

  private logResponse(rawBody: string): void {
    if (!rawBody) return;
    const redacted = this.redactJSON(rawBody);
    this.logger.debug(`HTTP Response Payload: ${redacted}`);
  }

  private redactJSON(body: string): string {
    try {
      const parsed = JSON.parse(body);
      this.redactNode(parsed);
      return JSON.stringify(parsed);
    } catch {
      return body;
    }
  }

  private redactNode(node: any): void {
    if (node && typeof node === "object") {
      if (Array.isArray(node)) {
        for (const item of node) {
          this.redactNode(item);
        }
      } else {
        for (const key of Object.keys(node)) {
          if (this.isSensitiveKey(key)) {
            node[key] = "[REDACTED]";
          } else {
            this.redactNode(node[key]);
          }
        }
      }
    }
  }

  private isSensitiveKey(key: string): boolean {
    const k = key.toLowerCase();
    return (
      k.includes("token") ||
      k.includes("secret") ||
      k.includes("password") ||
      k.includes("private_key") ||
      k.includes("limit") ||
      k.includes("used") ||
      k.includes("overage")
    );
  }
}
