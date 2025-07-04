const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get workspace info
const workspacesOutput = execSync('yarn workspaces info --json', { 
  cwd: path.resolve(__dirname, '..'), 
  encoding: 'utf8' 
});

// Extract the JSON part from the output (remove yarn prefix and suffix)
const jsonStart = workspacesOutput.indexOf('{');
const jsonEnd = workspacesOutput.lastIndexOf('}') + 1;
const workspacesJson = workspacesOutput.substring(jsonStart, jsonEnd);
const workspaces = JSON.parse(workspacesJson);

// Add additional information to each workspace (version, tags, etc.)
Object.keys(workspaces).forEach(workspaceName => {
  const workspace = workspaces[workspaceName];
  const packageJsonPath = path.resolve(__dirname, '..', workspace.location, 'package.json');
  workspaces[workspaceName].name = workspaceName;
  
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      workspaces[workspaceName].packageJson = packageJson;
    } catch (error) {
      console.error(`Error reading package.json for ${workspaceName}:`, error.message);
    }
  }
});

// create a list of all workspaces in the order of their dependencies
const orderedWorkspaces = [];
const visited = new Set();
function visit(workspace) {
  if (visited.has(workspace)) return;
  visited.add(workspace);

  const dependencies = workspaces[workspace].workspaceDependencies || [];
  dependencies.forEach(dep => visit(dep));
  
  orderedWorkspaces.push(workspace);
}
Object.keys(workspaces).forEach(workspace => {
  visit(workspace);
});



module.exports = {
  orderedWorkspaces,
  workspaces,
};