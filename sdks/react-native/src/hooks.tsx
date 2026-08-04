import * as React from "react";
import { useCorthanClient } from "./context.js";
import {
  Assertion,
  AuthTokenSuccess,
  QRSessionCreateSuccess,
  QRConfirmRequest,
  QRConfirmSuccess,
  QRPollSuccess,
  Identity,
  IdentitySuccess,
  IdentityUpdate,
  SessionListSuccess,
  SessionRevokedSuccess,
  DeviceCreate,
  DeviceListSuccess,
  DeviceRevokedSuccess,
  DeviceSuccess,
  Organization,
  OrganizationListSuccess,
  OrganizationMemberListSuccess,
  OrganizationSuccess,
  DeveloperKeyCreateSuccess,
  DeveloperKeyListSuccess,
  BillingTierSuccess,
  AuditLogListSuccess,
  PermissionsSuccess
} from "@corthan/sdk";

export interface AsyncState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}

export interface AsyncAction<Args extends any[], Result> extends AsyncState<Result> {
  execute: (...args: Args) => Promise<Result>;
}

/**
 * Generic internal helper hook to wrap async SDK requests with state monitoring.
 */
export function useAsyncAction<Args extends any[], Result>(
  action: (...args: Args) => Promise<Result>
): AsyncAction<Args, Result> {
  const [state, setState] = React.useState<AsyncState<Result>>({
    data: null,
    error: null,
    loading: false
  });

  const isMounted = React.useRef(true);
  React.useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const execute = React.useCallback(
    async (...args: Args): Promise<Result> => {
      if (isMounted.current) {
        setState({ data: null, error: null, loading: true });
      }
      try {
        const result = await action(...args);
        if (isMounted.current) {
          setState({ data: result, error: null, loading: false });
        }
        return result;
      } catch (err: any) {
        if (isMounted.current) {
          setState({ data: null, error: err as Error, loading: false });
        }
        throw err;
      }
    },
    [action]
  );

  return {
    ...state,
    execute
  };
}

/**
 * Hook for managing Corthan authentication mechanisms.
 */
export function useAuth() {
  const client = useCorthanClient();

  const authenticate = useAsyncAction<[assertion: Assertion], AuthTokenSuccess>(
    client.auth.authenticate.bind(client.auth)
  );

  const createQRSession = useAsyncAction<[tenantId: string], QRSessionCreateSuccess>(
    client.auth.createQRSession.bind(client.auth)
  );

  const confirmQRSession = useAsyncAction<[confirmReq: QRConfirmRequest], QRConfirmSuccess>(
    client.auth.confirmQRSession.bind(client.auth)
  );

  const pollQRSession = useAsyncAction<[qrSessionId: string, tenantId: string], QRPollSuccess>(
    client.auth.pollQRSession.bind(client.auth)
  );

  return {
    authenticate,
    createQRSession,
    confirmQRSession,
    pollQRSession
  };
}

/**
 * Hook for managing Identity user profiles.
 */
export function useIdentity() {
  const client = useCorthanClient();

  const get = useAsyncAction<[id: string], IdentitySuccess>(
    client.identity.get.bind(client.identity)
  );

  const register = useAsyncAction<[profile: Identity], IdentitySuccess>(
    client.identity.register.bind(client.identity)
  );

  const update = useAsyncAction<[id: string, profile: IdentityUpdate], IdentitySuccess>(
    client.identity.update.bind(client.identity)
  );

  return {
    get,
    register,
    update
  };
}

/**
 * Hook for managing active sessions.
 */
export function useSession() {
  const client = useCorthanClient();

  const list = useAsyncAction<[], SessionListSuccess>(
    client.session.list.bind(client.session)
  );

  const revoke = useAsyncAction<[id: string], SessionRevokedSuccess>(
    client.session.revoke.bind(client.session)
  );

  return {
    list,
    revoke
  };
}

/**
 * Hook for registering and auditing client hardware devices.
 */
export function useDevice() {
  const client = useCorthanClient();

  const register = useAsyncAction<[device: DeviceCreate], DeviceSuccess>(
    client.device.register.bind(client.device)
  );

  const list = useAsyncAction<[], DeviceListSuccess>(
    client.device.list.bind(client.device)
  );

  const revoke = useAsyncAction<[id: string], DeviceRevokedSuccess>(
    client.device.revoke.bind(client.device)
  );

  return {
    register,
    list,
    revoke
  };
}

/**
 * Hook for managing Organizations and multi-tenant domain mapping.
 */
export function useOrganisation() {
  const client = useCorthanClient();

  const create = useAsyncAction<[org: Organization], OrganizationSuccess>(
    client.organisation.create.bind(client.organisation)
  );

  const get = useAsyncAction<[id: string], OrganizationSuccess>(
    client.organisation.get.bind(client.organisation)
  );

  const list = useAsyncAction<[], OrganizationListSuccess>(
    client.organisation.list.bind(client.organisation)
  );

  const listMembers = useAsyncAction<[orgId: string], OrganizationMemberListSuccess>(
    client.organisation.listMembers.bind(client.organisation)
  );

  return {
    create,
    get,
    list,
    listMembers
  };
}

/**
 * Hook for managing developer access keys.
 */
export function useDeveloper() {
  const client = useCorthanClient();

  const createKey = useAsyncAction<[label: string], DeveloperKeyCreateSuccess>(
    client.developer.createKey.bind(client.developer)
  );

  const listKeys = useAsyncAction<[], DeveloperKeyListSuccess>(
    client.developer.listKeys.bind(client.developer)
  );

  const revokeKey = useAsyncAction<[keyId: string], void>(
    client.developer.revokeKey.bind(client.developer)
  );

  return {
    createKey,
    listKeys,
    revokeKey
  };
}

/**
 * Hook for querying billing tier limits and usage meters.
 */
export function useBilling() {
  const client = useCorthanClient();

  const getTier = useAsyncAction<[], BillingTierSuccess>(
    client.billing.getTier.bind(client.billing)
  );

  return {
    getTier
  };
}

/**
 * Hook for querying audit log trails and querying permissions.
 */
export function useAudit() {
  const client = useCorthanClient();

  const listLogs = useAsyncAction<[], AuditLogListSuccess>(
    client.audit.listLogs.bind(client.audit)
  );

  const getPermissions = useAsyncAction<[], PermissionsSuccess>(
    client.audit.getPermissions.bind(client.audit)
  );

  return {
    listLogs,
    getPermissions
  };
}
