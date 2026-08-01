import * as React from "react";
import { renderHook, act } from "@testing-library/react";
import { CorthanProvider, useBilling, useIdentity } from "../src/index.js";
import { CorthanClient } from "@corthan/sdk";

// Mock CorthanClient
jest.mock("@corthan/sdk", () => {
  return {
    CorthanClient: jest.fn().mockImplementation(() => {
      return {
        auth: {
          authenticate: jest.fn(),
          createQRSession: jest.fn(),
          confirmQRSession: jest.fn(),
          pollQRSession: jest.fn()
        },
        identity: {
          get: jest.fn(),
          register: jest.fn(),
          update: jest.fn()
        },
        session: {
          list: jest.fn(),
          revoke: jest.fn()
        },
        device: {
          register: jest.fn(),
          list: jest.fn(),
          revoke: jest.fn()
        },
        organisation: {
          create: jest.fn(),
          get: jest.fn(),
          list: jest.fn(),
          listMembers: jest.fn()
        },
        developer: {
          createKey: jest.fn(),
          listKeys: jest.fn(),
          revokeKey: jest.fn()
        },
        billing: {
          getTier: jest.fn()
        },
        audit: {
          listLogs: jest.fn(),
          evaluateRisk: jest.fn(),
          getPermissions: jest.fn()
        }
      };
    })
  };
});

describe("React SDK Custom Hooks", () => {
  let client: jest.Mocked<CorthanClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new CorthanClient({}) as any;
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CorthanProvider client={client}>{children}</CorthanProvider>
  );

  describe("useBilling Hook", () => {
    it("should initialize with default states and execute successfully", async () => {
      const mockResult = {
        status: "success",
        data: {
          tier: "enterprise",
          limit: "1000000",
          used: "45000",
          overage_fee: "0"
        },
        meta: {
          version: "1.0.0",
          timestamp: "2026-08-01T22:00:00Z",
          trace_id: "tr-123"
        }
      };
      (client.billing.getTier as jest.Mock).mockResolvedValueOnce(mockResult);

      const { result } = renderHook(() => useBilling(), { wrapper });

      // Initial checks
      expect(result.current.getTier.loading).toBe(false);
      expect(result.current.getTier.data).toBeNull();
      expect(result.current.getTier.error).toBeNull();

      // Trigger execute
      let promise: Promise<any>;
      act(() => {
        promise = result.current.getTier.execute();
      });

      // Verify loading state
      expect(result.current.getTier.loading).toBe(true);

      // Await result
      await act(async () => {
        await promise;
      });

      // Verify final states
      expect(result.current.getTier.loading).toBe(false);
      expect(result.current.getTier.data).toEqual(mockResult);
      expect(result.current.getTier.error).toBeNull();
    });

    it("should transition to error state upon API failures", async () => {
      const mockError = new Error("API Limit Exceeded");
      (client.billing.getTier as jest.Mock).mockRejectedValueOnce(mockError);

      const { result } = renderHook(() => useBilling(), { wrapper });

      let promise: Promise<any>;
      act(() => {
        promise = result.current.getTier.execute();
      });

      expect(result.current.getTier.loading).toBe(true);

      // Catch error
      await act(async () => {
        try {
          await promise;
        } catch (e) {
          // expected
        }
      });

      expect(result.current.getTier.loading).toBe(false);
      expect(result.current.getTier.data).toBeNull();
      expect(result.current.getTier.error).toBe(mockError);
    });
  });

  describe("useIdentity Hook", () => {
    it("should execute registered identity queries successfully", async () => {
      const mockIdentity = {
        status: "success",
        data: {
          identity_id: "user-123",
          email: "test@corthan.com"
        },
        meta: {
          version: "1.0.0",
          timestamp: "2026-08-01T22:00:00Z",
          trace_id: "tr-456"
        }
      };
      (client.identity.get as jest.Mock).mockResolvedValueOnce(mockIdentity);

      const { result } = renderHook(() => useIdentity(), { wrapper });

      let promise: Promise<any>;
      act(() => {
        promise = result.current.get.execute("user-123");
      });

      expect(result.current.get.loading).toBe(true);

      await act(async () => {
        await promise;
      });

      expect(result.current.get.loading).toBe(false);
      expect(result.current.get.data).toEqual(mockIdentity);
      expect(client.identity.get).toHaveBeenCalledWith("user-123");
    });
  });
});
