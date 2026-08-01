import { TransportClient } from "../transport";
import { Organization, OrganizationListSuccess, OrganizationMemberListSuccess, OrganizationSuccess } from "../types";

/**
 * Service for managing Organizations and multi-tenant domain mapping.
 */
export class OrganisationService {
  constructor(private transport: TransportClient) {}

  /**
   * Registers a new business tenant Organization.
   */
  public async create(org: Organization): Promise<OrganizationSuccess> {
    return this.transport.request<OrganizationSuccess>("POST", "/organizations", org);
  }

  /**
   * Retrieves organization configuration by identifier.
   */
  public async get(id: string): Promise<OrganizationSuccess> {
    return this.transport.request<OrganizationSuccess>("GET", `/organizations/${id}`);
  }

  /**
   * Lists all organization tenants mapped to the authenticated user.
   */
  public async list(): Promise<OrganizationListSuccess> {
    return this.transport.request<OrganizationListSuccess>("GET", "/organizations");
  }

  /**
   * Lists users who are members of an organization.
   */
  public async listMembers(orgId: string): Promise<OrganizationMemberListSuccess> {
    return this.transport.request<OrganizationMemberListSuccess>("GET", `/organizations/${orgId}/members`);
  }
}
