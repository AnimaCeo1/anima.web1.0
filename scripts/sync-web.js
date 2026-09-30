const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "www");
const entries = [
  "index.html",
  "website.css",
  "slavic-theme.css",
  "home-reference.css",
  "experience.css",
  "styles.css",
  "script.js",
  "website.js",
  "content-pages.js",
  "data/site-data.js",
  "404.html",
  "mock-data.js",
  "assets",
  "locales",
  "services",
  "banya",
  "rituals",
  "products",
  "events",
  "journal",
  "about",
  "contact",
  "contacts",
  "booking",
  "massage",
  "apiary",
];

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const entry of entries) {
  const from = path.join(root, entry);
  const to = path.join(outDir, entry);

  if (!fs.existsSync(from)) {
    throw new Error(`Missing required web asset: ${entry}`);
  }

  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.cpSync(from, to, { recursive: true });
}

console.log(`Copied ${entries.length} web entries to ${path.relative(root, outDir)}`);
