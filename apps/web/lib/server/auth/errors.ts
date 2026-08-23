export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid SALORA credentials.");
    this.name = "InvalidCredentialsError";
  }
}

export function loginFailureStatus(error: unknown): 401 | 503 {
  return error instanceof InvalidCredentialsError ? 401 : 503;
}
