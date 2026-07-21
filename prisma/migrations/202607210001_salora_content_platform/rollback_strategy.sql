-- Run only after exporting cms_documents, cms_revisions and cms_approvals.
-- This rollback intentionally destroys CMS history and therefore requires explicit operator approval.
drop table if exists public.cms_approvals;
alter table if exists public.cms_documents drop constraint if exists cms_documents_active_revision_fk;
drop table if exists public.cms_revisions;
drop table if exists public.cms_documents;
drop type if exists public."CmsApprovalStatus";
drop type if exists public."CmsContentStatus";
drop type if exists public."CmsResourceType";
