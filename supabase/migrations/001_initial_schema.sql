-- Groove Habit Tracker - Initial Schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  timezone text default 'America/Los_Angeles',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- ============================================
-- HABITS
-- ============================================
create table if not exists habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  description text,
  icon text,
  color text,

  -- Tracking configuration
  tracking_type text not null default 'boolean',
  target_value numeric,
  target_unit text,

  -- Frequency
  frequency text not null default 'daily',
  frequency_days integer[],

  -- Verification settings
  verification_type text not null default 'self',

  -- Habit stacking
  cue_habit_id uuid references habits(id),
  cue_type text,

  -- Metadata
  is_archived boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table habits enable row level security;

-- Habits policies
create policy "Users can view their own habits"
  on habits for select
  using (auth.uid() = user_id);

create policy "Users can create habits"
  on habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own habits"
  on habits for update
  using (auth.uid() = user_id);

create policy "Users can delete their own habits"
  on habits for delete
  using (auth.uid() = user_id);

-- Index
create index if not exists idx_habits_user_id on habits(user_id);

-- ============================================
-- HABIT ENTRIES (check-ins)
-- ============================================
create table if not exists habit_entries (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,

  entry_date date not null,

  -- Flexible value storage
  completed boolean default false,
  value numeric,

  -- Verification
  photo_url text,
  partner_verified boolean,
  partner_verified_at timestamptz,
  partner_verified_by uuid references profiles(id),

  -- Context (for AI insights)
  note text,
  mood integer,
  energy integer,

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  unique(habit_id, entry_date)
);

-- Enable RLS
alter table habit_entries enable row level security;

-- Habit entries policies
create policy "Users can view their own entries"
  on habit_entries for select
  using (auth.uid() = user_id);

create policy "Users can create entries"
  on habit_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own entries"
  on habit_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete their own entries"
  on habit_entries for delete
  using (auth.uid() = user_id);

-- Indexes
create index if not exists idx_habit_entries_habit_id on habit_entries(habit_id);
create index if not exists idx_habit_entries_user_date on habit_entries(user_id, entry_date);

-- ============================================
-- PARTNERSHIPS
-- ============================================
create table if not exists partnerships (
  id uuid primary key default gen_random_uuid(),

  requester_id uuid references profiles(id) on delete cascade not null,
  partner_id uuid references profiles(id) on delete cascade not null,

  status text not null default 'pending',

  -- Permissions
  can_view_habits boolean default true,
  can_verify_entries boolean default true,
  can_send_nudges boolean default true,

  created_at timestamptz default now(),
  accepted_at timestamptz,
  ended_at timestamptz,

  unique(requester_id, partner_id)
);

-- Enable RLS
alter table partnerships enable row level security;

-- Partnerships policies
create policy "Users can view their partnerships"
  on partnerships for select
  using (auth.uid() = requester_id or auth.uid() = partner_id);

create policy "Users can create partnership requests"
  on partnerships for insert
  with check (auth.uid() = requester_id);

create policy "Users can update their partnerships"
  on partnerships for update
  using (auth.uid() = requester_id or auth.uid() = partner_id);

-- Index
create index if not exists idx_partnerships_users on partnerships(requester_id, partner_id);

-- ============================================
-- HABIT SHARES
-- ============================================
create table if not exists habit_shares (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid references habits(id) on delete cascade not null,
  partnership_id uuid references partnerships(id) on delete cascade not null,

  can_view boolean default true,
  can_verify boolean default false,

  created_at timestamptz default now(),

  unique(habit_id, partnership_id)
);

-- Enable RLS
alter table habit_shares enable row level security;

-- Habit shares policies (users can manage shares for their own habits)
create policy "Users can view shares for their habits"
  on habit_shares for select
  using (
    exists (
      select 1 from habits where habits.id = habit_shares.habit_id and habits.user_id = auth.uid()
    )
    or
    exists (
      select 1 from partnerships
      where partnerships.id = habit_shares.partnership_id
      and (partnerships.requester_id = auth.uid() or partnerships.partner_id = auth.uid())
    )
  );

create policy "Users can create shares for their habits"
  on habit_shares for insert
  with check (
    exists (
      select 1 from habits where habits.id = habit_shares.habit_id and habits.user_id = auth.uid()
    )
  );

create policy "Users can delete shares for their habits"
  on habit_shares for delete
  using (
    exists (
      select 1 from habits where habits.id = habit_shares.habit_id and habits.user_id = auth.uid()
    )
  );

-- ============================================
-- NUDGES
-- ============================================
create table if not exists nudges (
  id uuid primary key default gen_random_uuid(),

  from_user_id uuid references profiles(id) on delete cascade not null,
  to_user_id uuid references profiles(id) on delete cascade not null,
  habit_id uuid references habits(id) on delete set null,

  message text,
  type text default 'encouragement',

  read_at timestamptz,
  created_at timestamptz default now()
);

-- Enable RLS
alter table nudges enable row level security;

-- Nudges policies
create policy "Users can view nudges sent to them"
  on nudges for select
  using (auth.uid() = to_user_id or auth.uid() = from_user_id);

create policy "Users can send nudges"
  on nudges for insert
  with check (auth.uid() = from_user_id);

create policy "Users can update nudges sent to them (mark as read)"
  on nudges for update
  using (auth.uid() = to_user_id);

-- Index
create index if not exists idx_nudges_to_user on nudges(to_user_id, read_at);

-- ============================================
-- INSIGHTS
-- ============================================
create table if not exists insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,

  insight_type text not null,
  content jsonb not null,

  generated_at timestamptz default now(),
  dismissed_at timestamptz,
  acted_on boolean default false
);

-- Enable RLS
alter table insights enable row level security;

-- Insights policies
create policy "Users can view their own insights"
  on insights for select
  using (auth.uid() = user_id);

create policy "Users can update their own insights"
  on insights for update
  using (auth.uid() = user_id);

-- ============================================
-- TRIGGER: Auto-create profile on signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, timezone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'timezone', 'America/Los_Angeles')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to tables with updated_at
drop trigger if exists profiles_updated_at on profiles;
create trigger profiles_updated_at
  before update on profiles
  for each row execute procedure public.update_updated_at();

drop trigger if exists habits_updated_at on habits;
create trigger habits_updated_at
  before update on habits
  for each row execute procedure public.update_updated_at();

drop trigger if exists habit_entries_updated_at on habit_entries;
create trigger habit_entries_updated_at
  before update on habit_entries
  for each row execute procedure public.update_updated_at();
