import type { AuthSession, AuthUser, RoleName } from "./types";

export type CreateUserInput = {
  email: string;
  name: string;
  passwordHash: string;
  roles: RoleName[];
};

export type CreateSessionInput = {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
};

export interface AuthRepository {
  findUserByEmail(email: string): Promise<AuthUser | null>;
  findUserById(userId: string): Promise<AuthUser | null>;
  createUser(input: CreateUserInput): Promise<AuthUser>;
  createSession(input: CreateSessionInput): Promise<AuthSession>;
  findSessionByRefreshTokenHash(refreshTokenHash: string): Promise<AuthSession | null>;
  revokeSession(sessionId: string): Promise<void>;
}

export class AuthRepositoryUnavailableError extends Error {
  constructor(message = "SALORA auth repository is unavailable until PostgreSQL is configured.") {
    super(message);
    this.name = "AuthRepositoryUnavailableError";
  }
}
