export class HttpError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string = 'HTTP_ERROR',
    public details: string | Record<string, any> | undefined = undefined
  ) {
    super(message);
  }
}

export class HttpBadRequestError extends HttpError {
  constructor(
    message: string = 'Bad Request',
    code: string = 'BAD_REQUEST',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(400, message, code, details);
  }
}

export class HttpUnauthorizedError extends HttpError {
  constructor(
    message: string = 'Unauthorized',
    code: string = 'UNAUTHORIZED',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(401, message, code, details);
  }
}

export class HttpPaymentRequiredError extends HttpError {
  constructor(
    message: string = 'Payment Required',
    code: string = 'PAYMENT_REQUIRED',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(402, message, code, details);
  }
}

export class HttpForbiddenError extends HttpError {
  constructor(
    message: string = 'Forbidden',
    code: string = 'FORBIDDEN',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(403, message, code, details);
  }
}

export class HttpNotFoundError extends HttpError {
  constructor(
    message: string = 'Not Found',
    code: string = 'NOT_FOUND',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(404, message, code, details);
  }
}

export class HttpMethodNotAllowedError extends HttpError {
  constructor(
    message: string = 'Method Not Allowed',
    code: string = 'METHOD_NOT_ALLOWED',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(405, message, code, details);
  }
}

export class HttpNotAcceptableError extends HttpError {
  constructor(
    message: string = 'Not Acceptable',
    code: string = 'NOT_ACCEPTABLE',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(406, message, code, details);
  }
}

export class HttpProxyAuthenticationRequiredError extends HttpError {
  constructor(
    message: string = 'Proxy Authentication Required',
    code: string = 'PROXY_AUTHENTICATION_REQUIRED',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(407, message, code, details);
  }
}

export class HttpRequestTimeoutError extends HttpError {
  constructor(
    message: string = 'Request Timeout',
    code: string = 'REQUEST_TIMEOUT',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(408, message, code, details);
  }
}

export class HttpConflictError extends HttpError {
  constructor(
    message: string = 'Conflict',
    code: string = 'CONFLICT',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(409, message, code, details);
  }
}

export class HttpGoneError extends HttpError {
  constructor(
    message: string = 'Gone',
    code: string = 'GONE',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(410, message, code, details);
  }
}

export class HttpLengthRequiredError extends HttpError {
  constructor(
    message: string = 'Length Required',
    code: string = 'LENGTH_REQUIRED',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(411, message, code, details);
  }
}

export class HttpPreconditionFailedError extends HttpError {
  constructor(
    message: string = 'Precondition Failed',
    code: string = 'PRECONDITION_FAILED',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(412, message, code, details);
  }
}

export class HttpPayloadTooLargeError extends HttpError {
  constructor(
    message: string = 'Payload Too Large',
    code: string = 'PAYLOAD_TOO_LARGE',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(413, message, code, details);
  }
}

export class HttpUriTooLongError extends HttpError {
  constructor(
    message: string = 'URI Too Long',
    code: string = 'URI_TOO_LONG',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(414, message, code, details);
  }
}

export class HttpUnsupportedMediaTypeError extends HttpError {
  constructor(
    message: string = 'Unsupported Media Type',
    code: string = 'UNSUPPORTED_MEDIA_TYPE',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(415, message, code, details);
  }
}

export class HttpRangeNotSatisfiableError extends HttpError {
  constructor(
    message: string = 'Range Not Satisfiable',
    code: string = 'RANGE_NOT_SATISFIABLE',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(416, message, code, details);
  }
}

export class HttpExpectationFailedError extends HttpError {
  constructor(
    message: string = 'Expectation Failed',
    code: string = 'EXPECTATION_FAILED',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(417, message, code, details);
  }
}

export class HttpMisdirectedRequestError extends HttpError {
  constructor(
    message: string = 'Misdirected Request',
    code: string = 'MISDIRECTED_REQUEST',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(421, message, code, details);
  }
}

export class HttpUnprocessableEntityError extends HttpError {
  constructor(
    message: string = 'Unprocessable Entity',
    code: string = 'UNPROCESSABLE_ENTITY',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(422, message, code, details);
  }
}

