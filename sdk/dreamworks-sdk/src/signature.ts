// The marker string is searched for inside game binaries by the Dreamworks
// portal's build validator. It must be a literal in the compiled output so
// dead-code elimination does not strip it — `init()` references it directly.
export const SDK_MARKER = "__DREAMWORKS_SDK_MARKER_V1__";

export const SDK_VERSION = "0.1.0";

export const MANIFEST_FILENAME = "dreamworks.manifest.json";

export const MIN_SDK_VERSION = "0.1.0";

export const MANIFEST_SCHEMA_VERSION = 1 as const;
