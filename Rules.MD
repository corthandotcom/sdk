# Corthan SDK Platform — Engineering Rulebook (Rules.MD)

Repository: `corthan-sdk`
Type: Single Monorepo
SDKs: Go, Node.js, React, React Native
Status: Governing document — applies to every package, workflow, and contributor (human or AI) in this repository.

This document is the single source of truth for how the Corthan SDK Platform is built, tested, versioned, released, and maintained. No SDK, package, script, or workflow may deviate from these rules without an explicit, recorded amendment to this file.

---

## AI & Engineering Execution Rules

Before executing any prompt, all contributors (especially AI assistants) must strictly adhere to the following execution rules:

1. **Read the entire repository and understand the existing architecture.**
2. **Read all project documents (Rules.MD, Design.MD, Prompts.MD, README, and related files).**
3. **Analyze existing code, dependencies, workflows, and configurations before making changes.**
4. **Create a detailed implementation plan and task checklist.**
5. **Present the plan and wait for explicit approval before writing or modifying any code.**
6. **During implementation, continuously update the task checklist and verify every completed item.**
7. **Never overwrite or refactor working code unless explicitly required.**
8. **Reuse existing implementations whenever possible; avoid duplication and unnecessary abstractions.**
9. **Follow production-grade engineering principles:** Clean Architecture, SOLID, DRY, KISS, strong typing, semantic versioning, security by default, and backward compatibility.
10. **After each prompt, run formatting, linting, tests, build verification, and deployment verification (if applicable), then generate a completion summary before stopping.**

*Never assume requirements, never skip verification, and never proceed to the next prompt without completing and validating the current one.*

---

## 1. Repository Rules

1.1. The repository is a single monorepo named `corthan-sdk`, containing all four official SDKs plus shared tooling, shared libraries, CI/CD configuration, and documentation scaffolding.

1.2. Each SDK is independently versioned and independently publishable, but all SDKs share:
- the same OpenAPI specification source of truth,
- the same shared engineering standards (this document),
- the same architectural philosophy (see Design.MD),
- the same release tooling patterns (adapted per-language ecosystem).

1.3. The monorepo is managed with a workspace-aware tool per ecosystem:
- Go: native Go workspaces (`go.work`) for local multi-module development.
- JS/TS packages (Node, React, React Native): a JS workspace manager (npm workspaces or pnpm workspaces — selected during Prompt 1 and fixed thereafter) plus a task runner (e.g. Turborepo/Nx-class tool) for coordinated builds, caching, and pipelines.

1.4. No SDK may import another SDK as a runtime dependency. Shared logic is factored into internal shared packages (`packages/shared-*` or `internal/`), never by one public SDK depending on another public SDK.

1.5. All repository-root configuration (linting, formatting, commit conventions, CI, security scanning) applies uniformly across all SDKs unless a language ecosystem makes uniformity technically impossible, in which case the deviation must be documented in `Design.MD`.

1.6. The repository must always build, lint, and test successfully on `main`. No broken state is ever merged to `main`.

1.7. Every top-level directory must contain a `README.md` describing its purpose and its relationship to the rest of the monorepo.

---

## 2. Folder Structure Rules

2.1. Top-level layout (authoritative; exact paths must match `Design.MD` folder structure section):

```
corthan-sdk/
  sdks/
    go/
    node/
    react/
    react-native/
  packages/
    shared-types/
    shared-http/
    shared-testing/
    shared-config/
  specs/
    openapi/
  tools/
    scripts/
    codegen/
  .github/
    workflows/
  docs/
  examples/
  Rules.MD
  Design.MD
  Prompts.MD
```

2.2. Each SDK directory under `sdks/<language>/` is a self-contained, independently publishable package (or Go module) with its own manifest (`go.mod`, `package.json`), its own tests, its own examples, and its own changelog.

2.3. No SDK may reach outside its own directory except through explicitly declared shared packages under `packages/`.

2.4. Generated code (from OpenAPI specs) lives in a clearly marked `generated/` or `internal/generated/` subfolder within each SDK, and generated files must never be hand-edited.

2.5. Examples for each SDK live in two places:
- minimal smoke examples inside `sdks/<language>/examples/` for that SDK's own CI verification,
- richer, narrative examples inside the root `examples/` directory, organised per SDK and per use case (see Examples Rules).

2.6. Folder and file naming is lowercase-kebab-case for directories, and follows each language's idiomatic file-naming convention within SDK source (see Naming Conventions).

---

## 3. SDK Development Rules

3.1. Every SDK must expose a clean, language-idiomatic public API surface. The underlying HTTP/transport details, retries, and serialization must never leak into the public interface.

