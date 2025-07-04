import { Command, Option } from "clipanion";
import { generateKeyPairSync } from "crypto";
import fs from "fs/promises";
import path from "path";
import { logger, cli } from "../../facades";

export class KeyGenerateCommand extends Command {
  static paths = [[`key`, "generate"]];

  static usage = Command.Usage({
    category: `Main`,
    description: `generate keys`,
    details: `
      TODO
    `,
    examples: [],
  });

  async execute() {
    logger().info("generating keys for jwt token and adding to .env file");
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048, // 2048-bit key is standard for RS256
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
      },
    });

    let envfile = await fs.readFile(path.join(process.cwd(), ".env"), "utf-8");
    envfile = this.addEnvParam(
      envfile,
      "jwt_secret_public",
      this.stripPemHeaders(publicKey),
    );
    envfile = this.addEnvParam(
      envfile,
      "jwt_secret_private",
      this.stripPemHeaders(privateKey),
    );

    await fs.writeFile(path.join(process.cwd(), ".env"), envfile, "utf-8");
  }

  addEnvParam(file: string, key: string, value: string) {
    let regex = new RegExp(`^${key}=.*`, "gm");
    file = file.replace(regex, `${key}=${value}`);
    const match = file.match(regex);

    if (!match) {
      file = file + `\n${key}=${value}`;
    }
    return file;
  }

  stripPemHeaders(pem: string) {
    return pem
      .replace(/-----BEGIN [\w\s]+-----/g, "")
      .replace(/-----END [\w\s]+-----/g, "")
      .replace(/\r?\n|\r/g, "");
  }
}

cli().register(KeyGenerateCommand);
