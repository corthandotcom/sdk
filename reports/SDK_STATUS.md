# SDK Status Report

This document summarizes the current status, resource coverage, and test metrics for each SDK in the Corthan ecosystem.

---

## 1. SDK Version Registry

| SDK Name | Current Version | Registry Namespace | Platform Target | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Go SDK** | `v0.1.0` | `github.com/corthandotcom/sdk/sdks/go` | Go 1.22+ | Ready |
| **Node SDK** | `v0.1.0` | `@corthan/sdk` | Node.js 20+ (CJS & ESM) | Ready |
| **React SDK** | `v0.1.0` | `@corthan/react` | React 18+ (CJS & ESM) | Ready |
| **React Native SDK** | `v0.1.0` | `@corthan/react-native` | React Native 0.65+ (iOS & Android Resolution) | Ready |

---

## 2. Resource Coverage Matrix
All SDKs enforce strict conceptual parity mapping 100% of the OpenAPI v1 specification:

| Service Module | Sub-Endpoints | Go SDK | Node SDK | React SDK | React Native SDK |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **Auth** | Device Authenticate, QR login create/confirm/poll | 100% | 100% | 100% (Hooks) | 100% (Hooks) |
| **Identity** | Profile Register, Get, Update | 100% | 100% | 100% (Hooks) | 100% (Hooks) |
| **Session** | List Active Sessions, Revoke Session | 100% | 100% | 100% (Hooks) | 100% (Hooks) |
| **Device** | Register Device Key, List, Revoke | 100% | 100% | 100% (Hooks) | 100% (Hooks) |
| **Organisation** | Create Tenant Org, Get, List, Members List | 100% | 100% | 100% (Hooks) | 100% (Hooks) |
| **Developer** | Create Access Key, List, Revoke Key | 100% | 100% | 100% (Hooks) | 100% (Hooks) |
| **Billing** | Retrieve Quota Tier, Limit, Used Meters | 100% | 100% | 100% (Hooks) | 100% (Hooks) |
| **Audit** | List Activity Logs, Evaluate Risk, Scopes | 100% | 100% | 100% (Hooks) | 100% (Hooks) |

---

## 3. Test Coverage Metrics

### Go SDK
- **Unit & Contract Coverage**: 100% of transport layers, signature cryptos, retry limits, and log redactions.
- **Verification Execution**: `go test -v ./...` (Passed)

### Node.js / TypeScript SDK
- **Unit, Contract & Integration**: Full mock coverage for crypto & fetch backoffs; integration verification against active Express mock-server.
- **Verification Execution**: `npm run test` (Passed)

### React SDK
- **Hook State Testing**: loading/success/error Hook rendering transitions using JSDOM and Testing Library.
- **Verification Execution**: `npm run test` (Passed)

### React Native SDK
- **Hook State & Platform Resolver Testing**: loading/success/error Hook state bounds plus dynamic `.ios`/`.android` native secure storage mapper resolution checks.
- **Verification Execution**: `npm run test` (Passed)

---

## 4. Known Issues & Limitations
1. **Registry Latency**: Scoped npm packages (`@corthan/*`) propagate with Fastly CDN caching delays (3–5 minutes after publication).
2. **Metro Resolution Cache**: When upgrading package entry points locally, Metro bundle caches might require a force-restart using `react-native start --clear-cache`.
