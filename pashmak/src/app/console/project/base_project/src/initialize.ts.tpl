import dotenv from 'dotenv';
dotenv.config();

import { bootstrap } from '@devbro/pashmak';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from '@devbro/pashmak/config';
import { httpServer, logger, mailer } from '@devbro/pashmak/facades';
import { startQueueListeners } from '@/app/queues';
import { HttpError } from '@devbro/pashmak/http';
{{#if (eq validation_library "yup")}}import * as yup from 'yup';{{/if}}{{#if (eq validation_library "zod")}}import { z, ZodError } from 'zod';{{/if}}

import './app/console';
import './routes';
import './schedules';

const config_data = await loadConfig(dirname(fileURLToPath(import.meta.url)) + '/config/default');

await bootstrap({
  root_dir: dirname(fileURLToPath(import.meta.url)),
  config_data,
});

httpServer().setErrorHandler(async (err: Error, req: any, res: any) => {
    if (err instanceof HttpError) {
      res.writeHead(err.statusCode, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: err.message, error: err.code }));
      logger().warn({ msg: "HttpError: " + err.message, err });
      return;
    {{#if (eq validation_library "zod")}}
    } else if (err instanceof ZodError) {
      res.writeHead(422, { "Content-Type": "application/json" });
      const { errors } = z.treeifyError(err);

      res.end(JSON.stringify({ message: "validation error", errors: errors }));
      logger().warn({ msg: "ZodError: " + err.message, err });
      return;
    {{/if}}
    {{#if (eq validation_library "yup")}}
    } else if (err instanceof yup.ValidationError) {
      res.writeHead(422, { "Content-Type": "application/json" });
      const errs: any = {};
      err.inner.forEach((e: yup.ValidationError) => {
        // Sanitize sensitive fields
        const sanitizedParams = { ...e.params };
        if (/passw/i.test(e.path!)) {
          sanitizedParams.value = "******";
          sanitizedParams.originalValue = "******";
        }

        errs[e.path!] = {
          type: e.type,
          message: e.message,
          params: sanitizedParams,
        };
      });

      res.end(JSON.stringify({ message: "validation error", errors: errs }));
      logger().warn({ msg: "ValidationError: " + err.message, err });
      return;
    {{/if}}
    } else {
      logger().error({ msg: "Error: " + err.message, err });
    }
    res.writeHead(500, { "Content-Type": "" });
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  });

startQueueListeners();
