export const roleNames = ["CUSTOMER", "STAFF", "MANAGER", "ADMIN"] as const;

export type RoleName = (typeof roleNames)[number];

export type SessionStatus = "ACTIVE" | "REVOKED" | "EXPIRED";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  isActive: boolean;
  roles: RoleName[];
};

export type AuthSession = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  status: SessionStatus;
  expiresAt: Date;
};

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  roles: RoleName[];
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
};

export type AuthResult = {
  user: PublicUser;
  tokens: TokenPair;
};
