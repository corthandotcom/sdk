/**
 * Represent a structured error returned by the Corthan API.
 */
export class CorthanError extends Error {
  public readonly code: string;
  public readonly resolution?: string;
  public readonly traceId?: string;
  public readonly httpStatus: number;
  public readonly rawBody?: string;

  constructor(params: {
    code: string;
    message: string;
    resolution?: string;
    traceId?: string;
    httpStatus: number;
    rawBody?: string;
  }) {
    super(params.message);
    this.name = "CorthanError";
    this.code = params.code;
    this.resolution = params.resolution;
    this.traceId = params.traceId;
    this.httpStatus = params.httpStatus;
    this.rawBody = params.rawBody;

    // Maintain stack trace in V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CorthanError);
    }
  }

  override toString(): string {
    if (this.traceId) {
      return `Corthan API Error [${this.httpStatus} - ${this.code}]: ${this.message} (Trace ID: ${this.traceId})`;
    }
    return `Corthan API Error [${this.httpStatus} - ${this.code}]: ${this.message}`;
  }
}

/**
 * Checks whether an HTTP status code is retryable (429 or 5xx).
 */
export function isRetryableStatus(status: number): boolean {
  return status === 429 || (status >= 500 && status <= 599);
}
