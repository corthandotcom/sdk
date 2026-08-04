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
* **Integrity Hash**: `sha512-p5qnhZP/kkpzPaOFi5KzRbNRbKx51yuVY+rXgKbkV/KrvDyC5tEBcHhZpgT7fGreW/vd19SeWL7efsd72GKHpQ==`
* **Registry SHASUM**: `bea9e9eed3e2e4f44ee69925bb5ec45fcd43562d`
* **Tarball URL**: `https://registry.npmjs.org/@corthan/sdk/-/sdk-0.1.0.tgz`
* **Clean-room Install verification**: Verified (CommonJS & ES Module entries load and resolve successfully).

---

## 3. React SDK Publication Check (`@corthan/react`)
* **npm Registry Endpoint**: `https://registry.npmjs.org/@corthan/react`
* **Visibility Settings**: Public
* **Integrity Hash**: `sha512-eouFvKWwekOscpI1/pNVpvFWg0KMLllP2fZTZX3g5OU+SJHYtEaGQv8k1feqKhp8XtOven/R4vpaJCoLqIqv4A==`
* **Registry SHASUM**: `05663201863bdba135e70a485943fbd13a86ff19`
* **Tarball URL**: `https://registry.npmjs.org/@corthan/react/-/react-0.1.0.tgz`
* **Clean-room Install verification**: Verified (Mounts successfully inside React provider shell with peer dependencies mapped).

---

## 4. React Native SDK Publication Check (`@corthan/react-native`)
* **npm Registry Endpoint**: `https://registry.npmjs.org/@corthan/react-native`
* **Visibility Settings**: Public
* **Integrity Hash**: `sha512-Tr1jYuQZYjFjFJmIyxkp01FW/5ty2zvM3AEpi7stltFu27qtbse4DHM20S18pWpJN28liRdndp1M5TYSBce3ww==`
* **Registry SHASUM**: `aad7f800290af7f73680adeb48b62353188f299c`
* **Tarball URL**: `https://registry.npmjs.org/@corthan/react-native/-/react-native-0.1.0.tgz`
* **Clean-room Install verification**: Verified (Metro platform-specific resolver correctly loads `.ios` and `.android` storage wrappers based on target platform context).
