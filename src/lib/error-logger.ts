export interface ErrorContext {
  source?: string
  [key: string]: unknown
}

/**
 * Logs an error with optional context.
 * In development, logs structured details to the console.
 * Replace or extend this function to send errors to a reporting service.
 */
export function logError(error: unknown, context?: ErrorContext): void {
  const message = error instanceof Error ? error.message : String(error)
  const stack = error instanceof Error ? error.stack : undefined

  if (import.meta.env.DEV) {
    console.error('[ErrorLogger]', { message, stack, context })
  } else {
    // Production: log minimally to avoid leaking internals
    console.error('[ErrorLogger]', message, context?.source ?? '')
  }
}
