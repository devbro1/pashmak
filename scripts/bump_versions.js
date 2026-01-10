const { orderedWorkspaces, workspaces } = require("./get_dependency_tree");
const workspacePath = require("path").resolve(__dirname, "..");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const clean = process.argv.includes("--clean");

const wcs = orderedWorkspaces.filter(
  (wc) => workspaces[wc].packageJson?.tags?.needsCompile,
);

let changedFiles = execSync("git diff --name-only master", {
  cwd: workspacePath,
  // stdio: 'inherit',
});

let changed_files = changedFiles
  .toString()
  .split("\n")
  .map((f) => f.trim())
  .filter((f) => f.length > 0);

let wc_locations = Object.entries(workspaces).map(([, wc]) => wc.location);

let to_bump = new Set();
for (const loc of wc_locations) {
  if (changed_files.some((f) => f.startsWith(loc))) {
    to_bump.add(loc);
  }
}

// check if ${loc}/package.json has a line version already bumped
for (const loc of to_bump) {
  let pchanges = execSync(`git diff HEAD ${loc}/package.json`, {
    cwd: workspacePath,
    // stdio: 'inherit',
  })
    .toString()
    .split("\n")
    .map((f) => f.trim())
    .filter((f) => f.length > 0)
    .filter((f) => /\+\s*"version"/.test(f));
  console.log("changedFiles", loc, pchanges);
  if (pchanges.length > 0) {
    to_bump.delete(loc);
  }
}

for (const loc of to_bump) {
  let packageJson = JSON.parse(
    fs.readFileSync(path.join(loc, "package.json"), "utf-8"),
  );
  let versionParts = packageJson.version
    .split(".")
    .map((num) => parseInt(num, 10));
  versionParts[2] += 1; // Increment patch version
  let newVersion = versionParts.join(".");
  packageJson.version = newVersion;
  fs.writeFileSync(
    path.join(loc, "package.json"),
    JSON.stringify(packageJson, null, 2) + "\n",
    "utf-8",
  );
  console.log(`Bumped version to ${newVersion} in workspace at ${loc}`);
}
