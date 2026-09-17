-- P78 Gate C hardening: immutable ledger function + reward redemption FK indexes.
create or replace function public.salora_loyalty_ledger_immutable()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  raise exception 'loyalty_ledger_entries are append-only; use a reversal entry';
end;
$function$;

create index if not exists reward_redemptions_account_id_idx
  on public.reward_redemptions using btree (account_id);

create index if not exists reward_redemptions_reward_id_idx
  on public.reward_redemptions using btree (reward_id);