3.2. Every SDK must implement full feature parity with the Corthan Identity API's v1 surface: Authentication, Sessions, Identity, Devices, Organisations, Developers, Billing, Audit. v0 (experimental) endpoints are opt-in and clearly marked as unstable in every SDK.

3.3. Public API design must be reviewed against the equivalent surface in the other three SDKs before merge — conceptual parity (same resources, same capabilities, same error semantics) is mandatory even when syntax differs by language.

3.4. No SDK may perform silent fallback behavior (e.g., swallowing errors, silently retrying without configuration, defaulting to insecure transport). All such behavior must be explicit and configurable.

3.5. Every SDK must support:
- configurable base URL (for v0/v1 and future environments),
- configurable timeout and retry policy,
- configurable logging hook/interface,
- pluggable credential/token storage where applicable,
- cancellation/abort support idiomatic to the language (context.Context in Go, AbortSignal in Node/React/React Native).

3.6. Every public method, class, and type must have complete inline documentation (GoDoc, TSDoc/JSDoc) sufficient to generate reference docs without additional authoring.

3.7. Breaking changes to any SDK's public surface require a major version bump and an entry in `docs/migrations/`.

---

## 4. API Compatibility Rules

4.1. Each SDK is generated and hand-wrapped against a specific, pinned version of the Corthan OpenAPI specification stored in `specs/openapi/`.

4.2. SDKs must never assume undocumented API behavior. Any behavior not present in the OpenAPI spec must be treated as unsupported.

4.3. When the API introduces a new field, endpoint, or resource, SDKs are updated in a dedicated PR referencing the spec version bump — never bundled silently into an unrelated feature or fix PR.

4.4. SDKs must degrade gracefully against additive, backward-compatible API changes (new optional fields must not break deserialization in any SDK).

4.5. Any breaking API change requires a coordinated major-version release across all affected SDKs, documented in a shared compatibility matrix (`PACKAGE_MATRIX.md`).

4.6. SDKs must never hardcode API version strings outside of a single, centralized constants file per SDK.

---

## 5. Package Standards

5.1. Go SDK: published as a proper Go module with a stable import path, correct `go.mod` module declaration, and adherence to the Go module versioning rules (v2+ requires `/v2` suffix, etc.).

5.2. Node SDK: published as a scoped npm package (e.g. `@corthan/node-sdk`) with both CommonJS and ESM builds, correct `exports` map, and accurate `types` field for TypeScript consumers.

5.3. React SDK: published as a scoped npm package (e.g. `@corthan/react-sdk`), peer-dependent on React (not bundling React), tree-shakeable, with hooks and components clearly separated.

5.4. React Native SDK: published as a scoped npm package (e.g. `@corthan/react-native-sdk`), peer-dependent on React and React Native, with platform-specific code isolated (`.ios.ts` / `.android.ts` where required) and no reliance on Node-only APIs.

5.5. Every package must include: `LICENSE`, `README.md`, `CHANGELOG.md`, correct `package.json`/`go.mod` metadata (author, repository URL, homepage, bug tracker), and a minimal, explicit dependency list.

5.6. Every package must declare its supported language/runtime versions explicitly (Go version constraint; Node engines field; supported React/React Native version ranges) and CI must test against the minimum and latest supported versions.

---

## 6. Versioning Strategy

6.1. All SDKs follow strict Semantic Versioning 2.0.0 (MAJOR.MINOR.PATCH).

6.2. MAJOR: breaking public API changes, breaking behavior changes, dropped runtime/language version support.

6.3. MINOR: new backward-compatible features, new optional parameters, new endpoints wrapped.

6.4. PATCH: bug fixes, internal performance improvements, dependency patches with no public surface change.

6.5. Each SDK versions independently. There is no requirement that all four SDKs share the same version number at any given time; parity is tracked via `PACKAGE_MATRIX.md`, not via synchronized version numbers.

6.6. Pre-release versions use standard suffixes (`-alpha.N`, `-beta.N`, `-rc.N`) and are never installed by default by package managers.

6.7. Every version bump must be accompanied by a `CHANGELOG.md` entry following Keep a Changelog format.

---

## 7. Release Rules

7.1. Releases are cut only from `main`, only via the automated release pipeline — never manually published from a developer machine.

7.2. Every release must pass: full test suite, lint, type-check, build, and security scan, in that order, before publishing.

7.3. Every release produces: a GitHub Release with generated release notes, a Git tag scoped per SDK (e.g. `go-sdk/v1.4.0`, `node-sdk/v2.1.0`), and a corresponding registry publish (Go proxy / npm).

