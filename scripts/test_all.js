const { orderedWorkspaces, workspaces } = require("./get_dependency_tree");
const workspacePath = require("path").resolve(__dirname, "..");

const wcs = orderedWorkspaces.filter(
  (wc) => workspaces[wc].packageJson?.tags?.needsCompile,
);

console.log(`Testing ${wcs.length} workspaces...`);
for (const wc of wcs) {
  // run build command for each workspace
  console.log(`Testing ${wc}...`);
  const { execSync } = require("child_process");
  try {
    execSync(`yarn workspace ${wc} test`, {
      cwd: workspacePath,
      stdio: "inherit",
    });
    console.log(`Successfully tested ${wc}`);
  } catch (error) {
    console.error(`Failed to test ${wc}:`, error.message);
    process.exit(1);
  }
}
