/** @file Jason Stys: TypeScript compiler declaration/variable line index; functions/state: docs/SOURCE_MAP.md. */
import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

/** Visit authored TS/TSX/MJS files only; no dependency or runtime tree is evaluated. */
function collect(root) {
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const name = path.join(root, entry.name);
    return entry.isDirectory() ? collect(name) : /\.(?:ts|tsx|mjs)$/.test(name) ? [name] : [];
  });
}

for (const file of [...collect("ui/src"), ...collect("tests/browser"), ...collect("tools").filter((name) => name.endsWith(".mjs")), "vite.config.ts", "playwright.config.ts"]) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true);
  const records = new Map();
  function visit(node) {
    if (ts.isVariableDeclaration(node) || ts.isFunctionDeclaration(node) || ts.isClassDeclaration(node) || ts.isParameter(node)) {
      if (node.name) {
        const name = node.name.getText(source).replace(/\s+/g, " ").replaceAll("|", "/");
        const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
        records.set(`${line}:${name}`, `| \`${file.replaceAll("\\", "/")}\` | ${line} | \`${name}\` |`);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  for (const row of records.values()) console.log(row);
}
