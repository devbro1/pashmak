import dotenv from 'dotenv';
dotenv.config();

import { bootstrap } from '@devbro/pashmak';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { loadConfig } from '@devbro/pashmak/config';
import { httpServer, logger, mailer } from '@devbro/pashmak/facades';
import { Notification } from '@/app/models';
import { startQueueListeners } from './app/queues';
import { HttpError } from '@devbro/pashmak/http';
import * as yup from 'yup';
import z, { ZodError } from 'zod';

import './YupValidation';
import './app/console';
import './routes';
import './schedules';

const config_data = await loadConfig(dirname(fileURLToPath(import.meta.url)) + '/config/default');

await bootstrap({
  root_dir: dirname(fileURLToPath(import.meta.url)),
  config_data,
});

mailer().on('failed', async ({ mail, error }) => {
  logger().error('mailer failed to send', { mail, error });
  let notification = await Notification.createEmail(mail);
  notification.status = 'failed';
  await notification.save();
});

mailer().on('sent', async ({ mail }) => {
  let notification = await Notification.createEmail(mail);
  notification.status = 'sent';
  console.log('mailer sent', { mail });
  await notification.save();
});

httpServer().setErrorHandler(async (err: Error, req: any, res: any) => {
    if (err instanceof HttpError) {
      res.writeHead(err.statusCode, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: err.message, error: err.code }));
      logger().warn({ msg: "HttpError: " + err.message, err });
      return;
    } else if (err instanceof ZodError) {
      res.writeHead(422, { "Content-Type": "application/json" });
      const { errors } = z.treeifyError(err);

      res.end(JSON.stringify({ message: "validation error", errors: errors }));
      logger().warn({ msg: "ZodError: " + err.message, err });
      return;
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
    } else {
      logger().error({ msg: "Error: " + err.message, err });
    }
    res.writeHead(500, { "Content-Type": "" });
    res.end(JSON.stringify({ error: "Internal Server Error" }));
  });

startQueueListeners();
