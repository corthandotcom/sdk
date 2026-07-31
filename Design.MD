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

The Identity module wraps identity-record CRUD and identity-verification operations exposed by the API. It is deliberately kept separate from the Authentication module: Authentication answers "who is making this call and are they allowed to," while Identity answers "what do we know about this identity record." This separation avoids the common SDK anti-pattern of an "Auth god object" that also happens to manage profile data.

---

## 9. Session Modules

The Session module wraps session lifecycle: creation, listing active sessions, revocation (single session and "revoke all others"), and session metadata (device, location-adjacent metadata as exposed by the API — never inferred client-side). Session revocation methods are designed to be safe-by-default (explicit confirmation parameter or explicit method name like `RevokeAll` rather than an easily-misused flag).

---

## 10. Device Modules

The Device module wraps device registration and device verification flows, including the primitives needed for the React Native SDK to support platform-level device attestation hooks. Device-module design explicitly anticipates that React Native will need additional native-bridge touchpoints (biometric prompt, secure enclave-backed key storage) that Go/Node/React do not — this is handled via an injectable `DeviceAttestationProvider` interface implemented natively only in the React Native SDK, keeping the shared conceptual model identical across SDKs while allowing platform-specific implementation.

---

## 11. Organisation Modules

The Organisation module wraps multi-tenant organisation management (creation, membership, roles) as exposed by the API. Because this module often has the widest blast radius (org-level operations can affect many identities/sessions at once), every mutating method requires explicit, unambiguous parameters (no implicit "current organisation" magic state unless the consumer has explicitly set a default org context on the client).

---

## 12. Developer Modules

The Developer module wraps developer-account and API-key management (for developers building on top of Corthan themselves — a "meta" surface). This module is the smallest surface in the SDKs aimed at end-user apps (Node/React/React Native primarily consume Identity/Session/Device/Auth; Developer-module usage is expected mostly from the Go SDK and backend Node usage, informing which examples get priority in `examples/`).

---

## 13. Billing Modules

The Billing module wraps subscription/usage/invoice read operations exposed by the API. Billing mutation operations (if any) are treated with the same "no ambiguous defaults" rule as Organisation modules. Billing data is treated as sensitive by default in the Logging Rules (Rules.MD §19) — no billing response body is ever logged at `debug` level without explicit redaction of monetary/account identifiers.

---

## 14. Audit Modules

The Audit module wraps read access to audit-log records. This module is intentionally read-only in every SDK; there is no SDK-level method that could mutate or delete audit records, regardless of what the underlying API may or may not expose, reinforcing the platform's security posture at the client boundary.

---

## 15. Error Handling (Architecture)

Every SDK implements the same conceptual error model (see Rules.MD §18) via language-idiomatic mechanisms:

- **Go**: a `CorthanError` interface with a concrete `*APIError` struct carrying `Code`, `Message`, `HTTPStatus`, `RequestID`, `Retryable bool`; standard library `errors.As`/`errors.Is` support via `Unwrap()`.
- **Node/React/React Native**: a `CorthanError` base class extended by specific subclasses (`AuthenticationError`, `ValidationError`, `RateLimitError`, `ServerError`), all carrying the same fields, all serializable for logging.

Error mapping happens once, centrally, in each SDK's transport layer, immediately after receiving a non-2xx response — domain modules never re-implement error parsing.

---

## 16. Retry Strategy

