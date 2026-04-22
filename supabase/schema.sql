-- ============================================================
-- Linkko — Supabase SQL Schema
-- Supabase SQL Editor에서 순서대로 실행하세요
-- ============================================================

-- 1. profiles (Supabase Auth 연동)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "본인 프로필만 조회" on public.profiles
  for select using (auth.uid() = id);

create policy "본인 프로필만 수정" on public.profiles
  for update using (auth.uid() = id);


-- 2. 신규 사용자 가입 시 profiles 자동 생성 트리거
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 3. folders
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

alter table public.folders enable row level security;

create policy "본인 폴더만 조회" on public.folders
  for select using (auth.uid() = user_id);

create policy "본인 폴더만 삽입" on public.folders
  for insert with check (auth.uid() = user_id);

create policy "본인 폴더만 수정" on public.folders
  for update using (auth.uid() = user_id);

create policy "본인 폴더만 삭제" on public.folders
  for delete using (auth.uid() = user_id);


-- 4. links
create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  folder_id uuid references public.folders(id) on delete set null,  -- 폴더 삭제 시 null 처리
  url text not null,
  custom_title text,
  memo text,
  preview_title text,
  preview_description text,
  preview_image text,
  preview_site_name text,
  created_at timestamptz default now()
);

alter table public.links enable row level security;

create policy "본인 링크만 조회" on public.links
  for select using (auth.uid() = user_id);

create policy "본인 링크만 삽입" on public.links
  for insert with check (auth.uid() = user_id);

create policy "본인 링크만 수정" on public.links
  for update using (auth.uid() = user_id);

create policy "본인 링크만 삭제" on public.links
  for delete using (auth.uid() = user_id);


-- 5. 인덱스
create index if not exists links_user_id_idx on public.links(user_id);
create index if not exists links_folder_id_idx on public.links(folder_id);
create index if not exists folders_user_id_idx on public.folders(user_id);
