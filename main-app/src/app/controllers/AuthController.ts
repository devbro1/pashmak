import {
  BaseController,
  Controller,
  Get,
  Post,
} from "neko-router/src/Controller";
import { logResponseMiddleware } from "@root/middlewares";
import { db, storage } from "@root/facades";
import { ctx } from "neko-helper/src";
import { Request, Response } from "neko-router/src/types";
import fs from "fs";
import { Animal } from "../models/Animal";
import {
  createJwtToken,
  decodeJwtToken,
  Model,
  Param,
  ValidatedRequest,
} from "@root/helpers";
import * as yup from "yup";
import { User } from "../models/User";
import { HttpError, BadRequest } from "http-errors";
import { compareBcrypt } from "neko-helper/src/crypto";
import config from "config";
import ms from "ms";
import { JwtPayload } from "jsonwebtoken";

@Controller("/api/v1/auth")
export class AuthController extends BaseController {
  static loginValidation = yup.object({
    username: yup.string().required().min(1).max(255),
    password: yup.string().required().min(3).max(255),
  });

  static refreshValidation = yup.object({
    refresh_token: yup.string().required().min(1).max(500),
  });

  @Post()
  async store(@ValidatedRequest(AuthController.loginValidation) userInfo: any) {
    const user = await User.findOne({ username: userInfo.username });

    if (!user || !(await compareBcrypt(userInfo.password, user.password))) {
      throw new BadRequest("Invalid username or password");
    }

    if (!user.active) {
      throw new BadRequest(
        "This user is not active, please contact your admin.",
      );
    }

    return {
      access_token: await createJwtToken(user.toJson()),
      token_type: "Bearer",
      refresh_token: await createJwtToken(
        { refresh: true, user_id: user.id },
        { expiresIn: "72h" },
      ),
      expires_in:
        ms(config.get<string>("jwt.options.expiresIn") as ms.StringValue) /
        1000,
      scope: "*",
    };
  }

  @Post({ path: "/refresh" })
  async refresh(@ValidatedRequest(AuthController.loginValidation) body: any) {
    let refresh_token = body.refresh_token;
    let payload = (await decodeJwtToken(refresh_token))! as JwtPayload;

    const user = await User.findOne({ id: payload.user_id });

    if (!user) {
      throw new BadRequest("Invalid user_id");
    }

    if (!user.active) {
      throw new BadRequest(
        "This user is not active, please contact your admin.",
      );
    }

    return {
      access_token: await createJwtToken(user.toJson()),
      token_type: "Bearer",
      scope: "*",
    };
  }
}
