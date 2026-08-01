import * as React from "react";
import { CorthanClient, CorthanConfig } from "@corthan/sdk";

export interface CorthanContextValue {
  client: CorthanClient;
}

export const CorthanContext = React.createContext<CorthanContextValue | null>(null);

export interface CorthanProviderProps {
  client?: CorthanClient;
  config?: CorthanConfig;
  children?: React.ReactNode;
}

export const CorthanProvider: React.FC<CorthanProviderProps> = ({
  client,
  config,
  children
}) => {
  const contextValue = React.useMemo(() => {
    if (client) {
      return { client };
    }
    const newClient = new CorthanClient(config || {});
    return { client: newClient };
  }, [client, config]);

  return React.createElement(CorthanContext.Provider, { value: contextValue }, children);
};

export function useCorthanClient(): CorthanClient {
  const context = React.useContext(CorthanContext);
  if (!context) {
    throw new Error("useCorthanClient must be used within a CorthanProvider");
  }
  return context.client;
}
