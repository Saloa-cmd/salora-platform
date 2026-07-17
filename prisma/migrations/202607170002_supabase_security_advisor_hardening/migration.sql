-- Resolve Supabase Security Advisor findings without changing application authorization semantics.

begin;

-- Prisma owns and accesses this table through the direct database connection.
-- Data API roles must not read or mutate migration history.
alter table public._prisma_migrations enable row level security;
revoke all on table public._prisma_migrations from public, anon, authenticated;

-- Pin function name resolution to trusted schemas. All application/auth references
-- inside these functions are already schema-qualified.
alter function public.salora_jwt_roles() set search_path = pg_catalog, public;
alter function public.salora_has_role(text[]) set search_path = pg_catalog, public;
alter function public.salora_is_staff() set search_path = pg_catalog, public;
alter function public.salora_is_manager() set search_path = pg_catalog, public;
alter function public.salora_is_admin() set search_path = pg_catalog, public;

commit;
