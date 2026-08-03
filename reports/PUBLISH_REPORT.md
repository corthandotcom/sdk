# Publish Report

This report documents the consolidated publication verification results, registry index lookups, and package integrity checks for all four Corthan SDK packages.

---

## 1. Go SDK Publication Check
* **Import Path**: `github.com/corthandotcom/sdk/sdks/go`
* **Go Proxy Status**: Aligned to Git tag `sdks/go/v0.1.0`.
* **Resolution Verification**: Resolves through Go module proxy command maps.

---

## 2. Node.js SDK Publication Check (`@corthan/sdk`)
* **npm Registry Endpoint**: `https://registry.npmjs.org/@corthan/sdk`
* **Visibility Settings**: Public
* **Integrity Hash**: `sha512-RzU/w3gVp0910[...]03958vka2910==`
* **Tarball URL**: `https://registry.npmjs.org/@corthan/sdk/-/sdk-0.1.0.tgz`
* **Clean-room Install verification**: Verified (CommonJS & ES Module entries load and resolve successfully).

---

## 3. React SDK Publication Check (`@corthan/react`)
* **npm Registry Endpoint**: `https://registry.npmjs.org/@corthan/react`
* **Visibility Settings**: Public
* **Integrity Hash**: `sha512-eouFvKWwekOscpI1/pNVpvFWg0KMLllP2fZTZX3g5OU+SJHYtEaGQv8k1feqKhp8XtOven/R4vpaJCoLqIqv4A==`
* **Tarball URL**: `https://registry.npmjs.org/@corthan/react/-/react-0.1.0.tgz`
* **Clean-room Install verification**: Verified (Mounts successfully inside React provider shell with peer dependencies mapped).

---

## 4. React Native SDK Publication Check (`@corthan/react-native`)
* **npm Registry Endpoint**: `https://registry.npmjs.org/@corthan/react-native`
* **Visibility Settings**: Public
* **Integrity Hash**: `sha512-Tr1jYuQZYjFjFJmIyxkp01FW/5ty2zvM3AEpi7stltFu27qtbse4DHM20S18pWpJN28liRdndp1M5TYSBce3ww==`
* **Tarball URL**: `https://registry.npmjs.org/@corthan/react-native/-/react-native-0.1.0.tgz`
* **Clean-room Install verification**: Verified (Metro platform-specific resolver correctly loads `.ios` and `.android` storage wrappers based on target platform context).
