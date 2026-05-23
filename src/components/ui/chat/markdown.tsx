import type { JSX, ReactNode } from "react";

/**
 * Tiny markdown renderer for AI replies.
 *
 * Supports the subset that the LLM actually produces:
 *   - paragraphs (blank-line separated)
 *   - `**bold**` / `__bold__`
 *   - `*italic*` / `_italic_`
 *   - `` `inline code` ``
 *   - triple-backtick fenced code blocks
 *   - `-` / `*` bullet lists
 *   - `1.` ordered lists
 *
 * Intentionally avoids pulling in a real markdown library to keep the bundle
 * small. If we ever need GFM tables / footnotes / images, swap to
 * `react-markdown` here — every caller already routes prose through this
 * function.
 */
export function renderMarkdown(text: string): ReactNode {
  if (!text) return null;
  const blocks = splitBlocks(text);
  return blocks.map((block, i) => renderBlock(block, i));
}

interface CodeBlock {
  kind: "code";
  language?: string;
  body: string;
}
interface ListBlock {
  kind: "list";
  ordered: boolean;
  items: string[];
}
interface ParagraphBlock {
  kind: "para";
  body: string;
}
type Block = CodeBlock | ListBlock | ParagraphBlock;

function splitBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.split(/\r?\n/);

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block — ```lang\n…\n```
    const fenceMatch = line.match(/^```(\w+)?\s*$/);
    if (fenceMatch) {
      const language = fenceMatch[1];
      const buf: string[] = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i += 1;
      }
      // skip the closing fence
      if (i < lines.length) i += 1;
      blocks.push({ kind: "code", language, body: buf.join("\n") });
      continue;
    }

    // Bulleted / numbered list — gather adjacent list lines.
    const bulletMatch = line.match(/^\s*[-*]\s+(.+)$/);
    const numberMatch = line.match(/^\s*\d+\.\s+(.+)$/);
    if (bulletMatch || numberMatch) {
      const ordered = !!numberMatch;
      const items: string[] = [];
      while (i < lines.length) {
        const next = lines[i];
        const b = next.match(/^\s*[-*]\s+(.+)$/);
        const n = next.match(/^\s*\d+\.\s+(.+)$/);
        if (ordered ? n : b) {
          items.push((ordered ? n![1] : b![1]).trim());
          i += 1;
        } else {
          break;
        }
      }
      blocks.push({ kind: "list", ordered, items });
      continue;
    }

    // Blank line → paragraph break
    if (line.trim() === "") {
      i += 1;
      continue;
    }

    // Paragraph — consume lines until a blank line or a structural line.
    const buf: string[] = [line];
    i += 1;
    while (i < lines.length) {
      const next = lines[i];
      if (
        next.trim() === "" ||
        /^```/.test(next) ||
        /^\s*[-*]\s+/.test(next) ||
        /^\s*\d+\.\s+/.test(next)
      ) {
        break;
      }
      buf.push(next);
      i += 1;
    }
    blocks.push({ kind: "para", body: buf.join(" ") });
  }
  return blocks;
}

function renderBlock(block: Block, key: number): ReactNode {
  if (block.kind === "code") {
    return (
      <pre
        key={key}
        className="my-2 overflow-x-auto rounded-lg border border-separator bg-input/60 px-3 py-2 font-mono text-[11.5px] leading-relaxed text-foreground/85"
      >
        <code>{block.body}</code>
      </pre>
    );
  }
  if (block.kind === "list") {
    const Tag = (block.ordered ? "ol" : "ul") as "ul" | "ol";
    return (
      <Tag
        key={key}
        className={
          block.ordered
            ? "my-1 ml-4 list-decimal space-y-0.5"
            : "my-1 ml-4 list-disc space-y-0.5"
        }
      >
        {block.items.map((item, idx) => (
          <li key={idx} className="leading-relaxed text-foreground/90">
            {renderInline(item)}
          </li>
        ))}
      </Tag>
    );
  }
  return (
    <p key={key} className="my-1 leading-relaxed first:mt-0 last:mb-0">
      {renderInline(block.body)}
    </p>
  );
}

/**
 * Inline span renderer: handles **bold**, *italic*, `code`. Walks the string
 * once and emits an array of React nodes — keeps the output deterministic and
 * SSR-safe.
 */
function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g);
  tokens.forEach((tok, i) => {
    if (!tok) return;
    if (tok.startsWith("`") && tok.endsWith("`") && tok.length >= 2) {
      out.push(
        <code
          key={i}
          className="rounded bg-input/70 px-1 py-[1px] font-mono text-[11.5px] text-foreground/85"
        >
          {tok.slice(1, -1)}
        </code>,
      );
      return;
    }
    if (
      (tok.startsWith("**") && tok.endsWith("**") && tok.length >= 4) ||
      (tok.startsWith("__") && tok.endsWith("__") && tok.length >= 4)
    ) {
      out.push(
        <strong key={i} className="font-semibold text-foreground">
          {tok.slice(2, -2)}
        </strong>,
      );
      return;
    }
    if (
      (tok.startsWith("*") && tok.endsWith("*") && tok.length >= 2) ||
      (tok.startsWith("_") && tok.endsWith("_") && tok.length >= 2)
    ) {
      out.push(
        <em key={i} className="italic text-foreground/90">
          {tok.slice(1, -1)}
        </em>,
      );
      return;
    }
    out.push(<span key={i}>{tok}</span>);
  });
  return out;
}

// Re-export so consumers can pull both helpers from `./markdown`.
export type { JSX };