Default retry policy (overridable per-client): retry network-level failures and HTTP 429/502/503/504 up to a configurable max attempt count (default: 3 additional attempts), using exponential backoff with jitter (base delay configurable, default 200ms, capped at a configurable ceiling, default 5s), honoring a `Retry-After` header when the API supplies one. Non-idempotent operations (as declared per-endpoint from the OpenAPI spec's method semantics) are not retried automatically unless the consumer explicitly opts in and supplies an idempotency key.

---

## 17. Configuration Management

Every SDK client is constructed via an explicit configuration object/builder (never global mutable state), supporting: base URL/environment selection (v0 vs v1, future environments), timeout, retry policy overrides, custom HTTP transport injection, custom logger injection, custom token provider injection, and a `userAgentSuffix` for downstream consumer identification. Configuration precedence is: explicit per-call override > per-client configuration > documented SDK default. This precedence order is identical across all four SDKs.

---

## 18. SDK Lifecycle

Each SDK follows the same conceptual lifecycle stage-gate before any release:
`spec-aligned draft → internal review → contract tests passing → documentation complete → examples verified → security scan clean → release candidate → stable release`.

No SDK skips a stage; the automation in `.github/workflows/` enforces this by making each stage a required, non-bypassable CI check.

---

## 19. OpenAPI Integration

`specs/openapi/` holds the pinned, versioned Corthan API specification. `tools/codegen/` contains the code-generation tooling (per-language generator invocation, wrapped in scripts so the exact generator + generator version is pinned and reproducible). The flow is:

`spec bump PR → regenerate all four SDKs' generated/ layers → run contract tests across all SDKs → hand-written wrapper layers updated only where the public API needs new methods → PR merged as one atomic change`.

This guarantees the four SDKs can never silently drift out of sync with the API or with each other.

---

## 20. Shared Testing Strategy

`packages/shared-testing` provides an OpenAPI-driven mock server (or per-language mock server derivations sharing the same fixture definitions) so that:
- Unit tests never hit any network.
- Integration/contract tests run against a spec-derived mock, guaranteeing that a passing SDK test suite means "this SDK correctly implements the documented API contract," not merely "this SDK's own assumptions are internally consistent."
- The same fixture set (canonical example payloads per resource) is reused across all four SDKs' test suites, so a fixture bug is fixed once and benefits every SDK's tests simultaneously.

---

## 21. GitHub Actions (Architecture)

Two workflow classes exist:
- **Per-SDK workflows** (`go-sdk-ci.yml`, `node-sdk-ci.yml`, `react-sdk-ci.yml`, `react-native-sdk-ci.yml`): path-filtered to their own `sdks/<lang>/` directory plus any `packages/` or `specs/` change; run lint → type-check → unit → integration/contract → build.
- **Shared workflows** (`security-scan.yml`, `license-check.yml`, `spec-lint.yml`): run repository-wide on every PR regardless of which SDK changed, since spec and security concerns are cross-cutting.

Release workflows (`go-sdk-release.yml`, `node-sdk-release.yml`, `react-sdk-release.yml`, `react-native-sdk-release.yml`) are separate from CI workflows and trigger only on a properly scoped tag push, per Rules.MD §15.4.

---

## 22. Build Pipelines

- **Go**: `go build ./...` across all packages in the module, plus `go vet`, `staticcheck`-class linting, and `go test ./... -race` for the race detector on concurrency-sensitive transport code (token refresh single-flight, connection pooling).
- **Node**: TypeScript compilation to both CJS and ESM output via a dual-build step, `tsc --noEmit` for type-checking prior to build, bundling only where a bundled distributable is beneficial (kept minimal since Node consumers usually don't need bundling).
- **React**: bundled via a library-mode bundler (e.g., a Rollup/Vite-class library build) producing tree-shakeable ESM + CJS output, with React marked as an external peer dependency, never bundled.
- **React Native**: built similarly to the React SDK but with platform-specific entry resolution (`.ios`/`.android`) preserved through the bundling step rather than resolved at build time, since resolution must happen in the consuming app's Metro bundler.

---

## 23. Release Pipelines

Each SDK's release pipeline: verify CI is green on the exact commit being tagged → run the full test/lint/build gate a second time on the tag itself (defense against a race between merge and tag) → generate changelog entries from Conventional Commit history since the last tag → build final distributable artifacts → publish (Section 24/8 in Rules.MD) → verify installability → create GitHub Release with generated notes → append to that SDK's `CHANGELOG.md` in a follow-up automated commit.

---

## 24. Publishing Pipelines

**Go Module Publishing**: satisfied purely by a correctly formatted, signed Git tag (e.g. `sdks/go/v1.4.0` or a dedicated module-scoped tag matching the Go module's declared path); the pipeline's job is to create that tag correctly and then verify the module proxy has indexed it (`GOPROXY` fetch check) before declaring success.

**npm Publishing** (Node/React/React Native): the pipeline authenticates using a CI-scoped automation token, runs `npm publish` (or ecosystem-equivalent) with provenance attestation where supported, from a clean, freshly-built artifact — never from a developer's local `node_modules` state.

Both publishing paths are always followed by an automated clean-room install-and-smoke-test step (Rules.MD §8.3) before the release is marked complete in `RELEASE_REPORT.md`.

---

## 25. Go Module Publishing (Detail)

Go's decentralized module system means "publishing" is really "making the tagged source correctly resolvable." Design constraints:
- The module path declared in `go.mod` must exactly match the repository's public import path.
- If the Go SDK ever crosses a major version ≥ 2, the module path must gain the `/vN` suffix per Go module versioning rules, and this is treated as a breaking, carefully coordinated change documented in `docs/migrations/`.
- CI verifies post-tag resolvability by running `go list -m <module>@<version>` (or installing into a throwaway module) in an isolated job, confirming the proxy has indexed the tag before the release is marked complete.

---

## 26. npm Publishing (Detail)

Design constraints for the three JS-ecosystem SDKs:
- Each package publishes under the `@corthan` npm scope with `access: public` explicitly set (scoped packages default to private otherwise).
- `package.json` `exports` map is authored explicitly (not inferred) to guarantee correct resolution for both `require` and `import` consumers, and for the React Native SDK, correct resolution under Metro's module resolution rules.
- `sideEffects: false` is set where genuinely true (React/React Native SDKs) to enable consumer-side tree-shaking.
- Publish is always a two-step verification: dry-run pack + inspect resulting tarball contents in CI before the real publish step runs, ensuring no accidental inclusion of source maps with internal paths, test files, or secrets.

---

## 27. Package Version Strategy

Each SDK maintains its own independent version line (Rules.MD §6.5). `PACKAGE_MATRIX.md` (generated at final verification, see Prompts.MD Prompt 10) is the canonical cross-SDK compatibility reference, mapping: SDK version ↔ minimum supported API spec version ↔ minimum supported language/runtime version ↔ release date. This is how a developer using multiple SDKs together (e.g., Node backend + React frontend) confirms compatible version pairs without assuming version numbers line up numerically.

---

## 28. Release Management

A lightweight, documented release-train cadence is followed per SDK independently (patch releases as needed, minor releases batched on a regular cadence, major releases planned and announced ahead of time with a deprecation window per Rules.MD §21). Release management artifacts (`RELEASE_REPORT.md`, `CHANGELOG.md` entries) are generated by automation from Conventional Commit history, never hand-authored from memory, to guarantee accuracy.

---

## 29. Examples Architecture

Examples exist at two altitudes:
- **SDK-local smoke examples** (`sdks/<lang>/examples/`): minimal, CI-executed programs proving the SDK's basic install-and-call path works; these are the canary that catches packaging/build regressions.
- **Root narrative examples** (`examples/<lang>/<capability>/`): fuller, realistic usage patterns per capability area (auth flow example, session management example, device verification example, etc.), intended for documentation embedding and developer onboarding, also compiled/type-checked in CI (never hand-written prose code, per Rules.MD §17.2).

---

## 30. Future Expansion

The architecture anticipates:
- **Additional language SDKs** (Python, Java/Kotlin, Swift) slotting into `sdks/<language>/` with the identical layered internal structure (public API / domain / transport / generated) and identical shared-spec-driven codegen flow.
- **Additional API resources** propagating from a `specs/openapi/` bump through codegen into every SDK's generated layer automatically, with hand-written wrapper updates scoped to genuinely new public methods only.
- **Additional publishing targets** (e.g., a future first-party package manager or enterprise artifact registry) being added as an additional publish step in the existing release pipeline without restructuring the SDKs themselves, since publishing is deliberately kept as the last, most swappable stage of the pipeline.

---

*End of Design.MD — read alongside Rules.MD before any implementation prompt in Prompts.MD is executed.*