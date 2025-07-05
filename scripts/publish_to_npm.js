const { orderedWorkspaces, workspaces } = require("./get_dependency_tree");
const workspacePath = require("path").resolve(__dirname, "..");
const { execSync } = require("child_process");

const wcs = orderedWorkspaces.filter(
  (wc) => workspaces[wc].packageJson?.tags?.canPublishToNpm,
);

for (const wc of wcs) {
  let remote_version = execSync(`npm view ${wc.name} version`, {
    cwd: workspacePath,
    stdio: "inherit",
  });

  let local_version = workspaces[wc].packageJson.version;

  if (remote_version.toString().trim() === local_version) {
    console.log(
      `Skipping ${wc} as the local version matches the remote version.`,
    );
    continue;
  }

  console.log(`Publishing ${wc}...`);
  try {
    execSync(`cd ${wc.location} && npm publish`, {
      cwd: workspacePath,
      stdio: "inherit",
    });
    console.log(`Successfully published ${wc.name}`);
  } catch (error) {
    console.error(`Failed to publish ${wc.name}:`, error.message);
    process.exit(1);
  }
}
