const { orderedWorkspaces, workspaces } = require('./get_dependency_tree');
const workspacePath = require('path').resolve(__dirname, '..');

const clean = process.argv.includes("--clean");

const wcs = orderedWorkspaces.filter(wc => workspaces[wc].packageJson?.tags?.needsCompile);

console.log(`Compiling ${wcs.length} workspaces...`);
for (const wc of wcs) {
    // run build command for each workspace
    console.log(`Compiling ${wc}...`);
    const { execSync } = require('child_process');
    try {

        if (clean) {
            console.log(`Cleaning ${wc}...`);
            execSync(`yarn workspace ${wc} clean`, {
                cwd: workspacePath,
                stdio: 'inherit',
            });
        }
        execSync(`yarn workspace ${wc} build`, {
            cwd: workspacePath,
            stdio: 'inherit',
        });
        console.log(`Successfully compiled ${wc}`);
    } catch (error) {
        console.error(`Failed to compile ${wc}:`, error.message);
        process.exit(1);
    }
}