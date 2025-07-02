import { BadRequest, NotFound } from "http-errors";
import * as jwt from "jsonwebtoken";
import { config } from "neko-config";


export function createJwtToken(data: any, token_params: jwt.SignOptions = {}) {
  const secret = config.get("jwt.secret") as string;
  const token_params2 = config.get("jwt.options") as jwt.SignOptions;
  const token = jwt.sign(data, secret, { ...token_params2, ...token_params });

  if (!token) {
    throw new Error("Unable to sign token !!");
  }
  return token;
}

export async function decodeJwtToken(token: string) {
  if ((await jwt.verify(token, config.get("jwt.public")))) {
    return await jwt.decode(token);
  }

  if ((await jwt.verify(token, config.get("jwt.public_retired")))) {
    return await jwt.decode(token);
  }

  throw new BadRequest(
    "bad token. invalid, expired, or signed with wrong key.",
  );
  
}
