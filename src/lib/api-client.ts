/**
 * Client-side API helper for extraction requests.
 *
 * - ApiError carries the HTTP status so retry decisions use status codes,
 *   not message-text matching.
 * - Error payloads are coerced to strings: platform-level errors (e.g. the
 *   Vercel proxy) return `{"error":{"code":...,"message":...}}`, which would
 *   otherwise render as "[object Object]".
 * - A shared token bucket paces all terminology calls. The browser is the
 *   only place a limiter is actually global — serverless instances each get
 *   their own module state.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public platformError?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class CancelledError extends Error {
  constructor() {
    super('Cancelled');
    this.name = 'CancelledError';
  }
}

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);

export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) return RETRYABLE_STATUSES.has(error.status);
  // fetch() rejects with TypeError on network failures
  return error instanceof TypeError;
}

/** Coerce an unknown error payload (string | object | undefined) to a readable string */
export function coerceErrorMessage(error: unknown, status?: number): string {
  if (typeof error === 'string' && error.trim()) return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    const e = error as Record<string, unknown>;
    if (typeof e.message === 'string' && e.message) return e.message;
    if (typeof e.code === 'string' && e.code) return e.code;
    try {
      return JSON.stringify(error);
    } catch {
      // fall through
    }
  }
  return status ? `API error (${status})` : 'An unknown error occurred';
}

// === Rate limiter: token bucket + concurrency cap, shared per browser tab ===

const RATE_LIMIT_PER_SECOND = 4;
const MAX_CONCURRENT = 4;
const TOKEN_INTERVAL_MS = 1000 / RATE_LIMIT_PER_SECOND;

let tokens = RATE_LIMIT_PER_SECOND;
let lastRefill = Date.now();
let active = 0;
const waiters: Array<() => void> = [];

function refill(): void {
  const now = Date.now();
  const toAdd = Math.floor((now - lastRefill) / TOKEN_INTERVAL_MS);
  if (toAdd > 0) {
    tokens = Math.min(RATE_LIMIT_PER_SECOND, tokens + toAdd);
    lastRefill = now;
  }
}

function pump(): void {
  refill();
  while (waiters.length > 0 && tokens > 0 && active < MAX_CONCURRENT) {
    tokens--;
    active++;
    waiters.shift()!();
  }
  if (waiters.length > 0) {
    setTimeout(pump, TOKEN_INTERVAL_MS);
  }
}

async function acquire(): Promise<void> {
  refill();
  if (tokens > 0 && active < MAX_CONCURRENT) {
    tokens--;
    active++;
    return;
  }
  return new Promise<void>((resolve) => {
    waiters.push(resolve);
    if (waiters.length === 1) setTimeout(pump, TOKEN_INTERVAL_MS);
  });
}

function release(): void {
  active--;
  pump();
}

export interface FetchApiOptions {
  maxRetries?: number;
  /** Checked before each attempt; throws CancelledError when true */
  isCancelled?: () => boolean;
}

/**
 * POST JSON to an API route with rate limiting and status-based retry.
 * Resolves with the parsed body when `success` is true; throws ApiError otherwise.
 */
export async function fetchApi<T = any>(
  url: string,
  body: unknown,
  options: FetchApiOptions = {},
): Promise<T> {
  const { maxRetries = 3, isCancelled } = options;
  let lastError: Error = new Error('Max retries exceeded');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (isCancelled?.()) throw new CancelledError();

    await acquire();
    try {
      const error = await (async (): Promise<ApiError | { data: T }> => {
        let response: Response;
        try {
          response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
        } catch (networkError) {
          if (networkError instanceof TypeError) {
            return new ApiError('Network error: unable to reach the server. Check your connection.', 0);
          }
          throw networkError;
        }

        const text = await response.text();
        const platformError = response.headers.get('x-vercel-error') || undefined;
        const looksLikeJson = text.trim().startsWith('{') || text.trim().startsWith('[');

        if (!looksLikeJson) {
          return new ApiError(
            platformError
              ? `Platform error ${platformError} (${response.status})`
              : `Unexpected non-JSON response (${response.status} ${response.statusText})`,
            response.status,
            platformError,
          );
        }

        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          return new ApiError(`Failed to parse server response (${response.status})`, response.status, platformError);
        }

        if (!response.ok || !data.success) {
          return new ApiError(coerceErrorMessage(data.error, response.status), response.status, platformError);
        }

        return { data: data as T };
      })();

      if (!(error instanceof ApiError)) {
        return error.data;
      }

      lastError = error;
      if (!RETRYABLE_STATUSES.has(error.status) && error.status !== 0) {
        throw error;
      }
    } finally {
      release();
    }

    if (attempt < maxRetries) {
      const delay = Math.min(2000 * Math.pow(2, attempt) + Math.random() * 1000, 30000);
      console.log(`Retry ${attempt + 1}/${maxRetries} for ${url} after ${Math.round(delay)}ms: ${lastError.message.substring(0, 120)}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
