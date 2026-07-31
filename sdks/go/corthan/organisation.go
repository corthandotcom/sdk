package corthan

import (
	"context"
	"fmt"
	"net/http"
)

// OrganisationService wraps Organisation operations.
type OrganisationService struct {
	t *TransportClient
}

// List retrieves organizations.
func (s *OrganisationService) List(ctx context.Context) (*OrganizationListSuccess, error) {
	var result OrganizationListSuccess
	err := s.t.Request(ctx, http.MethodGet, "/organizations", nil, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// Create registers a new organization.
func (s *OrganisationService) Create(ctx context.Context, org *Organization) (*OrganizationSuccess, error) {
	var result OrganizationSuccess
	err := s.t.Request(ctx, http.MethodPost, "/organizations", org, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// ListMembers retrieves user memberships of an organization.
func (s *OrganisationService) ListMembers(ctx context.Context, id string) (*OrganizationMemberListSuccess, error) {
	path := fmt.Sprintf("/organizations/%s/members", id)
	var result OrganizationMemberListSuccess
	err := s.t.Request(ctx, http.MethodGet, path, nil, &result)
	if err != nil {
		return nil, err
	}
	return &result, nil
}
