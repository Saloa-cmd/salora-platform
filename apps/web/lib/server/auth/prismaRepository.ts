import { SYSTEM_AUTH_CONTEXT, withPrismaAuthContext, withPrismaAuthContextTx } from "@salora/backend";
import type { AuthRepository, CreateSessionInput, CreateUserInput } from "./repository";
import type { AuthSession, AuthUser, RoleName } from "./types";

type PrismaRole = { role: { name: RoleName } };
type PrismaUserRecord = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  isActive: boolean;
  roles: PrismaRole[];
};
type PrismaSessionRecord = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  status: "ACTIVE" | "REVOKED" | "EXPIRED";
  expiresAt: Date;
};

type PrismaAuthClient = {
  user: {
    findUnique(args: unknown): Promise<unknown | null>;
    create(args: unknown): Promise<unknown>;
  };
  customerProfile: { create(args: unknown): Promise<unknown>; };
  loyaltyAccount: { create(args: unknown): Promise<unknown>; };
  $executeRawUnsafe(query:string,...values:unknown[]): Promise<number>;
  role: {
    findMany(args: unknown): Promise<Array<{ id: string; name: RoleName }>>;
  };
  session: {
    create(args: unknown): Promise<unknown>;
    findUnique(args: unknown): Promise<unknown | null>;
    update(args: unknown): Promise<unknown>;
  };
};

function mapUser(user: PrismaUserRecord): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    passwordHash: user.passwordHash,
    isActive: user.isActive,
    roles: user.roles.map((entry) => entry.role.name)
  };
}

function mapSession(session: PrismaSessionRecord): AuthSession {
  return {
    id: session.id,
    userId: session.userId,
    refreshTokenHash: session.refreshTokenHash,
    status: session.status,
    expiresAt: session.expiresAt
  };
}

export class PrismaAuthRepository implements AuthRepository {
  private run<T>(operation: (prisma: PrismaAuthClient) => Promise<T>): Promise<T> {
    return withPrismaAuthContext(SYSTEM_AUTH_CONTEXT, (prisma) => operation(prisma as unknown as PrismaAuthClient));
  }

  async findUserByEmail(email: string): Promise<AuthUser | null> {
    const user = await this.run((prisma) => prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { roles: { include: { role: true } } }
    }));
    return user ? mapUser(user as PrismaUserRecord) : null;
  }

  async findUserById(userId: string): Promise<AuthUser | null> {
    const user = await this.run((prisma) => prisma.user.findUnique({
      where: { id: userId },
      include: { roles: { include: { role: true } } }
    }));
    return user ? mapUser(user as PrismaUserRecord) : null;
  }

  async createUser(input: CreateUserInput): Promise<AuthUser> {
    const user = await withPrismaAuthContextTx(SYSTEM_AUTH_CONTEXT, async (prisma) => {
      const roles = await prisma.role.findMany({ where: { name: { in: input.roles } } });
      const created = await prisma.user.create({
        data: {
          email: input.email.toLowerCase(),
          name: input.name,
          passwordHash: input.passwordHash,
          roles: { create: roles.map((role) => ({ roleId: role.id })) }
        },
        include: { roles: { include: { role: true } } }
      }) as PrismaUserRecord;
      if (input.roles.includes("CUSTOMER")) {
        const profile = await prisma.customerProfile.create({ data: { userId: created.id, displayName: input.name } }) as {id:string};
        await prisma.loyaltyAccount.create({ data: { customerId: profile.id, points: 0, tier: "CLASSIC" } });
        if (!input.harmonyConsent) throw new Error("Harmony consent is required for customer provisioning.");
        await prisma.$executeRawUnsafe(
          `INSERT INTO harmony_consents (id,user_id,customer_id,consent_type,source,locale,policy_code,terms_version,privacy_version,loyalty_policy_version,consented_at)
           VALUES (gen_random_uuid(),$1::uuid,$2::uuid,'HARMONY_MEMBERSHIP','WEB_REWARDS_JOIN',$3,$4,$5,$6,$7,now())`,
          created.id,profile.id,input.harmonyConsent.locale,input.harmonyConsent.policyCode,input.harmonyConsent.termsVersion,input.harmonyConsent.privacyVersion,input.harmonyConsent.loyaltyPolicyVersion
        );
      }
      return created;
    });
    return mapUser(user as PrismaUserRecord);
  }

  async createSession(input: CreateSessionInput): Promise<AuthSession> {
    const session = await this.run((prisma) => prisma.session.create({
      data: input
    }));
    return mapSession(session as PrismaSessionRecord);
  }

  async findSessionByRefreshTokenHash(refreshTokenHash: string): Promise<AuthSession | null> {
    const session = await this.run((prisma) => prisma.session.findUnique({ where: { refreshTokenHash } }));
    return session ? mapSession(session as PrismaSessionRecord) : null;
  }

  async revokeSession(sessionId: string): Promise<void> {
    await this.run((prisma) => prisma.session.update({
      where: { id: sessionId },
      data: { status: "REVOKED", revokedAt: new Date() }
    }));
  }
}
