import { Command, Option } from "clipanion";
import { generateKeyPairSync } from "crypto";
import fs from "fs/promises";
import path from "path";
import { logger, cli } from "../../facades.mjs";

export class KeyGenerateCommand extends Command {
  static paths = [[`generate`, "key"]];

  static usage = Command.Usage({
    category: `Main`,
    description: `generate keys`,
    details: `
      This command generates RSA key pair for JWT signing.
      Use --rotate flag to preserve old public key.
    `,
    examples: [
      [`Generate new keys`, `generate key`],
      [`Rotate existing keys`, `generate key --rotate`],
    ],
  });

  rotate = Option.Boolean(`--rotate`, false, {
    description: `Rotate existing keys (backup old keys before replacement)`,
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

    let envfile = "";
    try {
      envfile = await fs.readFile(path.join(process.cwd(), ".env"), "utf-8");
    } catch {}
    let old_public_key = envfile.match(/^jwt_secret_public=(.*)/m);

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

    if (this.rotate && old_public_key && old_public_key[1]) {
      envfile = this.addEnvParam(
        envfile,
        "jwt_secret_public_retired",
        old_public_key[1],
      );
    }

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
