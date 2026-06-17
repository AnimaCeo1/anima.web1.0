const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "www");
const entries = [
  "index.html",
  "styles.css",
  "script.js",
  "mock-data.js",
  "assets",
  "locales",
  "services",
];

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const entry of entries) {
  const from = path.join(root, entry);
  const to = path.join(outDir, entry);

  if (!fs.existsSync(from)) {
    throw new Error(`Missing required web asset: ${entry}`);
  }

  fs.cpSync(from, to, { recursive: true });
}

console.log(`Copied ${entries.length} web entries to ${path.relative(root, outDir)}`);
