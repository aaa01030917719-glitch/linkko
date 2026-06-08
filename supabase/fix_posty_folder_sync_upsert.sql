-- ============================================================
-- Fix Linkko -> Posty folder sync upsert target
-- ============================================================
--
-- Do not run automatically. Review in Supabase SQL Editor first.
--
-- Why this patch exists:
-- - The original draft created posty_folder_syncs_user_folder_uidx as a
--   partial unique index:
--     unique (user_id, folder_id) where folder_id is not null
-- - PostgreSQL cannot infer that partial index for plain:
--     on conflict (user_id, folder_id)
-- - This patch replaces that partial unique index with a full unique
--   constraint on (user_id, folder_id), which can be inferred by plain upsert.
--
-- Folder delete compatibility:
-- - folder_id is nullable.
-- - PostgreSQL unique constraints allow multiple NULL values.
-- - Therefore past rows whose folder_id was nulled by folder hard delete can
--   be preserved, while live rows for the same user_id + folder_id remain
--   unique and upsertable.
-- - folder_id_snapshot remains the immutable history field.

begin;

-- Fail loudly before adding the constraint if duplicate live rows already
-- exist. The user should manually inspect and merge duplicates before running
-- the constraint creation in that case.
do $$
begin
  if exists (
    select 1
    from public.posty_folder_syncs
    where folder_id is not null
    group by user_id, folder_id
    having count(*) > 1
  ) then
    raise exception
      'Cannot add posty_folder_syncs_user_folder_key: duplicate non-null user_id + folder_id rows exist.';
  end if;
end;
$$;

drop index if exists public.posty_folder_syncs_user_folder_uidx;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posty_folder_syncs_user_folder_key'
      and conrelid = 'public.posty_folder_syncs'::regclass
  ) then
    alter table public.posty_folder_syncs
      add constraint posty_folder_syncs_user_folder_key
      unique (user_id, folder_id);
  end if;
end;
$$;

comment on constraint posty_folder_syncs_user_folder_key
  on public.posty_folder_syncs is
  'Full unique constraint for plain ON CONFLICT (user_id, folder_id). Multiple historical NULL folder_id rows remain allowed.';

commit;
