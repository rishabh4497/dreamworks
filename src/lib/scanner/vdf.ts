/**
 * Minimal VDF / KeyValues parser. Only handles what we need to read Steam's
 * `libraryfolders.vdf` (extract library root paths) and `appmanifest_<id>.acf`
 * (extract `appid`, `name`, `installdir`, `SizeOnDisk`).
 *
 * Format basics:
 *   "key"  "value"                 → string pair
 *   "key"  { ... }                 → nested block
 *   //                              → line comment
 *
 * The parser returns nested plain objects; string leaves stay as strings.
 */
export type VdfNode = string | { [key: string]: VdfNode };

export function parseVdf(input: string): { [key: string]: VdfNode } {
  let i = 0;
  const len = input.length;

  function skipWhitespaceAndComments(): void {
    while (i < len) {
      const c = input.charCodeAt(i);
      // whitespace
      if (c === 32 || c === 9 || c === 10 || c === 13) {
        i++;
        continue;
      }
      // line comment "//"
      if (c === 47 && input.charCodeAt(i + 1) === 47) {
        while (i < len && input.charCodeAt(i) !== 10) i++;
        continue;
      }
      break;
    }
  }

  function readQuotedString(): string {
    // assumes input[i] === '"'
    i++;
    let out = "";
    while (i < len) {
      const c = input.charCodeAt(i);
      if (c === 92 /* \\ */) {
        const next = input[i + 1];
        out += next ?? "";
        i += 2;
        continue;
      }
      if (c === 34 /* " */) {
        i++;
        return out;
      }
      out += input[i];
      i++;
    }
    return out;
  }

  function parseBlock(): { [key: string]: VdfNode } {
    const obj: { [key: string]: VdfNode } = {};
    while (i < len) {
      skipWhitespaceAndComments();
      if (i >= len) break;
      if (input[i] === "}") {
        i++;
        return obj;
      }
      if (input[i] !== '"') {
        // Skip unrecognized character to stay robust.
        i++;
        continue;
      }
      const key = readQuotedString();
      skipWhitespaceAndComments();
      if (i >= len) break;
      if (input[i] === '"') {
        const value = readQuotedString();
        obj[key] = value;
      } else if (input[i] === "{") {
        i++;
        obj[key] = parseBlock();
      } else {
        // Unrecognized — skip
        i++;
      }
    }
    return obj;
  }

  return parseBlock();
}

/**
 * Walks the nested object case-insensitively for a leaf key, returning the
 * first string value found. Useful since acf files sometimes capitalize
 * `installdir` vs `InstallDir`.
 */
export function findString(node: VdfNode, key: string): string | undefined {
  if (typeof node !== "object" || node === null) return undefined;
  const target = key.toLowerCase();
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (k.toLowerCase() === target && typeof v === "string") return v;
  }
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (typeof v === "object") {
      const found = findString(v, key);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}
