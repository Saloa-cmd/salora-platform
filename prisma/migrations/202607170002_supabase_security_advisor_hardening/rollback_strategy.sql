-- Use only if the hardening migration must be reversed.
begin;

alter function public.salora_jwt_roles() reset search_path;
alter function public.salora_has_role(text[]) reset search_path;
alter function public.salora_is_staff() reset search_path;
alter function public.salora_is_manager() reset search_path;
alter function public.salora_is_admin() reset search_path;

alter table public._prisma_migrations disable row level security;

-- Deliberately do not restore broad PUBLIC/anon/authenticated grants. If a
-- documented pre-migration grant snapshot exists, restore only that snapshot.

commit;
