-- P78 Gate C: one governed reversal per original ledger entry.
create unique index if not exists loyalty_ledger_entries_reverses_entry_key
  on public.loyalty_ledger_entries ((jsonb_extract_path_text(metadata, 'reversesEntryId')))
  where type = 'REVERSAL'
    and jsonb_extract_path_text(metadata, 'reversesEntryId') is not null;
