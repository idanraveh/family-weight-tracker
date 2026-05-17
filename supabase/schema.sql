-- Family Weight Tracker — Supabase Schema
-- Run this in your Supabase SQL editor

create table if not exists families (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  pin_code    text not null,
  created_at  timestamptz default now()
);

create table if not exists profiles (
  id                  uuid primary key default gen_random_uuid(),
  family_id           uuid not null references families(id) on delete cascade,
  name                text not null,
  starting_weight_kg  numeric(5,2),
  goal_weight_kg      numeric(5,2),
  created_at          timestamptz default now()
);

create table if not exists weigh_ins (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references profiles(id) on delete cascade,
  weight_kg   numeric(5,2) not null,
  date        date not null,
  created_at  timestamptz default now()
);

-- Indexes for fast lookups
create index if not exists idx_profiles_family_id   on profiles(family_id);
create index if not exists idx_weigh_ins_profile_id on weigh_ins(profile_id);
create index if not exists idx_weigh_ins_date        on weigh_ins(profile_id, date);

-- Row Level Security: allow public read/write (family PIN is the access control)
alter table families  enable row level security;
alter table profiles  enable row level security;
alter table weigh_ins enable row level security;

create policy "Public read families"  on families  for select using (true);
create policy "Public write families" on families  for all    using (true);
create policy "Public read profiles"  on profiles  for select using (true);
create policy "Public write profiles" on profiles  for all    using (true);
create policy "Public read weigh_ins" on weigh_ins for select using (true);
create policy "Public write weigh_ins" on weigh_ins for all   using (true);
