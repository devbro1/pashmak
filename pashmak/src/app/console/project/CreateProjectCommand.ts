import { Command, Option } from "clipanion";
import { Case } from "change-case-all";
import path from "path";
import * as fs from "fs/promises";
import { fileURLToPath } from "url";
import handlebars from "handlebars";
import { execSync } from "child_process";

export class CreateProjectCommand extends Command {
  static paths = [[`create`, `project`]];

  static usage = Command.Usage({
    category: `Project`,
    description: `Create a new project`,
    details: `
      This command creates a new project with the specified name at the given path.
      If no path is provided, the project will be created in the current directory.
    `,
    examples: [
      [
        `Create a new project in specified directory`,
        `create project --path /path/to/my-project --git`,
      ],
      [
        `Create a new project at a specific path with git initialized`,
        `create project --path /path/to/my-project --git`,
      ],
    ],
  });

  projectPath = Option.String("--path", { required: true });

  git = Option.Boolean(`--git`, false, {
    description: `Initialize a git repository in the new project`,
  });

  async folderExists(folderPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(folderPath);
      return stats.isDirectory();
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return false; // Folder does not exist
      }
      throw error; // Other errors (e.g., permission issues)
    }
  }

  async execute() {
    // Create the project directory path by joining the specified path and project name
    const projectPath = path.join(this.projectPath);
    // Check if directory already exists
    try {
      await fs.access(projectPath);
      console.error(`Error: Directory ${projectPath} already exists.`);
      return 1;
    } catch {
      // Directory doesn't exist, we can proceed
    }

    await fs.mkdir(projectPath, { recursive: true });
    console.log(`Created project directory at: ${projectPath}`);

    let dirname = __dirname;
    if (!dirname) {
      dirname = path.dirname(fileURLToPath(import.meta.url));
    }

    let basePath = path.join(dirname, `./base_project`);
    if ((await this.folderExists(basePath)) === false) {
      // we are running a compiled code that was bundled and the code is running from ./dist/bin/ folder.
      basePath = path.join(dirname, `../app/console/project/base_project`);
    }

    console.log(`Using base project path: ${basePath}`);
    //copy content of ./base_project to the new project directory
    const baseProjectPath = basePath;

    await this.processTplFolder(baseProjectPath, projectPath, {});
    console.log(`Copied base project files to: ${projectPath}`);

    //modify package.json with foldername
    const packageJsonPath = path.join(projectPath, `package.json`);
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, `utf-8`));
    packageJson.name = Case.snake(path.basename(projectPath));
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`Updated package.json with project name: ${packageJson.name}`);

    if (this.git) {
      try {
        execSync(
          'git init; git add --all; git commit --allow-empty -m "chore: first commit for pashmak"',
          {
            cwd: projectPath,
          },
        );
      } catch (error) {
        console.error(`Failed to create project.`, error);
        return 1;
      }
    }
  }

  async processTplFolder(src: string, dest: string, data: any = {}) {
    const files = await fs.readdir(src, { withFileTypes: true });
    for (const file of files) {
      const srcPath = path.join(src, file.name);
      const destPath =
        file.isFile() && file.name.endsWith(".tpl")
          ? path.join(dest, file.name.substring(0, file.name.length - 4))
          : path.join(dest, file.name);

      if (file.isDirectory()) {
        await fs.mkdir(destPath, { recursive: true });
        await this.processTplFolder(srcPath, destPath, data);
      } else if (file.name.endsWith(".tpl")) {
        await this.processTplFile(srcPath, destPath, {});
      } else {
        throw new Error(
          "unexpected non tpl file: " + srcPath + " " + file.name,
        );
      }
    }
  }

  async processTplFile(src: string, dest: string, data: any = {}) {
    const compiledTemplate = handlebars.compile(
      (await fs.readFile(src)).toString(),
    );
    const template = await compiledTemplate(data);
    await fs.writeFile(dest, template);
  }
}
