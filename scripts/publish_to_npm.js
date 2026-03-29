const { orderedWorkspaces, workspaces } = require("./get_dependency_tree");
const workspacePath = require("path").resolve(__dirname, "..");
const { execSync } = require("child_process");

const wcs = orderedWorkspaces.filter(
  (wc) => workspaces[wc].packageJson?.tags?.canPublishToNpm,
);

for (const wc of wcs) {
  let remote_version = "0.0.0";
  try {
    remote_version = execSync(`npm view ${wc} version`, {
      cwd: workspacePath,
    })
      .toString()
      .trim();
  } catch {}

  console.warn(wc, remote_version);

  let local_version = workspaces[wc].packageJson.version;

  if (remote_version === local_version) {
    console.log(
      `Skipping ${wc} as the local version matches the remote version.`,
    );
    continue;
  }

  console.log(`Publishing ${wc} from ${remote_version} to ${local_version}...`);
  try {
    execSync(
      `cd ${workspaces[wc].location} && npm_config_registry= npm publish --access public`,
      {
        cwd: workspacePath,
      },
    );
    console.log(`Successfully published ${wc}`);
  } catch (error) {
    console.error(`Failed to publish ${wc}:`, error.message);
    process.exit(1);
  }
}
