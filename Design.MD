# Corthan SDK Platform — Architectural Design (Design.MD)

Repository: `corthan-sdk`
Companion document to `Rules.MD` (governing standards) and `Prompts.MD` (execution sequence).

This document explains *why* the SDK Platform is structured the way it is, and *how* its pieces fit together. Every decision below is made assuming a multi-year maintenance horizon and a public developer audience, not a demo.

---

## 1. Repository Architecture

The Corthan SDK Platform is a single monorepo hosting four independently publishable SDKs (Go, Node.js, React, React Native) plus the shared infrastructure that keeps them consistent.

**Why a monorepo instead of four repos:**
- A single, pinned OpenAPI spec must drive all four SDKs; a monorepo keeps spec-to-SDK propagation atomic (one PR updates the spec and all affected SDKs together).
- Shared engineering standards (linting, security scanning, release tooling patterns) are defined once and enforced identically everywhere.
- Cross-SDK parity reviews (Section 3.3 of Rules.MD) are far easier when all four surfaces are visible in one diff.
- Contributors gain full context: a change to the API's Session resource is visibly propagated across all four SDKs in one place.

**Why each SDK still publishes independently:**
- Consumers of the Go SDK should never be forced to accept a version bump caused by a React SDK change. Independent versioning avoids "monorepo lockstep" pain for API consumers, even though the source lives together.
- Compatibility matrices mapping SDK version coordinates (SDK version ↔ minimum supported API spec version ↔ minimum supported language/runtime version ↔ release date) are documented in the PACKAGE_MATRIX.md report.

---

## 2. Folder Structure

```
corthan-sdk/
├── sdks/
│   ├── go/                      # github.com/corthan/corthan-sdk/sdks/go (or a dedicated module path)
│   │   ├── corthan/             # public package(s): auth, identity, session, device, org, dev, billing, audit
│   │   ├── internal/            # transport, generated request/response types, internal helpers
│   │   ├── examples/
│   │   ├── go.mod
│   │   └── CHANGELOG.md
│   ├── node/
│   │   ├── src/                 # public API surface
│   │   ├── src/internal/        # transport, retry, generated types
│   │   ├── examples/
│   │   ├── package.json
│   │   └── CHANGELOG.md
│   ├── react/
│   │   ├── src/                 # hooks (useAuth, useSession, ...), provider/context
│   │   ├── src/internal/
│   │   ├── examples/
│   │   ├── package.json
│   │   └── CHANGELOG.md
│   └── react-native/
│       ├── src/
│       ├── src/internal/
│       ├── examples/
│       ├── package.json
│       └── CHANGELOG.md
├── packages/
│   ├── shared-types/             # language-agnostic type source of truth (see Section 4)
│   ├── shared-http/               # patterns/reference implementation for transport behavior
│   ├── shared-testing/            # mock server / fixture generator derived from OpenAPI
│   └── shared-config/             # shared lint/format/tsconfig/tooling configs
├── specs/
│   └── openapi/                   # pinned Corthan API OpenAPI spec versions
├── tools/
│   ├── scripts/                   # release, version-bump, changelog automation
│   └── codegen/                   # OpenAPI → per-language type/client generation tooling
├── .github/
│   └── workflows/                 # one workflow per SDK + shared workflows
├── docs/                          # conceptual docs (auth model, error model, migrations)
├── examples/                      # rich, narrative cross-cutting examples per SDK
├── Rules.MD
├── Design.MD
└── Prompts.MD
```

Rationale for this shape: every SDK is a peer under `sdks/`, so no language is architecturally "primary." Shared concerns live in `packages/`, consumed via internal build-time references (Go: replace directives / internal module graph; JS ecosystem: workspace `dependencies` pointing at local packages), never via publishing shared packages to public registries unless a shared package is itself intended as a public artifact.

---

## 3. Package Structure

Each SDK package is internally layered the same way, adapted per language idiom:

1. **Public API layer** — the only layer external developers touch: client construction, resource methods (`client.Sessions.Create(...)`), typed request/response models, typed errors.
2. **Domain/service layer** — one module per API resource (Auth, Identity, Session, Device, Organisation, Developer, Billing, Audit), each responsible for mapping domain calls to HTTP operations.
3. **Transport layer** — HTTP client wrapper: base URL handling, header injection (auth, user-agent, idempotency keys), retry/backoff, timeout, cancellation.
4. **Generated layer** — types and low-level request/response shapes generated from the OpenAPI spec; never hand-edited; regenerated on every spec bump.

This mirrors Clean Architecture: the public API layer depends inward on domain and transport, but nothing in domain/transport depends outward on public API conventions — keeping the core reusable if the public surface's ergonomics change later.

---

## 4. Shared Libraries

`packages/shared-types` holds a language-agnostic description of every domain model (Identity, Session, Device, Organisation, Developer, Billing, Audit, error codes) expressed as the canonical OpenAPI schema components. This is not a runtime dependency of any SDK — it is the generation source. Each SDK's codegen step (Section 12) consumes this to produce native types (Go structs, TypeScript interfaces).

`packages/shared-http` is not a shared runtime library either (a Go binary cannot depend on an npm package); instead it is a **reference behavior specification** — a written contract (retry semantics, timeout defaults, header conventions) that each SDK's transport layer independently implements and contract-tests against. This avoids forcing artificial runtime coupling across incompatible ecosystems while still guaranteeing identical behavior.

`packages/shared-testing` contains the OpenAPI-derived mock server / fixture generator used by every SDK's integration and contract tests, so all four SDKs test against byte-identical mocked responses.

`packages/shared-config` holds actual shared runtime tooling config where the ecosystem allows it (shared ESLint/Prettier base config consumed by node/react/react-native; a shared `golangci-lint` config for Go).

