import type { AuthRepository, CreateSessionInput, CreateUserInput } from "./repository";
import type { AuthSession, AuthUser } from "./types";

export class MemoryAuthRepository implements AuthRepository {
  private readonly users = new Map<string, AuthUser>();
  private readonly sessions = new Map<string, AuthSession>();

  async findUserByEmail(email: string): Promise<AuthUser | null> {
    return [...this.users.values()].find((user) => user.email === email.toLowerCase()) ?? null;
  }

  async findUserById(userId: string): Promise<AuthUser | null> {
    return this.users.get(userId) ?? null;
  }

  async createUser(input: CreateUserInput): Promise<AuthUser> {
    const user: AuthUser = {
      id: crypto.randomUUID(),
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash: input.passwordHash,
      isActive: true,
      roles: input.roles
    };
    this.users.set(user.id, user);
    return user;
  }

  async createSession(input: CreateSessionInput): Promise<AuthSession> {
    const session: AuthSession = {
      id: crypto.randomUUID(),
      userId: input.userId,
      refreshTokenHash: input.refreshTokenHash,
      status: "ACTIVE",
      expiresAt: input.expiresAt
    };
    this.sessions.set(session.id, session);
    return session;
  }

  async findSessionByRefreshTokenHash(refreshTokenHash: string): Promise<AuthSession | null> {
    return [...this.sessions.values()].find((session) => session.refreshTokenHash === refreshTokenHash) ?? null;
  }

  async revokeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);

    if (session) {
      this.sessions.set(sessionId, { ...session, status: "REVOKED" });
    }
  }
}
