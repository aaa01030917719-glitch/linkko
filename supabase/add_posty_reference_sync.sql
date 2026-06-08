-- ============================================================
-- Linkko -> Posty reference sync outbox draft
-- ============================================================
--
-- Do not run automatically. Review in Supabase SQL Editor first.
--
-- Design notes:
-- - Linkko and Posty use different Supabase projects. Do not assume Linkko
--   user_id equals Posty user_id.
-- - Linkko sends linkkoUserId in outbound payloads. Posty resolves it through
--   its own linkko_account_connections table.
-- - Existing Linkko CRUD code is not changed by this SQL. Realtime events are
--   captured by DB triggers and stored in a transactional outbox.
-- - Folder hard delete:
--   Current Linkko schema has links.folder_id -> folders.id ON DELETE SET NULL.
--   This draft preserves sync history by making posty_folder_syncs.folder_id
--   nullable with ON DELETE SET NULL, while keeping folder_id_snapshot and
--   folder_name_snapshot.
--   A BEFORE DELETE trigger on folders first enqueues reference.delete for
--   every existing link in that folder, then enqueues one folder.disconnect
--   event, disables the sync row, sets disconnected_at, and nulls folder_id
--   before the original folder row is removed. Posty should set
--   reference_sources.source_deleted_at and keep existing references/analyses.
--   Same URL values can exist in other folders, so Posty must not delete the
--   reference by URL.
-- - posty_sync_events.link_id is intentionally not an FK to links.id, because
--   Linkko links can be hard-deleted and delete snapshots must survive. It is
--   nullable only for folder-level events such as folder.disconnect.
-- - posty_sync_events.folder_id is also a snapshot and intentionally not an FK
--   to folders.id, because folder.disconnect and link delete/move events should
--   preserve the old folder id after Linkko folder hard delete.

begin;

-- ------------------------------------------------------------
-- 1. Common updated_at helper
-- ------------------------------------------------------------

create or replace function public.posty_set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.posty_set_updated_at() from public;
revoke all on function public.posty_set_updated_at() from anon;
revoke all on function public.posty_set_updated_at() from authenticated;

-- ------------------------------------------------------------
-- 2. Folder sync selections and backfill cursor state
-- ------------------------------------------------------------

create table if not exists public.posty_folder_syncs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid null references public.folders(id) on delete set null,
  folder_id_snapshot uuid not null,
  folder_name_snapshot text not null,
  is_enabled boolean not null default true,
  connected_at timestamptz not null default now(),
  disconnected_at timestamptz null,
  last_backfill_cursor_created_at timestamptz null,
  last_backfill_cursor_id uuid null,
  last_reconciled_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posty_folder_syncs
  add column if not exists id uuid default gen_random_uuid();
alter table public.posty_folder_syncs
  add column if not exists user_id uuid;
alter table public.posty_folder_syncs
  add column if not exists folder_id uuid;
alter table public.posty_folder_syncs
  add column if not exists folder_id_snapshot uuid;
alter table public.posty_folder_syncs
  add column if not exists folder_name_snapshot text;
alter table public.posty_folder_syncs
  add column if not exists is_enabled boolean not null default true;
alter table public.posty_folder_syncs
  add column if not exists connected_at timestamptz not null default now();
alter table public.posty_folder_syncs
  add column if not exists disconnected_at timestamptz;
alter table public.posty_folder_syncs
  add column if not exists last_backfill_cursor_created_at timestamptz;
alter table public.posty_folder_syncs
  add column if not exists last_backfill_cursor_id uuid;
alter table public.posty_folder_syncs
  add column if not exists last_reconciled_at timestamptz;
alter table public.posty_folder_syncs
  add column if not exists created_at timestamptz not null default now();
alter table public.posty_folder_syncs
  add column if not exists updated_at timestamptz not null default now();

update public.posty_folder_syncs
  set folder_id_snapshot = folder_id
where folder_id_snapshot is null
  and folder_id is not null;

alter table public.posty_folder_syncs
  alter column folder_id_snapshot set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posty_folder_syncs_pkey'
      and conrelid = 'public.posty_folder_syncs'::regclass
  ) then
    alter table public.posty_folder_syncs
      add constraint posty_folder_syncs_pkey primary key (id);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posty_folder_syncs_user_id_fkey'
      and conrelid = 'public.posty_folder_syncs'::regclass
  ) then
    alter table public.posty_folder_syncs
      add constraint posty_folder_syncs_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posty_folder_syncs_folder_id_fkey'
      and conrelid = 'public.posty_folder_syncs'::regclass
  ) then
    alter table public.posty_folder_syncs
      add constraint posty_folder_syncs_folder_id_fkey
      foreign key (folder_id) references public.folders(id) on delete set null;
  end if;
