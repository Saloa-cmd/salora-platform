create type public."CmsResourceType" as enum ('PAGE', 'SECTION', 'NAVIGATION', 'BANNER', 'CAMPAIGN', 'LANDING_PAGE');
create type public."CmsContentStatus" as enum ('DRAFT', 'IN_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');
create type public."CmsApprovalStatus" as enum ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

create table public.cms_documents (
  id uuid primary key default gen_random_uuid(),
  brand_key varchar(40) not null default 'SALORA',
  resource_type public."CmsResourceType" not null,
  key varchar(140) not null,
  slug varchar(180),
  title_ar varchar(200) not null,
  title_en varchar(200) not null,
  status public."CmsContentStatus" not null default 'DRAFT',
  active_revision_id uuid,
  scheduled_at timestamptz(6),
  published_at timestamptz(6),
  archived_at timestamptz(6),
  created_by uuid not null,
  updated_by uuid not null,
  created_at timestamptz(6) not null default now(),
  updated_at timestamptz(6) not null default now(),
  constraint cms_documents_salora_brand check (brand_key = 'SALORA'),
  constraint cms_documents_schedule_valid check (status <> 'SCHEDULED' or scheduled_at is not null),
  constraint cms_documents_brand_resource_key_unique unique (brand_key, resource_type, key)
);

create table public.cms_revisions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.cms_documents(id) on delete restrict,
  version integer not null check (version > 0),
  payload jsonb not null,
  change_summary varchar(500),
  created_by uuid not null,
  created_at timestamptz(6) not null default now(),
  constraint cms_revisions_document_version_unique unique (document_id, version)
);

create table public.cms_approvals (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.cms_documents(id) on delete restrict,
  revision_id uuid not null references public.cms_revisions(id) on delete restrict,
  status public."CmsApprovalStatus" not null default 'PENDING',
  requested_by uuid not null,
  decided_by uuid,
  decision_note varchar(1000),
  requested_at timestamptz(6) not null default now(),
  decided_at timestamptz(6),
  constraint cms_approvals_decision_valid check (
    (status = 'PENDING' and decided_by is null and decided_at is null)
    or (status <> 'PENDING' and decided_by is not null and decided_at is not null)
  )
);

alter table public.cms_documents
  add constraint cms_documents_active_revision_fk
  foreign key (active_revision_id) references public.cms_revisions(id) on delete restrict;

create index cms_documents_brand_status_type_idx on public.cms_documents (brand_key, status, resource_type);
create index cms_documents_due_schedule_idx on public.cms_documents (scheduled_at) where status = 'SCHEDULED';
create index cms_revisions_document_created_idx on public.cms_revisions (document_id, created_at desc);
create index cms_approvals_pending_idx on public.cms_approvals (document_id, requested_at desc) where status = 'PENDING';
create index cms_approvals_revision_idx on public.cms_approvals (revision_id);

alter table public.cms_documents enable row level security;
alter table public.cms_documents force row level security;
alter table public.cms_revisions enable row level security;
alter table public.cms_revisions force row level security;
alter table public.cms_approvals enable row level security;
alter table public.cms_approvals force row level security;

-- Public clients can discover only the authoritative SALORA documents that are published.
create policy cms_documents_public_published_read
on public.cms_documents for select
to anon, authenticated
using (brand_key = 'SALORA' and status = 'PUBLISHED');

revoke all on public.cms_documents from anon, authenticated;
revoke all on public.cms_revisions from anon, authenticated;
revoke all on public.cms_approvals from anon, authenticated;
grant select on public.cms_documents to anon, authenticated;

comment on table public.cms_revisions is 'Immutable SALORA CMS revision history. Draft payloads are server-only.';
comment on table public.cms_approvals is 'Server-governed approval decisions; never exposed through the public Data API.';
