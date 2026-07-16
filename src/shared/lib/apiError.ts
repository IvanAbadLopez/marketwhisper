/**
 * Standardized API error handling
 * Logs detailed error server-side, returns generic message to client
 */

/**
 * Log error details server-side (only for debugging, never send to client)
 */
export function logError(context: string, error: unknown): void {
  console.error(`[${context}] Error:`, {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get safe error message for client response
 * Prevents leaking internal details (paths, stack traces, DB errors, etc.)
 */
export function getSafeErrorMessage(error: unknown, fallback: string = 'An error occurred'): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.toLowerCase();

  // Allow specific known error patterns (safe to expose)
  const safePatterns = [
    'rate limit',
    'too many',
    'invalid email',
    'password must be',
    'unauthorized',
    'forbidden',
    'not found',
    'already exists',
    'finnhub',
    'api key',
    'timed out',
    'exceeds maximum',
  ];

  if (safePatterns.some(pattern => message.includes(pattern))) {
    return error.message;
  }

  // Unsafe error - return generic message
  return fallback;
}

/**
 * Create standardized error response
 * Usage: return createErrorResponse(error, 'Failed to create resource', 500);
 */
export function createErrorResponse(
  error: unknown,
  genericMessage: string,
  status: number,
  context?: string
): Response {
  // Log detailed error server-side
  if (context) {
    logError(context, error);
  }

  // Return safe message to client
  const safeMessage = getSafeErrorMessage(error, genericMessage);
  
  return Response.json(
    { error: safeMessage },
    { status }
  );
}