7.4. Releases are immutable. A published version is never unpublished or overwritten; a mistake is corrected with a new patch release.

7.5. Every release triggers generation of a `RELEASE_REPORT.md` entry summarizing what changed, verification results, and any known limitations.

7.6. Hotfixes follow the same pipeline as ordinary releases; no manual/emergency bypass of CI/CD gating exists.

---

## 8. Publishing Rules

8.1. Go SDK publishing is satisfied by pushing a correctly formatted Git tag; the Go module proxy (`proxy.golang.org`) picks it up automatically. CI must verify the module resolves via `go list -m` against the tag before marking the release complete.

8.2. Node/React/React Native SDKs are published to the npm Registry using scoped packages with provenance (npm publish with `--provenance` where supported) and 2FA/automation-token-gated publish credentials stored only as CI secrets.

8.3. Every publish step is followed by an automated installation verification: a clean-room install of the just-published package/module in an isolated environment, exercising a minimal smoke test.

8.4. No package is ever published from an untagged or unreviewed commit.

8.5. Publishing credentials are scoped to CI/CD only; no individual maintainer holds direct publish rights outside the pipeline.

---

## 9. Dependency Management

9.1. Minimal dependencies principle: a dependency is added only when it removes materially more risk/effort than it introduces.

9.2. All dependencies are pinned to exact or narrowly-ranged versions; automated dependency update PRs (e.g. via Dependabot/Renovate) are required to pass full CI before merge.

9.3. No SDK may depend on a package with a copyleft license incompatible with the SDK's own license (see Section 21 style — license compatibility is checked automatically in CI).

9.4. Every dependency addition/removal is reviewed for supply-chain risk (maintenance activity, download provenance, known CVEs).

9.5. Transitive dependency trees are audited on every CI run using each ecosystem's native audit tool (`go list -m all` + vulnerability DB, `npm audit`/equivalent).

---

## 10. Testing Standards

10.1. Every SDK maintains three test tiers: unit tests (pure logic, no network), integration tests (against a sandboxed/mocked API surface derived from the OpenAPI spec), and contract tests (verifying serialization/deserialization matches the spec exactly).

10.2. Minimum coverage thresholds are enforced in CI per SDK (target: high coverage on all public-surface code paths; exact numeric thresholds are fixed in each SDK's CI config and must never be lowered without a documented justification).

10.3. Every public method must have at least one corresponding unit test and one corresponding contract test.

10.4. React and React Native SDKs additionally require component/hook-level tests using the ecosystem-standard testing library, including tests for loading, success, and error states.

10.5. No test may depend on the live production Corthan API. All tests run against mocked/sandboxed responses derived from the OpenAPI spec, ensuring deterministic, offline-capable CI.

10.6. Flaky tests are treated as build-breaking; a flaky test is quarantined and tracked as an open issue, never silently retried into passing.

---

## 11. Security Standards

11.1. Secure-by-default: SDKs must default to HTTPS-only transport, must never log tokens/credentials/secrets at any log level, and must never persist credentials to disk without explicit developer opt-in and a documented secure-storage mechanism.

11.2. All cryptographic operations (token handling, signature verification, hashing) use well-vetted standard-library or industry-standard primitives — never hand-rolled cryptography.

11.3. Every SDK undergoes automated static analysis and dependency vulnerability scanning on every CI run; any high/critical finding blocks merge.

11.4. Secrets used in CI/CD (publish tokens, signing keys) are stored exclusively in the CI provider's encrypted secrets store, scoped to the minimum required workflows.

11.5. Any security vulnerability report follows a documented responsible-disclosure process; patches are released as expedited PATCH releases across all affected SDK versions still under support.

11.6. Input validation is mandatory at every SDK boundary; SDKs never trust unvalidated user input when constructing requests (headers, URLs, query params) to prevent injection-class issues.

---

## 12. Performance Standards

12.1. SDKs must avoid unnecessary allocations, unnecessary synchronous blocking, and unnecessary network round-trips (e.g., batch where the API supports batching).

12.2. HTTP clients are reused/pooled by default rather than constructed per request.

12.3. Serialization/deserialization performance is benchmarked for high-traffic resource types (Sessions, Identity) and regressions beyond an agreed threshold block release.

12.4. React/React Native SDKs must avoid unnecessary re-renders; hooks must be memoized appropriately and must not create new function/object references on every render unless required.

12.5. Bundle size for JS-ecosystem SDKs (Node/React/React Native) is tracked per release; unexpected bundle-size regressions are flagged in CI.

---

## 13. Code Review Standards

13.1. No code merges to `main` without at least one approving review from a maintainer with domain ownership of the affected SDK.

13.2. Every PR must reference the relevant section(s) of `Design.MD` and `Rules.MD` it complies with, and must include updated tests and updated documentation in the same PR.

13.3. Reviewers verify: correctness, adherence to this rulebook, test adequacy, security implications, and public-API-surface impact (does this require a version bump, and of what type).

13.4. PRs that touch the shared/`packages/` layer require review from a maintainer of every SDK that consumes the changed package.

13.5. No self-merging. No merging with unresolved review comments.

---

## 14. GitHub Workflow Standards

14.1. Branching model: trunk-based development on `main`, with short-lived feature branches named `feature/<sdk>-<short-description>`, `fix/<sdk>-<short-description>`, `chore/<short-description>`.

14.2. Commit messages follow Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `perf:`), scoped by SDK where relevant (`feat(node-sdk): ...`). This is what drives automated changelog generation.

