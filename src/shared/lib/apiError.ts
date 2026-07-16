export function logError(context: string, error: unknown): void {
  console.error(`[${context}] Error:`, {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
  });
}

export function getSafeErrorMessage(error: unknown, fallback: string = 'An error occurred'): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  const message = error.message.toLowerCase();

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

  return fallback;
}

export function createErrorResponse(
  error: unknown,
  genericMessage: string,
  status: number,
  context?: string
): Response {
  if (context) {
    logError(context, error);
  }

  const safeMessage = getSafeErrorMessage(error, genericMessage);
  
  return Response.json(
    { error: safeMessage },
    { status }
  );
}
