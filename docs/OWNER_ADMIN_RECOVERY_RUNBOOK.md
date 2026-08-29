# SALORA Owner Admin Recovery

This procedure restores the first owner administrator when the certified Production database contains no Admin account. It is not a general password-reset endpoint.

## Security contract

- Production-only and disabled by default.
- Requires `SALORA_OWNER_RECOVERY_ENABLED=true` and a random `SALORA_OWNER_RECOVERY_TOKEN` of at least 32 characters in Vercel Production only.
- The token and new password are entered only in the SALORA recovery form over HTTPS; neither value belongs in GitHub, chat, logs, screenshots, or Audit metadata.
- The configured owner email defaults to `admin@salora.cafe` and can be overridden only with `SALORA_OWNER_RECOVERY_EMAIL`.
- Distributed auth rate limiting fails closed.
- A PostgreSQL advisory lock prevents concurrent claims.
- Recovery fails if an Admin already exists, the recovery-completed marker exists, or the owner email is already claimed.
- Passwords are stored only as Argon2 hashes.
- Admin creation, role assignment, completion marker, Activity Log, and Audit Log are one transaction.
- Recovery does not issue login cookies or tokens. The owner must sign in normally afterward.

## Controlled sequence

1. Verify read-only that Production has zero Admin users.
2. Merge the reviewed recovery application PR after CI and Preview approval.
3. Generate a new random recovery token outside chat.
4. Set the three recovery variables in Vercel **Production only** and redeploy:
   - `SALORA_OWNER_RECOVERY_ENABLED=true`
   - `SALORA_OWNER_RECOVERY_TOKEN` set to a newly generated secret random token
   - `SALORA_OWNER_RECOVERY_EMAIL=admin@salora.cafe`
5. Open `/recover-owner-access` and enter the token and a new strong password through the secure browser form.
6. Verify the Admin, Argon2 hash presence, ADMIN role, completion marker, Activity Log, Audit Log, and zero automatically created sessions.
7. Set `SALORA_OWNER_RECOVERY_ENABLED=false`, remove the recovery token from Vercel, and redeploy.
8. Sign in normally and verify Control Tower access.

## Rollback and incident handling

Before the recovery form succeeds, application rollback is sufficient because no database row is created. After successful recovery, do not delete Audit or Activity records. If the recovery identity is disputed, disable the user, revoke all sessions, rotate the password through a separately authorized process, and preserve evidence.

No Prisma migration, RLS policy, index, or schema change is required.
