import * as React from "react";
import { renderHook, act } from "@testing-library/react";
import { CorthanProvider, useBilling } from "../src/index.js";
import { CorthanClient } from "@corthan/sdk";
import * as storageDefault from "../src/internal/storage.js";
import * as storageIos from "../src/internal/storage.ios.js";
import * as storageAndroid from "../src/internal/storage.android.js";

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

describe("React Native SDK Hook and Platform Resolution Tests", () => {
  let client: jest.Mocked<CorthanClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    client = new CorthanClient({}) as any;
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(CorthanProvider, { client }, children);

  describe("Hooks State Verification", () => {
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

  describe("Platform-Specific File Resolution", () => {
    it("should resolve correct storage adapters for base, iOS, and Android modules", async () => {
      const defaultStorage = storageDefault.getPlatformStorage();
      const iosStorage = storageIos.getPlatformStorage();
      const androidStorage = storageAndroid.getPlatformStorage();

      expect(defaultStorage).toBeDefined();
      expect(iosStorage).toBeDefined();
      expect(androidStorage).toBeDefined();

      // Verify that iOS keychain logging is present
      const spyIosLog = jest.spyOn(console, "log").mockImplementation(() => {});
      await iosStorage.setItem("test-key", "test-val");
      expect(spyIosLog).toHaveBeenCalledWith(
        expect.stringContaining("iOS Keychain: saving key \"test-key\"")
      );

      // Verify that Android keystore logging is present
      const spyAndroidLog = jest.spyOn(console, "log").mockImplementation(() => {});
      await androidStorage.setItem("test-key", "test-val");
      expect(spyAndroidLog).toHaveBeenCalledWith(
        expect.stringContaining("Android KeyStore: saving key \"test-key\"")
      );

      spyIosLog.mockRestore();
      spyAndroidLog.mockRestore();
    });
  });
});
