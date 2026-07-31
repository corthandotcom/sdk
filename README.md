# Corthan SDK Monorepo

Welcome to the official repository for **Corthan SDKs**. This is a single, workspace-managed monorepo hosting the official client SDK libraries for Corthan Authentication, Identity, Sessions, and Verification APIs across multiple language ecosystems.

---

## Supported Ecosystems & Packages

| Target Ecosystem | Package / Import Path                  | Directory                                |
| ---------------- | -------------------------------------- | ---------------------------------------- |
| **Go**           | `github.com/corthandotcom/sdk/sdks/go` | [sdks/go](./sdks/go)                     |
| **Node.js / TS** | `@corthan/sdk`                         | [sdks/node](./sdks/node)                 |
| **React**        | `@corthan/react`                       | [sdks/react](./sdks/react)               |
| **React Native** | `@corthan/react-native`                | [sdks/react-native](./sdks/react-native) |

---

## Monorepo Architecture

This project is organized according to the principles of Clean Architecture:

- [Design.MD](./Design.MD) — Conceptual architecture, directory layers, and engineering rationales.
- [Rules.MD](./Rules.MD) — Rules governing repository workflows, code reviews, testing, security, and version releases.

### Directory Structure

- `sdks/` — The consumer-facing library packages.
- `packages/` — Shared infrastructure, baseline configs, and mock testing libraries.
- `specs/` — OpenAPI specification sources.
- `tools/` — Code generators and release helper scripts.
- `docs/` — Migration guides and multi-SDK conceptual documentations.

---

## Local Development & Commands

### Prerequisites

- **Node.js** (v18+)
- **Go** (v1.22+)

### Setup

1. Clone this repository (if not already done).
2. Install npm workspace dependencies:
   ```bash
   npm install
   ```

### Coordinated Workflows (Turborepo)

We use **Turborepo** to orchestrate workspace tasks:

- **Build all packages:** `npm run build`
- **Lint the codebase:** `npm run lint`
- **Format files:** `npm run format`
- **Typecheck TS files:** `npm run typecheck`
- **Run all tests:** `npm run test`