end;
$$;

-- Unique active source selection for a live Linkko folder.
-- folder_id stays nullable so old connection rows survive folder hard delete.
create unique index if not exists posty_folder_syncs_user_folder_uidx
  on public.posty_folder_syncs (user_id, folder_id)
  where folder_id is not null;

comment on column public.posty_folder_syncs.folder_id is
  'Nullable to preserve Posty connection history after Linkko folder hard delete. folder_name_snapshot must remain populated.';

comment on column public.posty_folder_syncs.folder_id_snapshot is
  'Immutable Linkko folder UUID snapshot. It remains populated after folder_id is nulled by folder hard delete.';

create or replace function public.posty_prepare_folder_sync()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    new.folder_id_snapshot = new.folder_id;
  end if;

  if new.folder_id_snapshot is null then
    raise exception 'posty_folder_syncs.folder_id_snapshot is required';
  end if;

  return new;
end;
$$;

revoke all on function public.posty_prepare_folder_sync() from public;
revoke all on function public.posty_prepare_folder_sync() from anon;
revoke all on function public.posty_prepare_folder_sync() from authenticated;

drop trigger if exists posty_folder_syncs_prepare on public.posty_folder_syncs;
create trigger posty_folder_syncs_prepare
  before insert or update on public.posty_folder_syncs
  for each row execute function public.posty_prepare_folder_sync();

drop trigger if exists posty_folder_syncs_set_updated_at on public.posty_folder_syncs;
create trigger posty_folder_syncs_set_updated_at
  before update on public.posty_folder_syncs
  for each row execute function public.posty_set_updated_at();

alter table public.posty_folder_syncs enable row level security;
revoke all on table public.posty_folder_syncs from public;
revoke all on table public.posty_folder_syncs from anon;
revoke all on table public.posty_folder_syncs from authenticated;

-- No authenticated policies are created on purpose. These tables are service
-- role only, plus SECURITY DEFINER trigger functions below.

-- ------------------------------------------------------------
-- 3. Transactional outbox events
-- ------------------------------------------------------------

create table if not exists public.posty_sync_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid null,
  link_id uuid null,
  event_type text not null,
  payload jsonb not null,
  status text not null default 'pending',
  attempt_count int not null default 0,
  last_attempt_at timestamptz null,
  next_retry_at timestamptz null,
  posty_response jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posty_sync_events
  add column if not exists id uuid default gen_random_uuid();
alter table public.posty_sync_events
  add column if not exists user_id uuid;
alter table public.posty_sync_events
  add column if not exists folder_id uuid;
alter table public.posty_sync_events
  add column if not exists link_id uuid;
alter table public.posty_sync_events
  alter column link_id drop not null;
alter table public.posty_sync_events
  add column if not exists event_type text;
alter table public.posty_sync_events
  add column if not exists payload jsonb;
alter table public.posty_sync_events
  add column if not exists status text not null default 'pending';
alter table public.posty_sync_events
  add column if not exists attempt_count int not null default 0;
alter table public.posty_sync_events
  add column if not exists last_attempt_at timestamptz;
alter table public.posty_sync_events
  add column if not exists next_retry_at timestamptz;
alter table public.posty_sync_events
  add column if not exists posty_response jsonb;
alter table public.posty_sync_events
  add column if not exists created_at timestamptz not null default now();
