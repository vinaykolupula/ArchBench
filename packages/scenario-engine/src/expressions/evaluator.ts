/**
 * Safe, pure AST recursive descent expression parser and evaluator.
 * Evaluates mathematical, comparison, and logical expressions without `eval()`.
 */

export type ExpressionContext = Record<string, unknown>;

type TokenType = "NUMBER" | "STRING" | "BOOLEAN" | "IDENTIFIER" | "OPERATOR" | "LPAREN" | "RPAREN";

interface Token {
  type: TokenType;
  value: any;
}

export function evaluateSafeExpression(expr: string, context: ExpressionContext): any {
  const tokens = tokenize(expr);
  const parser = new Parser(tokens, context);
  return parser.parse();
}

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expr.length) {
    const ch = expr[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === "(") {
      tokens.push({ type: "LPAREN", value: "(" });
      i++;
      continue;
    }

    if (ch === ")") {
      tokens.push({ type: "RPAREN", value: ")" });
      i++;
      continue;
    }

    // Number literals
    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(expr[i + 1] || ""))) {
      let numStr = "";
      while (i < expr.length && /[0-9.]/.test(expr[i])) {
        numStr += expr[i];
        i++;
      }
      tokens.push({ type: "NUMBER", value: parseFloat(numStr) });
      continue;
    }

    // String literals ('...' or "...")
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let str = "";
      i++;
      while (i < expr.length && expr[i] !== quote) {
        str += expr[i];
        i++;
      }
      if (i >= expr.length) {
        throw new SyntaxError(`Unterminated string literal in scenario expression: "${expr}"`);
      }
      i++; // skip closing quote
      tokens.push({ type: "STRING", value: str });
      continue;
    }

    // Two-character operators: ==, !=, >=, <=, &&, ||
    const twoChar = expr.slice(i, i + 2);
    if (["==", "!=", ">=", "<=", "&&", "||"].includes(twoChar)) {
      tokens.push({ type: "OPERATOR", value: twoChar });
      i += 2;
      continue;
    }

    // Single-character operators: +, -, *, /, %, >, <, !
    if (["+", "-", "*", "/", "%", ">", "<", "!"].includes(ch)) {
      tokens.push({ type: "OPERATOR", value: ch });
      i++;
      continue;
    }

    // Identifiers (including dot notation e.g. inputs.arrival_rate)
    if (/[a-zA-Z_]/.test(ch)) {
      let ident = "";
      while (i < expr.length && /[a-zA-Z0-9_.]/.test(expr[i])) {
        ident += expr[i];
        i++;
      }
      if (ident === "true") tokens.push({ type: "BOOLEAN", value: true });
      else if (ident === "false") tokens.push({ type: "BOOLEAN", value: false });
      else tokens.push({ type: "IDENTIFIER", value: ident });
      continue;
    }

    throw new Error(`Unexpected character '${ch}' in scenario expression: "${expr}"`);
  }

  return tokens;
}

class Parser {
  private pos = 0;

  constructor(private tokens: Token[], private context: ExpressionContext) {}

  public parse(): any {
    const result = this.parseLogicalOr();
    if (this.pos < this.tokens.length) {
      throw new SyntaxError(
        `Unexpected trailing token "${this.tokens[this.pos]?.value}" in expression`
      );
    }
    return result;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  private parseLogicalOr(): any {
    let left = this.parseLogicalAnd();
    while (this.peek()?.type === "OPERATOR" && this.peek()?.value === "||") {
      this.consume();
      const right = this.parseLogicalAnd();
      left = Boolean(left) || Boolean(right);
    }
    return left;
  }

  private parseLogicalAnd(): any {
    let left = this.parseEquality();
    while (this.peek()?.type === "OPERATOR" && this.peek()?.value === "&&") {
      this.consume();
      const right = this.parseEquality();
      left = Boolean(left) && Boolean(right);
    }
    return left;
  }

  private parseEquality(): any {
    let left = this.parseRelational();
    while (this.peek()?.type === "OPERATOR" && ["==", "!="].includes(this.peek()?.value)) {
      const op = this.consume().value;
      const right = this.parseRelational();
      if (op === "==") left = left === right;
      else if (op === "!=") left = left !== right;
    }
    return left;
  }

  private parseRelational(): any {
    let left = this.parseAdditive();
    while (this.peek()?.type === "OPERATOR" && [">", "<", ">=", "<="].includes(this.peek()?.value)) {
      const op = this.consume().value;
      const right = this.parseAdditive();
      if (op === ">") left = Number(left) > Number(right);
      else if (op === "<") left = Number(left) < Number(right);
      else if (op === ">=") left = Number(left) >= Number(right);
      else if (op === "<=") left = Number(left) <= Number(right);
    }
    return left;
  }

  private parseAdditive(): any {
    let left = this.parseMultiplicative();
    while (this.peek()?.type === "OPERATOR" && ["+", "-"].includes(this.peek()?.value)) {
      const op = this.consume().value;
      const right = this.parseMultiplicative();
      if (op === "+") left = Number(left) + Number(right);
      else if (op === "-") left = Number(left) - Number(right);
    }
    return left;
  }

  private parseMultiplicative(): any {
    let left = this.parseUnary();
    while (this.peek()?.type === "OPERATOR" && ["*", "/", "%"].includes(this.peek()?.value)) {
      const op = this.consume().value;
      const right = this.parseUnary();
      if (op === "*") left = Number(left) * Number(right);
      else if (op === "/") {
        const denom = Number(right);
        left = denom === 0 ? 0 : Number(left) / denom;
      } else if (op === "%") {
        left = Number(left) % Number(right);
      }
    }
    return left;
  }

  private parseUnary(): any {
    if (this.peek()?.type === "OPERATOR" && this.peek()?.value === "!") {
      this.consume();
      return !this.parseUnary();
    }
    if (this.peek()?.type === "OPERATOR" && this.peek()?.value === "-") {
      this.consume();
      return -Number(this.parseUnary());
    }
    return this.parsePrimary();
  }

  private parsePrimary(): any {
    const token = this.consume();
    if (!token) throw new Error("Unexpected end of expression");

    if (token.type === "NUMBER" || token.type === "STRING" || token.type === "BOOLEAN") {
      return token.value;
    }

    if (token.type === "IDENTIFIER") {
      return this.resolveIdentifier(token.value);
    }

    if (token.type === "LPAREN") {
      const val = this.parseLogicalOr();
      if (this.consume()?.type !== "RPAREN") {
        throw new Error("Missing closing parenthesis ')'");
      }
      return val;
    }

    throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
  }

  private resolveIdentifier(pathStr: string): any {
    const parts = pathStr.split(".");
    let curr: any = this.context;
    for (const part of parts) {
      if (part === "__proto__" || part === "constructor" || part === "prototype") {
        throw new Error(`Forbidden property access "${part}" in scenario expression`);
      }
      if (
        curr === undefined ||
        curr === null ||
        typeof curr !== "object" ||
        !Object.prototype.hasOwnProperty.call(curr, part)
      ) {
        return undefined;
      }
      curr = curr[part];
    }
    return curr;
  }
}