14.3. Every PR must pass all required status checks (lint, type-check, build, unit tests, integration tests, security scan) before it becomes mergeable.

14.4. Issues and PRs use standardized templates capturing affected SDK(s), reproduction steps, expected/actual behavior, and API spec version.

14.5. Protected branch rules on `main`: no force-push, no direct commits, required linear history, required status checks, required review.

---

## 15. CI/CD Rules

15.1. CI/CD is implemented exclusively via GitHub Actions, with reusable/composite workflows shared across SDKs wherever the underlying steps are conceptually identical (lint, security scan, changelog generation).

15.2. Every SDK has its own scoped workflow (e.g. `go-sdk-ci.yml`, `node-sdk-ci.yml`) triggered on changes within its own directory (path-filtered), plus shared workflows triggered repository-wide (security scan, license check).

15.3. CI pipelines run: install/setup → lint → type-check (where applicable) → unit tests → integration/contract tests → build → package → (on tag) publish → post-publish verification.

15.4. Release workflows are triggered only by pushing a properly scoped, signed Git tag — never by manual dispatch in normal operation (manual dispatch is reserved for documented emergency procedures with additional approval gating).

15.5. All CI/CD workflows are version-controlled, reviewed like any other code change, and never modified directly from the GitHub UI without a corresponding PR.

15.6. Build artifacts are cached appropriately per ecosystem to keep CI fast, but caches are never trusted for security-relevant steps (vulnerability scans always run against fresh dependency resolution).

---

## 16. Documentation Rules

16.1. Every SDK ships a `README.md` covering: install instructions, quick-start example, links to full API reference, supported versions, and license.

16.2. Reference documentation is generated from inline code documentation (GoDoc / TSDoc) as part of CI, never hand-maintained separately from the code it documents.

16.3. Conceptual documentation (architecture, auth flows, error handling model) lives in `docs/` and is written once, applying across all SDKs, with per-SDK code samples.

16.4. Every documented example must be a real, compiled/type-checked snippet pulled from the `examples/` directory (see Examples Rules) — never untested prose code.

16.5. Documentation is versioned alongside the SDKs it describes; docs for a deprecated major version remain accessible but clearly marked as historical.

---

## 17. Examples Rules

17.1. Every SDK ships at least one example per major capability area (Authentication, Sessions, Identity, Devices, Organisations, Developers, Billing, Audit).

17.2. Examples are real, runnable, tested programs/projects — never inline pseudocode. Each example is compiled/executed in CI to prevent documentation drift.

17.3. Examples never hardcode real credentials, tokens, or production endpoints; they use clearly-marked placeholder configuration and, where possible, a sandbox environment.

17.4. Examples are organized per SDK under `examples/<language>/<capability>/` and are excluded from the published package artifact (dev-only).

---

## 18. Error Handling Rules

18.1. Every SDK defines a single, consistent error type hierarchy mapping Corthan API error codes to language-idiomatic error/exception types (e.g., typed Go errors implementing a common `CorthanError` interface; a typed `CorthanError` class hierarchy in JS/TS).

18.2. SDKs never swallow errors silently. Every failure path either returns/throws a typed error or is explicitly documented as a no-op with rationale.

18.3. Error objects always carry: the API error code, a human-readable message, the originating HTTP status (where applicable), and a request/trace identifier for support correlation.

18.4. Retryable vs non-retryable errors are explicitly distinguished in the type system so calling code can branch on retryability without string-matching messages.

18.5. SDKs never expose internal stack traces or implementation details of the transport layer as part of the public error contract.

---

## 19. Logging Rules

19.1. SDKs never log by default. Logging is opt-in via an injectable logger interface/hook provided by the consuming application.

