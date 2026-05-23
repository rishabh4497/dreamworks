# @dreamworks/sdk

The runtime SDK for games published on the Dreamworks store. Wires achievements
to the launcher and proves your build is correctly integrated to the
developer-portal's validator.

## Install

```bash
yarn add @dreamworks/sdk
```

## Quickstart

```ts
import { DreamworksAPI } from "@dreamworks/sdk";

// Once, at game startup:
DreamworksAPI.init({
  appId: "app-cozy-coffee",     // from your developer portal app page
  buildLabel: "0.4.2-rc1",       // matches the manifest you ship
});

// When the player earns something:
DreamworksAPI.unlockAchievement("ach_first_brew");

// Each frame (or at a coarse interval):
DreamworksAPI.runCallbacks();
```

## Ship a manifest

Place a `dreamworks.manifest.json` at the root of the zip you upload:

```json
{
  "schemaVersion": 1,
  "appId": "app-cozy-coffee",
  "sdkVersion": "0.1.0",
  "buildLabel": "0.4.2-rc1",
  "achievements": ["ach_first_brew", "ach_perfect_shot"],
  "platforms": ["windows"],
  "executable": "CozyCoffee.exe"
}
```

Generate it programmatically:

```ts
import { buildManifest, manifestToJson } from "@dreamworks/sdk";

const json = manifestToJson(
  buildManifest({
    appId: "app-cozy-coffee",
    buildLabel: "0.4.2-rc1",
    achievements: ["ach_first_brew", "ach_perfect_shot"],
    platforms: ["windows"],
    executable: "CozyCoffee.exe",
  }),
);
```

## What the validator checks

| Layer | What | Where |
|---|---|---|
| Manifest | App ID matches the portal; all listed achievements exist | Browser + Cloud |
| Binary | The SDK marker string is present in your executable | Tauri + Cloud |
| Handshake | The SDK called home at least once from a running build | Cloud |

All three must pass before the build can be published.
