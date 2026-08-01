import { TransportClient } from "../src/transport.js";
import { Logger } from "../src/logger.js";

describe("TransportClient Unit Tests", () => {
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
  });

  it("should redact sensitive fields in logged payloads", async () => {
    const transport = new TransportClient({
      baseURL: "http://localhost:8080/v1",
      token: "secret-token",
      maxRetries: 1,
      retryMinDelay: 10,
      retryMaxDelay: 50,
      logger: mockLogger,
      timeout: 1000
    });

    // Mock fetch globally
    const mockResponse = {
      status: 200,
      statusText: "OK",
      headers: new Headers(),
      text: async () => JSON.stringify({
        status: "success",
        data: {
          token: "session-token-123",
          secret: "developer-secret-abc",
          limit: 1000,
          used: 20,
          normal_field: "hello"
        }
      })
    };

    const fetchSpy = jest.spyOn(globalThis, "fetch").mockResolvedValue(mockResponse as Response);

    const body = {
      password: "my-secure-password",
      private_key: "-----BEGIN EC PRIVATE KEY-----...",
      safe_data: "welcome"
    };

    await transport.request("POST", "/test", body);

    expect(fetchSpy).toHaveBeenCalled();

    // Check that request log contains redactions
    const requestLogCall = mockLogger.debug.mock.calls.find(c => c[0].includes("HTTP Request"));
    expect(requestLogCall).toBeDefined();
    expect(requestLogCall![0]).toContain("[REDACTED]");
    expect(requestLogCall![0]).not.toContain("my-secure-password");
    expect(requestLogCall![0]).toContain("welcome");

    // Check that response log contains redactions
    const responseLogCall = mockLogger.debug.mock.calls.find(c => c[0].includes("HTTP Response Payload"));
    expect(responseLogCall).toBeDefined();
    expect(responseLogCall![0]).toContain("[REDACTED]");
    expect(responseLogCall![0]).not.toContain("session-token-123");
    expect(responseLogCall![0]).toContain("hello");

    fetchSpy.mockRestore();
  });

  it("should calculate backoff durations correctly", () => {
    const transport = new TransportClient({
      baseURL: "http://localhost:8080/v1",
      maxRetries: 3,
      retryMinDelay: 100,
      retryMaxDelay: 1000,
      logger: mockLogger,
      timeout: 1000
    });

    const calculateBackoff = (transport as any).calculateBackoff.bind(transport);

    // Default backoff values
    const delay1 = calculateBackoff(1, null);
    expect(delay1).toBeGreaterThanOrEqual(100);
    expect(delay1).toBeLessThanOrEqual(125);

    const delay2 = calculateBackoff(2, null);
    expect(delay2).toBeGreaterThanOrEqual(200);
    expect(delay2).toBeLessThanOrEqual(250);

    // Parsing Retry-After header
    const headers = new Headers();
    headers.set("Retry-After", "5");
    const retryDelay = calculateBackoff(1, headers);
    expect(retryDelay).toBe(5000);
  });
});
