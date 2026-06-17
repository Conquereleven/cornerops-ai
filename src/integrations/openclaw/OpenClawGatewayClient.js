const logger = require('../../utils/logger');
const { getOpenClawConfig } = require('./OpenClawConfig');
const {
  OpenClawCircuitOpenError,
  OpenClawHttpError,
  OpenClawTimeoutError,
} = require('./errors');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

class OpenClawGatewayClient {
  constructor({
    config = getOpenClawConfig(),
    fetchFn = global.fetch,
    log = logger,
  } = {}) {
    this.config = config;
    this.fetchFn = fetchFn;
    this.log = log;
    this.failures = 0;
    this.openUntil = 0;
  }

  async healthCheck({ requestId } = {}) {
    if (!this.config.enabled) {
      return {
        ok: false,
        status: 'disabled',
        enabled: false,
        dryRun: this.config.dryRun,
      };
    }
    const startedAt = Date.now();
    const models = await this.request('/v1/models', {
      method: 'GET',
      requestId,
      idempotent: true,
    });
    return {
      ok: true,
      status: 'ok',
      enabled: true,
      dryRun: this.config.dryRun,
      latencyMs: Date.now() - startedAt,
      modelCount: Array.isArray(models.data) ? models.data.length : undefined,
    };
  }

  listModels({ requestId } = {}) {
    return this.request('/v1/models', {
      method: 'GET',
      requestId,
      idempotent: true,
    });
  }

  chatCompletion(input) {
    return this.request('/v1/chat/completions', {
      method: 'POST',
      body: input,
      requestId: input?.metadata?.requestId,
      idempotent: false,
    });
  }

  createResponse(input) {
    return this.request('/v1/responses', {
      method: 'POST',
      body: input,
      requestId: input?.metadata?.requestId,
      idempotent: false,
    });
  }

  invokeTool(input) {
    return this.request('/tools/invoke', {
      method: 'POST',
      body: input,
      requestId: input?.requestId,
      idempotent: false,
    });
  }

  async request(path, {
    method = 'GET',
    body,
    requestId,
    idempotent = false,
  } = {}) {
    this.assertCircuitClosed();
    const attempts = idempotent ? this.config.maxRetries + 1 : 1;
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const response = await this.fetchWithTimeout(path, {
          method,
          body,
          requestId,
        });
        this.recordSuccess();
        return response;
      } catch (error) {
        lastError = error;
        this.recordFailure(error);
        if (attempt >= attempts) break;
        await sleep(Math.min(250 * attempt, 1000));
      }
    }
    throw lastError;
  }

  async fetchWithTimeout(path, { method, body, requestId }) {
    if (!this.fetchFn) {
      throw new OpenClawHttpError('fetch is not available in this runtime.', {
        status: 500,
        code: 'OPENCLAW_FETCH_UNAVAILABLE',
      });
    }
    const controller = new AbortController();
    let timeout;
    const timeoutPromise = new Promise((_, reject) => {
      timeout = setTimeout(() => {
        controller.abort();
        reject(new OpenClawTimeoutError());
      }, this.config.timeoutMs);
    });
    try {
      const response = await Promise.race([
        this.fetchFn(`${this.config.baseUrl}${path}`, {
          method,
          headers: this.headers(requestId),
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: controller.signal,
        }),
        timeoutPromise,
      ]);
      const text = await response.text();
      const parsed = text ? this.parseJson(text) : {};
      if (!response.ok) {
        throw new OpenClawHttpError(
          `OpenClaw request failed with HTTP ${response.status}.`,
          {
            status: response.status,
            body: parsed,
            code: response.status === 401 || response.status === 403
              ? 'OPENCLAW_AUTH_ERROR'
              : 'OPENCLAW_HTTP_ERROR',
          },
        );
      }
      return parsed;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new OpenClawTimeoutError();
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  parseJson(text) {
    try {
      return JSON.parse(text);
    } catch (error) {
      return { raw: text };
    }
  }

  headers(requestId) {
    const headers = {
      'content-type': 'application/json',
      'x-request-id': requestId || '',
      'x-cornerops-source': 'cornerops-ai',
    };
    if (this.config.token) {
      headers.authorization = `Bearer ${this.config.token}`;
    }
    if (this.config.password) {
      headers['x-openclaw-password'] = this.config.password;
    }
    return headers;
  }

  assertCircuitClosed() {
    if (Date.now() < this.openUntil) throw new OpenClawCircuitOpenError();
  }

  recordSuccess() {
    this.failures = 0;
    this.openUntil = 0;
  }

  recordFailure(error) {
    this.failures += 1;
    if (this.failures >= this.config.circuitBreakerFailures) {
      this.openUntil = Date.now() + this.config.circuitBreakerCooldownMs;
      this.log.warn('openclaw_circuit_opened', {
        code: error.code,
        status: error.status,
      });
    }
  }
}

module.exports = {
  OpenClawGatewayClient,
};
