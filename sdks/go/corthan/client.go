package corthan

import (
	"net/http"
	"time"
)

// ClientConfig holds customization parameters for the Corthan client.
type ClientConfig struct {
	BaseURL       string
	Token         string
	Timeout       time.Duration
	MaxRetries    int
	RetryMinDelay time.Duration
	RetryMaxDelay time.Duration
	Logger        Logger
	HTTPClient    *http.Client
}

// Client coordinates interaction with all Corthan API resources.
type Client struct {
	config    *ClientConfig
	transport *TransportClient

	Auth         *AuthService
	Identity     *IdentityService
	Session      *SessionService
	Device       *DeviceService
	Organisation *OrganisationService
	Developer    *DeveloperService
	Billing      *BillingService
	Audit        *AuditService
}

// DefaultConfig returns a ClientConfig populated with default configurations.
func DefaultConfig() *ClientConfig {
	return &ClientConfig{
		BaseURL:       "https://api.corthan.com/v1",
		Timeout:       30 * time.Second,
		MaxRetries:    3,
		RetryMinDelay: 200 * time.Millisecond,
		RetryMaxDelay: 5 * time.Second,
		Logger:        &NoOpLogger{},
		HTTPClient:    &http.Client{Timeout: 30 * time.Second},
	}
}

// NewClient creates a Client using custom configuration parameters.
func NewClient(config *ClientConfig) *Client {
	defaults := DefaultConfig()

	if config.BaseURL == "" {
		config.BaseURL = defaults.BaseURL
	}
	if config.Timeout == 0 {
		config.Timeout = defaults.Timeout
	}
	if config.MaxRetries == 0 {
		config.MaxRetries = defaults.MaxRetries
	}
	if config.RetryMinDelay == 0 {
		config.RetryMinDelay = defaults.RetryMinDelay
	}
	if config.RetryMaxDelay == 0 {
		config.RetryMaxDelay = defaults.RetryMaxDelay
	}
	if config.Logger == nil {
		config.Logger = defaults.Logger
	}
	if config.HTTPClient == nil {
		config.HTTPClient = defaults.HTTPClient
	}
	config.HTTPClient.Timeout = config.Timeout

	tpClient := NewTransportClient(
		config.HTTPClient,
		config.BaseURL,
		config.Token,
		config.MaxRetries,
		config.RetryMinDelay,
		config.RetryMaxDelay,
		config.Logger,
	)

	c := &Client{
		config:    config,
		transport: tpClient,
	}

	// Initialize Services
	c.Auth = &AuthService{t: tpClient}
	c.Identity = &IdentityService{t: tpClient}
	c.Session = &SessionService{t: tpClient}
	c.Device = &DeviceService{t: tpClient}
	c.Organisation = &OrganisationService{t: tpClient}
	c.Developer = &DeveloperService{t: tpClient}
	c.Billing = &BillingService{t: tpClient}
	c.Audit = &AuditService{t: tpClient}

	return c
}

// SetToken dynamically updates the Bearer Token used for requests.
func (c *Client) SetToken(token string) {
	c.config.Token = token
	c.transport.UpdateToken(token)
}
