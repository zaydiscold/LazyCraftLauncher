/**
 * Retry Utility
 * Provides retry logic with exponential backoff for network operations
 */

import { logger } from './log.js';

export interface RetryOptions {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Initial delay in milliseconds */
  initialDelay: number;
  /** Maximum delay in milliseconds */
  maxDelay: number;
  /** Multiplier for exponential backoff */
  backoffMultiplier: number;
  /** Operation name for logging */
  operationName?: string;
  /** Function to determine if error is retryable */
  isRetryable?: (error: Error) => boolean;
}

export const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * Retry an async operation with exponential backoff
 *
 * @example
 * const result = await retryWithBackoff(
 *   async () => await fetchData(),
 *   { maxRetries: 3, operationName: 'Fetch Data' }
 * );
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts: RetryOptions = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;
  let delay = opts.initialDelay;

  for (let attempt = 1; attempt <= opts.maxRetries; attempt++) {
    try {
      const result = await operation();
      if (attempt > 1 && opts.operationName) {
        logger.info(`${opts.operationName} succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      if (opts.isRetryable && !opts.isRetryable(lastError)) {
        logger.warn(
          `${opts.operationName || 'Operation'} failed with non-retryable error:`,
          lastError.message
        );
        throw lastError;
      }

      // Don't retry after the last attempt
      if (attempt === opts.maxRetries) {
        break;
      }

      const operationName = opts.operationName || 'Operation';
      logger.warn(
        `${operationName} failed (attempt ${attempt}/${opts.maxRetries}): ${lastError.message}. Retrying in ${delay}ms...`
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));

      // Exponential backoff
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelay);
    }
  }

  const operationName = opts.operationName || 'Operation';
  logger.error(
    `${operationName} failed after ${opts.maxRetries} attempts:`,
    lastError!.message
  );
  throw lastError!;
}

/**
 * Network error checker for retry logic
 * Returns true if the error is a transient network error that should be retried
 */
export function isNetworkError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const networkErrorPatterns = [
    'econnrefused',
    'econnreset',
    'etimedout',
    'enotfound',
    'enetunreach',
    'ehostunreach',
    'socket hang up',
    'network timeout',
    'request timeout',
  ];

  return networkErrorPatterns.some(pattern => message.includes(pattern));
}

/**
 * Create a promise with a timeout
 * Rejects if the promise doesn't resolve within the specified timeout
 *
 * @example
 * const result = await withTimeout(
 *   fetchData(),
 *   5000,
 *   'Data fetch timed out'
 * );
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    }),
  ]);
}

/**
 * Retry specifically for HTTP operations
 */
export async function retryHttpOperation<T>(
  operation: () => Promise<T>,
  operationName: string,
  maxRetries: number = 3
): Promise<T> {
  return retryWithBackoff(operation, {
    maxRetries,
    initialDelay: 2000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    operationName,
    isRetryable: isNetworkError,
  });
}
