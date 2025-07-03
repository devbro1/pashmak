export class HttpError extends Error {
  constructor(
    public httpCode: number,
    public message: string,
    public code: string = "HTTP_ERROR",
    public details: string | Record<string, any> | undefined = undefined) {
    super(message);
  }
}

export class HttpBadRequestError extends HttpError {
  constructor(
    message: string = "Bad Request",
    code: string = "BAD_REQUEST",
    details: string | Record<string, any> | undefined = undefined,
  ) {
    super(400, message, code, details);
  }
}

export class HttpUnauthorizedError extends HttpError {
  constructor(
    message: string = "Unauthorized",
    code: string = "UNAUTHORIZED",
    details: string | Record<string, any> | undefined = undefined,
  ) {
    super(401, message, code, details);
  }
}

export class HttpNotFoundError extends HttpError {
  constructor(
    message: string = "Not Found",
    code: string = "NOT_FOUND",
    details: string | Record<string, any> | undefined = undefined,
  ) {
    super(404, message, code, details);
  }
}

export class HttpUnsupportedMediaTypeError extends HttpError {
  constructor(
    message: string = "Unsupported Media Type",
    code: string = "UNSUPPORTED_MEDIA_TYPE",
    details: string | Record<string, any> | undefined = undefined,
  ) {
    super(415, message, code, details);
  }
}