alter table public.posty_sync_events
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posty_sync_events_pkey'
      and conrelid = 'public.posty_sync_events'::regclass
  ) then
    alter table public.posty_sync_events
      add constraint posty_sync_events_pkey primary key (id);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posty_sync_events_link_id_event_type_check'
      and conrelid = 'public.posty_sync_events'::regclass
  ) then
    alter table public.posty_sync_events
      add constraint posty_sync_events_link_id_event_type_check
      check (
        (
          event_type in (
            'reference.upsert',
            'reference.delete',
            'reference.backfill'
          )
          and link_id is not null
        )
        or (
          event_type = 'reference.reconcile'
        )
        or (
          event_type = 'folder.disconnect'
          and link_id is null
        )
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posty_sync_events_user_id_fkey'
      and conrelid = 'public.posty_sync_events'::regclass
  ) then
    alter table public.posty_sync_events
      add constraint posty_sync_events_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete cascade;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posty_sync_events_event_type_check'
      and conrelid = 'public.posty_sync_events'::regclass
  ) then
    alter table public.posty_sync_events
      add constraint posty_sync_events_event_type_check
      check (
        event_type in (
          'reference.upsert',
          'reference.delete',
          'reference.backfill',
          'reference.reconcile',
          'folder.disconnect'
        )
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posty_sync_events_status_check'
      and conrelid = 'public.posty_sync_events'::regclass
  ) then
    alter table public.posty_sync_events
      add constraint posty_sync_events_status_check
      check (
        status in (
          'pending',
          'sending',
          'succeeded',
          'retry_scheduled',
          'failed'
        )
      );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'posty_sync_events_attempt_count_check'
      and conrelid = 'public.posty_sync_events'::regclass
  ) then
    alter table public.posty_sync_events
      add constraint posty_sync_events_attempt_count_check
      check (attempt_count >= 0);
  end if;
end;
$$;

comment on column public.posty_sync_events.link_id is
  'Snapshot UUID only. No FK to links.id because Linkko hard-deletes links and delete events must survive. Nullable for folder.disconnect and reference.reconcile.';

comment on column public.posty_sync_events.folder_id is
  'Snapshot UUID only. No FK to folders.id because folder delete/disconnect events must preserve the old folder id.';

drop trigger if exists posty_sync_events_set_updated_at on public.posty_sync_events;
create trigger posty_sync_events_set_updated_at
  before update on public.posty_sync_events
  for each row execute function public.posty_set_updated_at();

alter table public.posty_sync_events enable row level security;
revoke all on table public.posty_sync_events from public;
revoke all on table public.posty_sync_events from anon;
revoke all on table public.posty_sync_events from authenticated;

-- ------------------------------------------------------------
-- 4. Indexes
-- ------------------------------------------------------------

create index if not exists posty_folder_syncs_enabled_folder_idx
  on public.posty_folder_syncs (folder_id, user_id)
  where is_enabled = true and folder_id is not null;

create index if not exists posty_folder_syncs_user_folder_idx
  on public.posty_folder_syncs (user_id, folder_id);

create index if not exists posty_folder_syncs_user_folder_snapshot_idx
  on public.posty_folder_syncs (user_id, folder_id_snapshot);

create index if not exists posty_folder_syncs_enabled_reconcile_idx
  on public.posty_folder_syncs (is_enabled, last_reconciled_at, updated_at);

create index if not exists posty_sync_events_dispatch_idx
  on public.posty_sync_events (status, next_retry_at, created_at)
  where status in ('pending', 'retry_scheduled');

create index if not exists posty_sync_events_due_retry_idx
  on public.posty_sync_events (next_retry_at, created_at)
  where status = 'retry_scheduled';

create index if not exists posty_sync_events_user_folder_idx
  on public.posty_sync_events (user_id, folder_id);

create index if not exists posty_sync_events_link_id_idx
  on public.posty_sync_events (link_id, created_at);

create index if not exists posty_sync_events_created_at_idx
  on public.posty_sync_events (created_at, id);

-- ------------------------------------------------------------
-- 5. Payload helpers
-- ------------------------------------------------------------

create or replace function public.posty_link_event_payload(
  p_event_id uuid,
  p_event_type text,
  p_link public.links,
  p_folder_name text,
  p_mode text
)
returns jsonb
language sql
stable
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'schemaVersion', 'linkko_posty_reference_event_v1',
    'eventId', p_event_id,
    'eventType', p_event_type,
    'occurredAt', now(),
    'linkkoUserId', p_link.user_id,
    'link', jsonb_build_object(
      'id', p_link.id,
      'folderId', p_link.folder_id,
      'folderName', p_folder_name,
      'url', p_link.url,
      'customTitle', p_link.custom_title,
      'memo', p_link.memo,
      'previewTitle', p_link.preview_title,
      'previewDescription', p_link.preview_description,
      'previewImage', p_link.preview_image,
      'previewSiteName', p_link.preview_site_name,
      'createdAt', p_link.created_at
    ),
    'metadata', jsonb_build_object(
      'mode', p_mode
    )
  );
