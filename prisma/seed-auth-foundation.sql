INSERT INTO "roles" ("name", "description") VALUES
  ('CUSTOMER', 'Default customer role for SALORA ordering experiences.'),
  ('STAFF', 'Cafe staff role for operational workflows.'),
  ('MANAGER', 'Manager role for catalog, staff, and operational oversight.'),
  ('ADMIN', 'Administrative role for platform governance.')
ON CONFLICT ("name") DO NOTHING;
