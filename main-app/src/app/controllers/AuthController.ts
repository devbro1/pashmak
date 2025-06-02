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
import { Model, Param, ValidatedRequest } from "@root/helpers";
import * as yup from "yup";

@Controller("/api/v1/auth")
export class AuthController extends BaseController {
  static loginValidation = yup.object({
    username: yup.string().required().min(1).max(255),
    password: yup.string().required().min(3).max(255),
  });

  @Post()
  async store(@ValidatedRequest(AuthController.loginValidation) userInfo: any) {
    return userInfo;
  }
}
