const fs = require("fs");
const path = require("path");
const isDev = process.argv.includes("--dev");
const folders = [
  "neko-sql",
  "neko-orm",
  "neko-storage",
  "neko-scheduler",
  "neko-logger",
  "neko-context",
  "neko-helper",
  "neko-router",
  "neko-http",
];

folders.forEach((folder) => {
  const pkgJsonPath = path.join(__dirname, "..", folder, "package.json");

  if (!fs.existsSync(pkgJsonPath)) {
    console.warn(`Skipping ${pkgJsonPath}: package.json not found.`);
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
  let changed = false;

  if (pkg.exports) {
    if (isDev) {
      pkg.exports["."].require = "./src/index.ts";
      pkg.exports["."].import = "./src/index.ts";
      changed = true;
    } else {
      pkg.exports["."].require = "./dist/index.js";
      pkg.exports["."].import = "./dist/index.mjs";
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(pkgJsonPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log(`Updated ${pkgJsonPath}`);
  }
});
