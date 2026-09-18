ALTER TABLE loyalty_accounts
  ADD COLUMN IF NOT EXISTS membership_code varchar(20);
UPDATE loyalty_accounts
SET membership_code='HMY-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12))
WHERE membership_code IS NULL;
ALTER TABLE loyalty_accounts ALTER COLUMN membership_code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS loyalty_accounts_membership_code_key ON loyalty_accounts(membership_code);
ALTER TABLE loyalty_accounts ALTER COLUMN membership_code SET DEFAULT ('HMY-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,12)));

CREATE TABLE IF NOT EXISTS harmony_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,
  consent_type varchar(80) NOT NULL,
  source varchar(80) NOT NULL,
  locale varchar(10) NOT NULL,
  policy_code varchar(80) NOT NULL,
  terms_version varchar(40) NOT NULL,
  privacy_version varchar(40) NOT NULL,
  loyalty_policy_version varchar(40) NOT NULL,
  consented_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS harmony_consents_business_key
  ON harmony_consents(user_id,consent_type,policy_code,terms_version,privacy_version,loyalty_policy_version);
CREATE INDEX IF NOT EXISTS harmony_consents_customer_created_idx ON harmony_consents(customer_id,consented_at DESC);
ALTER TABLE harmony_consents ENABLE ROW LEVEL SECURITY;
CREATE POLICY harmony_consents_customer_read ON harmony_consents FOR SELECT TO authenticated
  USING (user_id = (select auth.uid()));
