# Package Matrix

This document defines the cross-SDK compatibility matrix matching API spec coordinates, language runtime targets, and release milestones per Design.MD Section 27.

---

## Compatibility Matrix

| Package/Module Name | SDK Version | Target API Spec | Minimum Language / Runtime Version | Release Date |
| :--- | :--- | :--- | :--- | :--- |
| **Go SDK** | `v0.1.0` | OpenAPI `v1.0.0` (pinned) | Go `1.22+` | 2026-07-31 |
| **Node.js SDK** | `v0.1.0` | OpenAPI `v1.0.0` (pinned) | Node.js `20.x` (or runtime supporting fetch/ECMAScript 2022) | 2026-08-01 |
| **React SDK** | `v0.1.0` | OpenAPI `v1.0.0` (pinned) | React `18.0.0` / React DOM `18.0.0` | 2026-08-01 |
| **React Native SDK** | `v0.1.0` | OpenAPI `v1.0.0` (pinned) | React `18.0.0` / React Native `0.65.0` | 2026-08-03 |

---

## Spec Stability Rules
1. **Backward Compatibility**: Any minor bump (`0.x.y`) in the SDKs must preserve strict compatibility with the pinned OpenAPI `v1.0.0` spec.
2. **Ecosystem Sync**: Substantial architectural enhancements across transport layers or security extensions should be bumped synchronously across Go, Node, React, and React Native SDK targets to maintain model alignment parity.