19.2. When logging is enabled, SDKs must never log full request/response bodies containing credentials, tokens, or personally identifiable information; sensitive fields are redacted by default.

19.3. Log levels follow a consistent scheme across SDKs: `debug` (verbose request/response metadata, redacted), `info` (lifecycle events), `warn` (retryable failures), `error` (non-retryable failures).

19.4. The logging interface is a small, stable contract so consuming applications can plug in their own logging library without adapter churn across SDK versions.

---

## 20. Naming Conventions

20.1. Go: package names short, lowercase, no underscores; exported identifiers in `PascalCase`; unexported in `camelCase`; file names `snake_case.go`.

20.2. Node/TypeScript: exported classes/types in `PascalCase`; functions/variables in `camelCase`; file names `kebab-case.ts`.

20.3. React: components in `PascalCase.tsx`; hooks named `useXxx.ts` in `camelCase`.

20.4. React Native: platform-specific files use `Component.ios.tsx` / `Component.android.tsx` suffixes; shared components remain platform-agnostic where possible.

20.5. Cross-SDK resource naming is conceptually aligned: the resource called "Session" in the API is never renamed to something else in any SDK's public surface.

20.6. Package/module names follow each ecosystem's convention but always contain `corthan` as the identifying namespace/scope (`@corthan/...`, `github.com/corthan/corthan-sdk/...`).

---

## 21. Deprecation Policy

21.1. Deprecated public APIs are marked with ecosystem-idiomatic deprecation annotations (`// Deprecated:` GoDoc convention; `@deprecated` TSDoc tag) at least one full MINOR release before removal.

21.2. Deprecated APIs continue to function (no silent behavior change) until removed in a MAJOR release.

21.3. Every deprecation includes a migration note pointing to the replacement API, published in `docs/migrations/`.

21.4. A support window is defined and published for each major version (e.g., N and N-1 major versions receive security patches); this window is documented in the root `README.md` and kept current.

---

## 22. Future Compatibility Rules

22.1. New SDKs (e.g., Python, Java, Kotlin, Swift in the future) must be added under `sdks/<language>/` following the identical structural and rulebook conventions defined here, with no exceptions unless this document is amended first.

22.2. New API resources are added to the OpenAPI spec first, then propagated to SDKs — never the reverse.

22.3. Any structural change to the monorepo (new shared package, new workspace tool, new CI provider) requires a corresponding update to both `Rules.MD` and `Design.MD` in the same PR.

22.4. This rulebook itself is versioned; changes to it are reviewed with the same rigor as changes to production code, since it governs production code.

---

## 23. Cursor / Claude AI Engineering Assistant Rules

This section governs how any AI coding assistant (Claude, Cursor, or equivalent) must operate inside this repository. These rules are mandatory and non-negotiable for AI-assisted contributions.

23.1. Before any implementation work, the assistant must:
- Read the complete repository structure (not just the file it is about to touch).
- Read `Rules.MD` in full.
- Read `Design.MD` in full.
- Read any previous, related implementation (existing code, prior PRs, prior checklists) relevant to the current task.
- Read the current OpenAPI specification(s) under `specs/openapi/`.
- Analyze existing code for conventions already established, so new code stays consistent.

23.2. After analysis, the assistant must produce:
- A written implementation plan describing the approach, the files to be touched/created, and how the change complies with `Rules.MD` and `Design.MD`.
- A detailed, itemized task checklist derived from that plan.

23.3. The assistant must present the plan and checklist to the requester and explicitly wait for approval before writing or modifying any code. The assistant never begins implementation on its own initiative.

23.4. Once approved, during implementation the assistant must:
- Continuously keep the task checklist updated as items are completed.
- Periodically verify progress against the plan.
- Execute the relevant test suite(s) for any code touched.
- Build the affected SDK(s) to confirm compilation/build success.
- Validate outputs (test results, build artifacts, lint results) before declaring a step complete.

23.5. The assistant stops after fully completing the specific prompt/task it was given — it does not proceed to unrelated future prompts or additional scope not requested, even if it can infer what "should" come next.

23.6. The assistant never fabricates test results, build outcomes, publish confirmations, or verification reports. Every status reported as "passed" or "verified" must correspond to an actual executed check within the current session; anything not actually run is reported as not run, never assumed.

23.7. The assistant never bypasses any rule in this document to "move faster," including but not limited to: skipping tests, skipping the plan/checklist/approval step, hand-editing generated code, or publishing without the full pipeline.

23.8. If a request conflicts with this rulebook, the assistant flags the conflict explicitly and asks for direction rather than silently choosing one side.

---

*End of Rules.MD — this document is binding for all contributors, human and AI, to the `corthan-sdk` repository.*