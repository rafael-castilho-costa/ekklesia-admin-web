export function resolveApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (typeof error === 'object' && error !== null) {
    const httpError = error as {
      status?: number;
      error?: { message?: string };
    };

    if (httpError.error?.message) {
      return httpError.error.message;
    }

    if (httpError.status === 401) {
      return 'JWT is invalid or expired.';
    }
  }

  return fallbackMessage;
}
