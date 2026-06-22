class OpenClawError extends Error {
  constructor(message, { code = 'OPENCLAW_ERROR', statusCode = 500, cause } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.cause = cause;
  }
}

class OpenClawHttpError extends OpenClawError {
  constructor(message, { status, body, code = 'OPENCLAW_HTTP_ERROR' } = {}) {
    super(message, { code, statusCode: status || 502 });
    this.status = status;
    this.body = body;
  }
}

class OpenClawTimeoutError extends OpenClawError {
  constructor(message = 'OpenClaw request timed out.') {
    super(message, { code: 'OPENCLAW_TIMEOUT', statusCode: 504 });
  }
}

class OpenClawCircuitOpenError extends OpenClawError {
  constructor(message = 'OpenClaw circuit breaker is open.') {
    super(message, { code: 'OPENCLAW_CIRCUIT_OPEN', statusCode: 503 });
  }
}

class OpenClawPolicyError extends OpenClawError {
  constructor(message, { decision = 'denied' } = {}) {
    super(message, { code: 'OPENCLAW_POLICY_DENIED', statusCode: 403 });
    this.decision = decision;
  }
}

module.exports = {
  OpenClawCircuitOpenError,
  OpenClawError,
  OpenClawHttpError,
  OpenClawPolicyError,
  OpenClawTimeoutError,
};