export class HttpLockedError extends HttpError {
  constructor(
    message: string = 'Locked',
    code: string = 'LOCKED',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(423, message, code, details);
  }
}

export class HttpFailedDependencyError extends HttpError {
  constructor(
    message: string = 'Failed Dependency',
    code: string = 'FAILED_DEPENDENCY',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(424, message, code, details);
  }
}

export class HttpTooEarlyError extends HttpError {
  constructor(
    message: string = 'Too Early',
    code: string = 'TOO_EARLY',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(425, message, code, details);
  }
}

export class HttpUpgradeRequiredError extends HttpError {
  constructor(
    message: string = 'Upgrade Required',
    code: string = 'UPGRADE_REQUIRED',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(426, message, code, details);
  }
}

export class HttpPreconditionRequiredError extends HttpError {
  constructor(
    message: string = 'Precondition Required',
    code: string = 'PRECONDITION_REQUIRED',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(428, message, code, details);
  }
}

export class HttpTooManyRequestsError extends HttpError {
  constructor(
    message: string = 'Too Many Requests',
    code: string = 'TOO_MANY_REQUESTS',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(429, message, code, details);
  }
}

export class HttpRequestHeaderFieldsTooLargeError extends HttpError {
  constructor(
    message: string = 'Request Header Fields Too Large',
    code: string = 'REQUEST_HEADER_FIELDS_TOO_LARGE',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(431, message, code, details);
  }
}

export class HttpUnavailableForLegalReasonsError extends HttpError {
  constructor(
    message: string = 'Unavailable For Legal Reasons',
    code: string = 'UNAVAILABLE_FOR_LEGAL_REASONS',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(451, message, code, details);
  }
}

// 5xx Server Error Status Codes

export class HttpInternalServerError extends HttpError {
  constructor(
    message: string = 'Internal Server Error',
    code: string = 'INTERNAL_SERVER_ERROR',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(500, message, code, details);
  }
}

export class HttpNotImplementedError extends HttpError {
  constructor(
    message: string = 'Not Implemented',
    code: string = 'NOT_IMPLEMENTED',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(501, message, code, details);
  }
}

export class HttpBadGatewayError extends HttpError {
  constructor(
    message: string = 'Bad Gateway',
    code: string = 'BAD_GATEWAY',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(502, message, code, details);
  }
}

export class HttpServiceUnavailableError extends HttpError {
  constructor(
    message: string = 'Service Unavailable',
    code: string = 'SERVICE_UNAVAILABLE',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(503, message, code, details);
  }
}

export class HttpGatewayTimeoutError extends HttpError {
  constructor(
    message: string = 'Gateway Timeout',
    code: string = 'GATEWAY_TIMEOUT',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(504, message, code, details);
  }
}

export class HttpVersionNotSupportedError extends HttpError {
  constructor(
    message: string = 'HTTP Version Not Supported',
    code: string = 'HTTP_VERSION_NOT_SUPPORTED',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(505, message, code, details);
  }
}

export class HttpVariantAlsoNegotiatesError extends HttpError {
  constructor(
    message: string = 'Variant Also Negotiates',
    code: string = 'VARIANT_ALSO_NEGOTIATES',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(506, message, code, details);
  }
}

export class HttpInsufficientStorageError extends HttpError {
  constructor(
    message: string = 'Insufficient Storage',
    code: string = 'INSUFFICIENT_STORAGE',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(507, message, code, details);
  }
}

export class HttpLoopDetectedError extends HttpError {
  constructor(
    message: string = 'Loop Detected',
    code: string = 'LOOP_DETECTED',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(508, message, code, details);
  }
}

export class HttpNotExtendedError extends HttpError {
  constructor(
    message: string = 'Not Extended',
    code: string = 'NOT_EXTENDED',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(510, message, code, details);
  }
}

export class HttpNetworkAuthenticationRequiredError extends HttpError {
  constructor(
    message: string = 'Network Authentication Required',
    code: string = 'NETWORK_AUTHENTICATION_REQUIRED',
    details: string | Record<string, any> | undefined = undefined
  ) {
    super(511, message, code, details);
  }
}
