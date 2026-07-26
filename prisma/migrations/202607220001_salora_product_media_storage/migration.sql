-- Public delivery, private mutation. Uploads are performed only by the server with a secret key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('salora-product-media', 'salora-product-media', true, 8388608, array['image/webp', 'image/png', 'image/avif'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- No anonymous/authenticated INSERT, UPDATE, or DELETE policy is created intentionally.
-- Product media mutations must pass through the Control Tower server and its RBAC/audit layer.
