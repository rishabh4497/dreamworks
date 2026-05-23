// Mirror the constants exported by @dreamworks/sdk so the validator can run
// without depending on the SDK at runtime. Keep in sync.
export const SDK_MARKER = "__DREAMWORKS_SDK_MARKER_V1__";
export const MANIFEST_FILENAME = "dreamworks.manifest.json";
export const MIN_SDK_VERSION = "0.1.0";
export const MAX_WEB_SCAN_BYTES = 200 * 1024 * 1024;
export const ACHIEVEMENT_ID_PATTERN = /^ach_[a-z0-9_]{1,40}$/;
