# Build Report

This report documents the compiler build results, targets, and exit codes for all four Corthan SDK packages compiled from a clean workspace checkout.

---

## 1. Go SDK (`sdks/go`)
* **Compiler**: Go `1.22+` compiler
* **Build Command**: `go build ./...`
* **Exit Code**: `0` (Success)
* **Emitted Targets**:
  - `github.com/corthandotcom/sdk/sdks/go` (Internal Library module symbols)
  - `github.com/corthandotcom/sdk/sdks/go/corthan` (Client coordinate package)

---

## 2. Node.js SDK (`sdks/node`)
* **Compiler / Bundler**: `tsup v8.5.1` (TypeScript `5.x` engine)
* **Build Command**: `npm run build`
* **Exit Code**: `0` (Success)
* **Emitted Targets**:
  - `dist/index.js` (CommonJS Bundle - 16.69 KB)
  - `dist/index.mjs` (ES Module Bundle - 14.59 KB)
  - `dist/index.d.ts` (CJS Type Declarations - 14.32 KB)
  - `dist/index.d.mts` (ESM Type Declarations - 14.32 KB)

---

## 3. React SDK (`sdks/react`)
* **Compiler / Bundler**: `tsup v8.5.1` (React marked as external peer)
* **Build Command**: `npm run build`
* **Exit Code**: `0` (Success)
* **Emitted Targets**:
  - `dist/index.js` (CommonJS Bundle - 6.71 KB)
  - `dist/index.mjs` (ES Module Bundle - 4.76 KB)
  - `dist/index.d.ts` (CJS Type Declarations - 3.73 KB)
  - `dist/index.d.mts` (ESM Type Declarations - 3.73 KB)

---

## 4. React Native SDK (`sdks/react-native`)
* **Compiler / Bundler**: `tsc` compiler (platform mappers preserved separately)
* **Build Command**: `npm run build`
* **Exit Code**: `0` (Success)
* **Emitted Targets**:
  - `dist/context.js` / `dist/context.d.ts`
  - `dist/hooks.js` / `dist/hooks.d.ts`
  - `dist/index.js` / `dist/index.d.ts`
  - `dist/internal/storage.js` / `dist/internal/storage.d.ts` (Default adapter)
  - `dist/internal/storage.ios.js` / `dist/internal/storage.ios.d.ts` (iOS Keychain resolution target)
  - `dist/internal/storage.android.js` / `dist/internal/storage.android.d.ts` (Android Keystore resolution target)
  - `dist/internal/attestation.js` / `dist/internal/attestation.d.ts`
