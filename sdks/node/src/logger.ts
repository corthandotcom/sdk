/**
 * Structured logger interface used by the SDK.
 */
export interface Logger {
  /** Log a message at the debug level. */
  debug(msg: string, ...args: any[]): void;
  /** Log a message at the info level. */
  info(msg: string, ...args: any[]): void;
  /** Log a message at the warn level. */
  warn(msg: string, ...args: any[]): void;
  /** Log a message at the error level. */
  error(msg: string, ...args: any[]): void;
}

/**
 * NoOpLogger discards all logging output.
 */
export class NoOpLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

/**
 * StdLogger outputs logs to the standard stdout/stderr streams.
 */
export class StdLogger implements Logger {
  /**
   * @param verbose If true, debug logs are written to stdout.
   */
  constructor(private verbose: boolean = false) {}

  debug(msg: string, ...args: any[]): void {
    if (this.verbose) {
      console.log(`[corthan-sdk] DEBUG: ${msg}`, ...args);
    }
  }

  info(msg: string, ...args: any[]): void {
    console.log(`[corthan-sdk] INFO: ${msg}`, ...args);
  }

  warn(msg: string, ...args: any[]): void {
    console.warn(`[corthan-sdk] WARN: ${msg}`, ...args);
  }

  error(msg: string, ...args: any[]): void {
    console.error(`[corthan-sdk] ERROR: ${msg}`, ...args);
  }
}
