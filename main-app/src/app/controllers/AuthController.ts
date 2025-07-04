import {
  createJwtToken,
  decodeJwtToken,
} from "../../helpers";
import * as yup from "yup";
import { User } from "../models/User";
import { HttpBadRequestError } from "@devbro/pashmak/http";
import { compareBcrypt } from "neko-helper";
import { config } from "neko-config";
import { JwtPayload } from "jsonwebtoken";
import { ValidatedRequest, BaseController, Controller, Get, Post } from "@devbro/pashmak/router";
import { router } from "@devbro/pashmak/facades";

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
      throw new HttpBadRequestError("Invalid username or password");
    }

    if (!user.active) {
      throw new HttpBadRequestError(
        "This user is not active, please contact your admin.",
      );
    }

    return {
      access_token: await createJwtToken(user.toJson()),
      token_type: "Bearer",
      refresh_token: await createJwtToken(
        { refresh: true, user_id: user.id },
        config.get("jwt.refresh_options"),
      ),
      expires_in: config.get("jwt.options.expiresIn", 3600) as number,
      scope: "*",
    };
  }

  @Post({ path: "/refresh" })
  async refresh(@ValidatedRequest(AuthController.loginValidation) body: any) {
    const refresh_token = body.refresh_token;
    const payload = (await decodeJwtToken(refresh_token))! as JwtPayload;

    if (payload.refresh !== true) {
      throw new HttpBadRequestError(
        "bad token. invalid, expired, or signed with wrong key.",
      );
    }

    const user = await User.findOne({ id: payload.user_id });

    if (!user) {
      throw new HttpBadRequestError("Invalid user_id");
    }

    if (!user.active) {
      throw new HttpBadRequestError(
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

router().addController(AuthController);