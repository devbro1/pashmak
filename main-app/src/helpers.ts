import { BadRequest, NotFound } from "http-errors";
import * as jwt from "jsonwebtoken";
import config from "config";


export function createJwtToken(data: any, token_params: jwt.SignOptions = {}) {
  const secret = config.get<string>("jwt.secret");
  const token_params2 = config.get<jwt.SignOptions>("jwt.options");
  const token = jwt.sign(data, secret, { ...token_params2, ...token_params });

  if (!token) {
    throw new Error("Unable to sign token !!");
  }
  return token;
}

export async function decodeJwtToken(token: string) {
  if (!(await jwt.verify(token, config.get<string>("jwt.public")))) {
    throw new BadRequest(
      "bad token. invalid, expired, or signed with wrong key.",
    );
  }

  return await jwt.decode(token);
}
