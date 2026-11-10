import YAML from "yaml";
import { SourceLocation } from "../types/index.js";

export interface ParsedDocument<T = unknown> {
  data: T;
  getLocationForPath(path: string[] | string): SourceLocation | undefined;
  rawText: string;
}

/**
 * Parses a YAML or JSON string into a structured JavaScript object
 * and builds a source-map index to map object paths to line and column numbers.
 */
export function parseArchSpecText<T = unknown>(rawText: string): ParsedDocument<T> {
  const doc = YAML.parseDocument(rawText, { keepSourceTokens: true });

  if (doc.errors.length > 0) {
    const firstErr = doc.errors[0];
    const linePos = firstErr.linePos?.[0] ?? { line: 1, col: 1 };
    throw new SyntaxError(
      `YAML Parsing Error at line ${linePos.line}, col ${linePos.col}: ${firstErr.message}`
    );
  }

  const data = doc.toJS() as T;

  const getLocationForPath = (path: string[] | string): SourceLocation | undefined => {
    const pathArray = Array.isArray(path)
      ? path
      : path.split(".").filter((segment) => segment.length > 0);

    try {
      const node = doc.getIn(pathArray, true);
      if (node && typeof node === "object" && "range" in node && Array.isArray((node as any).range)) {
        const offset = (node as any).range[0];
        // Calculate line and col from offset in rawText
        const lines = rawText.slice(0, offset).split("\n");
        const line = lines.length;
        const column = lines[lines.length - 1].length + 1;
        return { line, column };
      }
    } catch {
      // Path resolution failure falls back to undefined
    }
    return undefined;
  };

  return {
    data,
    getLocationForPath,
    rawText,
  };
}

