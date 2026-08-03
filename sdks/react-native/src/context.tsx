import * as React from "react";
import { CorthanClient, CorthanConfig } from "@corthan/sdk";
import { SecureStorageAdapter } from "./internal/storage.js";
import { DeviceAttestationProvider } from "./internal/attestation.js";

export interface CorthanContextValue {
  client: CorthanClient;
  secureStorage: SecureStorageAdapter;
  attestationProvider?: DeviceAttestationProvider;
}

export const CorthanContext = React.createContext<CorthanContextValue | null>(null);

export interface CorthanProviderProps {
  client?: CorthanClient;
  config?: CorthanConfig;
  secureStorage?: SecureStorageAdapter;
  attestationProvider?: DeviceAttestationProvider;
  children: React.ReactNode;
}

export const CorthanProvider: React.FC<CorthanProviderProps> = ({
  client,
  config,
  secureStorage,
  attestationProvider,
  children
}) => {
  // Load platform-specific storage module dynamically if none injected
  const activeStorage = React.useMemo(() => {
    if (secureStorage) {
      return secureStorage;
    }
    // Falls back to runtime storage import which Metro resolves
    const { getPlatformStorage } = require("./internal/storage.js");
    return getPlatformStorage();
  }, [secureStorage]);

  const activeClient = React.useMemo(() => {
    if (client) {
      return client;
    }
    return new CorthanClient(config || {});
  }, [client, config]);

  const contextValue = React.useMemo(() => {
    return {
      client: activeClient,
      secureStorage: activeStorage,
      attestationProvider
    };
  }, [activeClient, activeStorage, attestationProvider]);

  return React.createElement(CorthanContext.Provider, { value: contextValue }, children);
};

export function useCorthanClient(): CorthanClient {
  const context = React.useContext(CorthanContext);
  if (!context) {
    throw new Error("useCorthanClient must be used within a CorthanProvider");
  }
  return context.client;
}

export function useCorthanContext(): CorthanContextValue {
  const context = React.useContext(CorthanContext);
  if (!context) {
    throw new Error("useCorthanContext must be used within a CorthanProvider");
  }
  return context;
}
