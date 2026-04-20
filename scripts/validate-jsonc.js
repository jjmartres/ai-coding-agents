#!/usr/bin/env node
// Validates JSONC files (JSON with comments and trailing commas).
// Usage: node validate-jsonc.js file1.jsonc file2.jsonc ...

const fs = require("fs");

const files = process.argv.slice(2);
let failed = false;

for (const file of files) {
  process.stdout.write(`Validating ${file}... `);
  try {
    const content = fs.readFileSync(file, "utf8");

    // Strip single-line comments, but not // inside strings or URLs
    let stripped = content.replace(/("(?:[^"\\]|\\.)*")|\/\/[^\n]*/g, (match, str) => str ?? "");

    // Strip multi-line comments
    stripped = stripped.replace(/\/\*[\s\S]*?\*\//g, "");

    // Remove trailing commas before } or ]
    stripped = stripped.replace(/,(\s*[}\]])/g, "$1");

    JSON.parse(stripped);
    console.log("✓ valid");
  } catch (err) {
    console.error(`✗ invalid\n  Error: ${err.message}`);
    failed = true;
  }
}

process.exit(failed ? 1 : 0);
