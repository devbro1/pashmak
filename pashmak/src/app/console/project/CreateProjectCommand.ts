import { cli } from "../../../facades";
import { Command, Option } from "clipanion";
import { Case } from "change-case-all";
import path from "path";
import * as fs from "fs/promises";
import { fileURLToPath } from "url";
import handlebars from "handlebars";
import { execSync } from "child_process";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
        `Create a new project in the current directory`,
        `create project my-project`,
      ],
      [
        `Create a new project at a specific path`,
        `create project my-project --path /path/to/projects`,
      ],
    ],
  });

  projectPath = Option.String(`--path`, process.cwd(), {
    description: `Path where the project should be created`,
  });

  git = Option.Boolean(`--git`, false, {
    description: `Initialize a git repository in the new project`,
  });

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

    //copy content of ./base_project to the new project directory
    const baseProjectPath = path.join(__dirname, `./base_project`);

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
        throw new Error("unexpected non tpl file");
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

cli().register(CreateProjectCommand);