$$;

revoke all on function public.posty_link_event_payload(uuid, text, public.links, text, text) from public;
revoke all on function public.posty_link_event_payload(uuid, text, public.links, text, text) from anon;
revoke all on function public.posty_link_event_payload(uuid, text, public.links, text, text) from authenticated;

create or replace function public.posty_insert_link_sync_event(
  p_user_id uuid,
  p_folder_id uuid,
  p_link_id uuid,
  p_event_type text,
  p_link public.links,
  p_mode text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event_id uuid := gen_random_uuid();
  v_folder_name text;
  v_payload jsonb;
begin
  select f.name
    into v_folder_name
  from public.folders f
  where f.id = p_folder_id;

  if v_folder_name is null and p_folder_id is not null then
    select pfs.folder_name_snapshot
      into v_folder_name
    from public.posty_folder_syncs pfs
    where pfs.user_id = p_user_id
      and pfs.folder_id = p_folder_id
    order by pfs.updated_at desc
    limit 1;
  end if;

  v_payload := public.posty_link_event_payload(
    v_event_id,
    p_event_type,
    p_link,
    v_folder_name,
    p_mode
  );

  insert into public.posty_sync_events (
    id,
    user_id,
    folder_id,
    link_id,
    event_type,
    payload,
    status
  )
  values (
    v_event_id,
    p_user_id,
    p_folder_id,
    p_link_id,
    p_event_type,
    v_payload,
    'pending'
  );

  return v_event_id;
end;
$$;

revoke all on function public.posty_insert_link_sync_event(uuid, uuid, uuid, text, public.links, text) from public;
revoke all on function public.posty_insert_link_sync_event(uuid, uuid, uuid, text, public.links, text) from anon;
revoke all on function public.posty_insert_link_sync_event(uuid, uuid, uuid, text, public.links, text) from authenticated;

-- ------------------------------------------------------------
-- 6. Link outbox trigger
-- ------------------------------------------------------------

create or replace function public.posty_enqueue_link_sync_event()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_old_folder_enabled boolean := false;
  v_new_folder_enabled boolean := false;
  v_watched_columns_changed boolean := false;
begin
  if tg_op = 'INSERT' then
    if new.folder_id is null then
      return new;
    end if;

    select exists (
      select 1
      from public.posty_folder_syncs pfs
      where pfs.user_id = new.user_id
        and pfs.folder_id = new.folder_id
        and pfs.is_enabled = true
    )
      into v_new_folder_enabled;

    if v_new_folder_enabled then
      perform public.posty_insert_link_sync_event(
        new.user_id,
        new.folder_id,
        new.id,
        'reference.upsert',
        new,
        'realtime'
      );
    end if;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    v_watched_columns_changed :=
      old.folder_id is distinct from new.folder_id or
      old.url is distinct from new.url or
      old.custom_title is distinct from new.custom_title or
      old.memo is distinct from new.memo or
      old.preview_title is distinct from new.preview_title or
      old.preview_description is distinct from new.preview_description or
      old.preview_image is distinct from new.preview_image or
      old.preview_site_name is distinct from new.preview_site_name;

    if not v_watched_columns_changed then
      return new;
    end if;

    if old.folder_id is not null then
      select exists (
        select 1
        from public.posty_folder_syncs pfs
        where pfs.user_id = old.user_id
          and pfs.folder_id = old.folder_id
          and pfs.is_enabled = true
      )
        into v_old_folder_enabled;
    end if;

    if new.folder_id is not null then
      select exists (
        select 1
        from public.posty_folder_syncs pfs
        where pfs.user_id = new.user_id
          and pfs.folder_id = new.folder_id
          and pfs.is_enabled = true
      )
        into v_new_folder_enabled;
    end if;

    if v_new_folder_enabled then
      -- Covers:
      -- - unselected folder -> selected folder move
      -- - selected folder -> selected folder move
      -- - metadata/url changes inside a selected folder
      perform public.posty_insert_link_sync_event(
        new.user_id,
        new.folder_id,
        new.id,
        'reference.upsert',
        new,
        'realtime'
      );
    elsif v_old_folder_enabled then
      -- Covers selected folder -> unselected folder/null move. Posty should
      -- detach the reference source mapping and keep analysis results.
      perform public.posty_insert_link_sync_event(
        old.user_id,
        old.folder_id,
        old.id,
        'reference.delete',
        old,
        'realtime'
      );
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    if old.folder_id is null then
      return old;
    end if;

    select exists (
      select 1
      from public.posty_folder_syncs pfs
      where pfs.user_id = old.user_id
        and pfs.folder_id = old.folder_id
        and pfs.is_enabled = true
    )
      into v_old_folder_enabled;

    if v_old_folder_enabled then
      perform public.posty_insert_link_sync_event(
        old.user_id,
        old.folder_id,
        old.id,
        'reference.delete',
        old,
        'realtime'
      );
    end if;

    return old;
  end if;

  return null;
end;
$$;

revoke all on function public.posty_enqueue_link_sync_event() from public;
revoke all on function public.posty_enqueue_link_sync_event() from anon;
revoke all on function public.posty_enqueue_link_sync_event() from authenticated;

drop trigger if exists posty_links_sync_insert on public.links;
create trigger posty_links_sync_insert
  after insert on public.links
  for each row execute function public.posty_enqueue_link_sync_event();

drop trigger if exists posty_links_sync_update on public.links;
create trigger posty_links_sync_update
  after update of
    folder_id,
    url,
    custom_title,
    memo,
    preview_title,
    preview_description,
    preview_image,
    preview_site_name
  on public.links
  for each row execute function public.posty_enqueue_link_sync_event();

drop trigger if exists posty_links_sync_delete on public.links;
create trigger posty_links_sync_delete
  after delete on public.links
  for each row execute function public.posty_enqueue_link_sync_event();

-- ------------------------------------------------------------
-- 7. Folder hard delete outbox trigger
-- ------------------------------------------------------------

create or replace function public.posty_enqueue_folder_disconnect_event()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_event_id uuid;
  v_sync public.posty_folder_syncs%rowtype;
  v_link public.links%rowtype;
begin
  for v_sync in
    select *
    from public.posty_folder_syncs pfs
    where pfs.folder_id = old.id
      and pfs.user_id = old.user_id
      and pfs.is_enabled = true
  loop
    -- Enqueue one link-level delete per current Linkko link before the folder
    -- FK sets links.folder_id to null. Posty should mark each source mapping as
    -- deleted, not delete the reference by URL.
    for v_link in
      select *
      from public.links l
      where l.user_id = old.user_id
        and l.folder_id = old.id
      order by l.created_at asc, l.id asc
    loop
      perform public.posty_insert_link_sync_event(
        v_link.user_id,
        old.id,
        v_link.id,
        'reference.delete',
        v_link,
        'realtime'
      );
    end loop;

    v_event_id := gen_random_uuid();

    insert into public.posty_sync_events (
      id,
      user_id,
      folder_id,
      link_id,
      event_type,
      payload,
      status
    )
    values (
      v_event_id,
      old.user_id,
      old.id,
      null,
      'folder.disconnect',
      jsonb_build_object(
        'schemaVersion', 'linkko_posty_reference_event_v1',
        'eventId', v_event_id,
        'eventType', 'folder.disconnect',
        'occurredAt', now(),
        'linkkoUserId', old.user_id,
        'folder', jsonb_build_object(
          'id', old.id,
          'idSnapshot', coalesce(v_sync.folder_id_snapshot, old.id),
          'name', old.name,
          'nameSnapshot', v_sync.folder_name_snapshot,
          'connectedAt', v_sync.connected_at,
          'disconnectedAt', now()
        ),
        'metadata', jsonb_build_object(
          'mode', 'realtime',
          'reason', 'linkko_folder_hard_delete'
        )
      ),
      'pending'
    );

    update public.posty_folder_syncs
      set is_enabled = false,
          disconnected_at = coalesce(disconnected_at, now()),
          folder_id = null,
          folder_id_snapshot = coalesce(folder_id_snapshot, old.id),
          folder_name_snapshot = coalesce(folder_name_snapshot, old.name)
    where id = v_sync.id;
  end loop;

  return old;
end;
$$;

revoke all on function public.posty_enqueue_folder_disconnect_event() from public;
revoke all on function public.posty_enqueue_folder_disconnect_event() from anon;
revoke all on function public.posty_enqueue_folder_disconnect_event() from authenticated;

drop trigger if exists posty_folders_disconnect_before_delete on public.folders;
create trigger posty_folders_disconnect_before_delete
  before delete on public.folders
  for each row execute function public.posty_enqueue_folder_disconnect_event();

commit;
