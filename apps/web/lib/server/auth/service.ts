import { createRefreshToken, hashPassword, hashToken, signJwt, verifyJwt, verifyPassword } from "./crypto";
import type { AuthRepository } from "./repository";
import type { AuthEnv } from "./env";
import { publicRegistrationRoles } from "./registration";
import type { AuthResult, PublicUser, RoleName } from "./types";
import { InvalidCredentialsError } from "./errors";

function publicUser(user: { id: string; email: string; name: string; roles: RoleName[] }): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles
  };
}

function refreshExpiresAt(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export class AuthService {
  private readonly repository: AuthRepository;
  private readonly env: AuthEnv;

  constructor(repository: AuthRepository, env: AuthEnv) {
    this.repository = repository;
    this.env = env;
  }

  async register(input: { email: string; name: string; password: string; roles?: RoleName[] }, meta: { ipAddress?: string; userAgent?: string } = {}): Promise<AuthResult> {
    const existing = await this.repository.findUserByEmail(input.email);

    if (existing) {
      throw new Error("A SALORA user already exists for this email.");
    }

    const user = await this.repository.createUser({
      email: input.email,
      name: input.name,
      passwordHash: await hashPassword(input.password),
      roles: publicRegistrationRoles()
    });

    return this.issueTokens(user, meta);
  }

  async login(input: { email: string; password: string }, meta: { ipAddress?: string; userAgent?: string } = {}): Promise<AuthResult> {
    const user = await this.repository.findUserByEmail(input.email);

    if (!user || !user.isActive || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new InvalidCredentialsError();
    }

    return this.issueTokens(user, meta);
  }

  async refresh(refreshToken: string, meta: { ipAddress?: string; userAgent?: string } = {}): Promise<AuthResult> {
    const payload = verifyJwt(refreshToken, this.env.JWT_REFRESH_SECRET);

    if (payload.type !== "refresh" || !payload.sessionId) {
      throw new Error("Invalid refresh token.");
    }

    const session = await this.repository.findSessionByRefreshTokenHash(hashToken(refreshToken));

    if (!session || session.status !== "ACTIVE" || session.expiresAt <= new Date()) {
      throw new Error("Refresh session is not active.");
    }

    await this.repository.revokeSession(session.id);
    const user = await this.repository.findUserById(payload.sub);

    if (!user || !user.isActive) {
      throw new Error("Refresh user is not active.");
    }

    return this.issueTokens(user, meta);
  }

  async logout(refreshToken: string): Promise<void> {
    const session = await this.repository.findSessionByRefreshTokenHash(hashToken(refreshToken));

    if (session) {
      await this.repository.revokeSession(session.id);
    }
  }

  verifyAccessToken(accessToken: string) {
    const payload = verifyJwt(accessToken, this.env.JWT_SECRET);

    if (payload.type !== "access") {
      throw new Error("Invalid access token.");
    }

    return payload;
  }

  private async issueTokens(user: { id: string; email: string; name: string; roles: RoleName[] }, meta: { ipAddress?: string; userAgent?: string }): Promise<AuthResult> {
    const refreshToken = createRefreshToken();
    const accessTokenExpiresAt = new Date(Date.now() + this.env.AUTH_ACCESS_TTL_SECONDS * 1000);
    const refreshTokenExpiresAt = refreshExpiresAt(this.env.AUTH_REFRESH_TTL_DAYS);
    const session = await this.repository.createSession({
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt: refreshTokenExpiresAt,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    return {
      user: publicUser(user),
      tokens: {
        accessToken: signJwt(
          { sub: user.id, email: user.email, roles: user.roles, sessionId: session.id, type: "access" },
          this.env.JWT_SECRET,
          this.env.AUTH_ACCESS_TTL_SECONDS
        ),
        refreshToken: signJwt(
          { sub: user.id, email: user.email, roles: user.roles, sessionId: session.id, type: "refresh" },
          this.env.JWT_REFRESH_SECRET,
          this.env.AUTH_REFRESH_TTL_DAYS * 24 * 60 * 60
        ),
        accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
        refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString()
      }
    };
  }
}