---

## 5. Common Utilities

Within each SDK, a small internal utilities module provides: exponential backoff calculation, idempotency-key generation, request-id propagation, structured error construction, and configuration merging (defaults + user overrides). These utilities are intentionally duplicated per language (not shared at runtime) because sharing runtime code across Go and the JS ecosystem is not meaningfully possible — but they are built to the identical written specification in `packages/shared-http`, and contract tests verify behavioral parity (e.g., "3 retries with jittered exponential backoff starting at 200ms" is asserted identically in every SDK's test suite).

---

## 6. HTTP Layer

Every SDK's transport layer is responsible for, and only for:
- constructing the outbound request (method, path, query, headers, body) from a domain-layer call,
- attaching authentication (bearer token / session token / API key, depending on flow),
- attaching standard headers (`User-Agent: corthan-<lang>-sdk/<version>`, request-id),
- executing with a configurable timeout,
- retrying idempotent, retryable failures (network errors, 429, 5xx) with exponential backoff and jitter, honoring `Retry-After` when present,
- deserializing the response into generated types or mapping error responses into the typed error hierarchy,
- surfacing cancellation (Go `context.Context`, JS `AbortSignal`) at every network call.

The HTTP layer never contains business logic (no resource-specific branching) — that stays in the domain/service layer, keeping the transport layer swappable (e.g., allowing a consumer to inject a custom `http.Client`/`fetch` implementation for testing or corporate proxy requirements).

---

## 7. Authentication Layer

The Authentication module wraps every supported Corthan auth flow (credential exchange, token refresh, session validation, device verification handshake) behind a small, explicit interface:

- Token acquisition and refresh are handled transparently by the SDK's client once configured, but always overridable — a consumer can supply their own token provider (important for React/React Native apps that already manage tokens via their own state layer).
- Tokens are never persisted by the SDK itself unless the consumer explicitly opts into a provided storage adapter (e.g., a `SecureStorageAdapter` for React Native, a `MemoryTokenStore` default for Node/Go).
- Refresh races are prevented via a single-flight pattern per client instance (concurrent requests hitting an expired token trigger exactly one refresh, not N).

---

## 8. Identity Modules

The Identity module wraps identity-profile registration, single retrieval, and profile updates exposed by the API (POST /identity, GET /identity/{id}, PUT /identity/{id}). It is deliberately kept separate from the Authentication module: Authentication answers "who is making this call and are they allowed to," while Identity answers "what do we know about this identity record." This separation avoids the common SDK anti-pattern of an "Auth god object" that also happens to manage profile data.

---

## 9. Session Modules

The Session module wraps session retrieval and individual revocation (GET /sessions, DELETE /sessions/{id}). Since session creation is handled implicitly as a side effect of native device authentication (/auth) or QR session confirmation (/auth/qr/confirm), the Session module does not expose session creation endpoints. Session revocation methods are designed to be safe-by-default (requiring explicit session ID parameters to prevent unintended global logout loops).

---

## 10. Device Modules

The Device module wraps device registration and deactivation (GET /devices, POST /devices, DELETE /devices/{id}), including the primitives needed for the React Native SDK to support platform-level device attestation hooks. Device verification is handled implicitly via the cryptographic verification of ECDSA signature assertions during the authentication flow (/auth).

---

## 11. Organisation Modules

The Organisation module wraps multi-tenant organisation management (listing organizations, creation, and members list: GET /organizations, POST /organizations, GET /organizations/{id}/members). Because this module often has the widest blast radius, every mutating method requires explicit, unambiguous parameters (no implicit "current organisation" state).

---

## 12. Developer Modules

The Developer module wraps developer API key management (GET /developers/keys, POST /developers/keys, DELETE /developers/keys/{id}). This module is the smallest surface in the SDKs aimed at end-user apps (Node/React/React Native primarily consume Identity/Session/Device/Auth).

---

## 13. Billing Modules

The Billing module wraps usage/metering read operations (GET /billing/tier). In accordance with API specs, metering runs against internal database aggregates (no external payment providers). Billing data is treated as sensitive by default in the Logging Rules (Rules.MD §19) — no billing response body is ever logged at `debug` level without explicit redaction.

---

## 14. Audit Modules

The Audit module wraps read access to audit-log records (GET /audit/logs). This module is intentionally read-only in every SDK; there is no SDK-level method that could mutate or delete audit records, reinforcing the platform's security posture at the client boundary.

---

## 15. Error Handling (Architecture)

Every SDK implements the same conceptual error model (see Rules.MD §18) via language-idiomatic mechanisms:

- **Go**: a `CorthanError` interface with a concrete `*APIError` struct carrying `Code`, `Message`, `HTTPStatus`, `RequestID`, `Retryable bool`; standard library `errors.As`/`errors.Is` support via `Unwrap()`.
- **Node/React/React Native**: a `CorthanError` base class extended by specific subclasses (`AuthenticationError`, `ValidationError`, `RateLimitError`, `ServerError`), all carrying the same fields, all serializable for logging.

Error mapping happens once, centrally, in each SDK's transport layer, immediately after receiving a non-2xx response — domain modules never re-implement error parsing.

---

## 16. Retry Strategy

Default retry policy (overridable per-client): retry network-level failures and HTTP 429/502/503/504 up to a configurable max attempt count (default: 3 additional attempts), using exponential backoff with jitter (base delay configurable, default 200ms, capped at a configurable ceiling, default 5s), honoring a `Retry-After` header when the API supplies one. Non-idempotent operations (as declared per-endpoint from the OpenAPI spec's method semantics) are not retried automatically unless the consumer explicitly opts in and supplies an idempotency key.

*End of Design.MD — read alongside Rules.MD before any implementation prompt in Prompts.MD is executed.*