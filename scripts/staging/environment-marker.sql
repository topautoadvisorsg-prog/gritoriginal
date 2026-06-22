-- Run only in the newly provisioned, isolated staging database.
-- Replace the example ID with the exact STAGING_ENVIRONMENT_ID value.
create table if not exists public.grit_environment_metadata (
  singleton boolean primary key default true check (singleton = true),
  environment_id text not null unique,
  environment_kind text not null check (environment_kind = 'staging'),
  created_at timestamptz not null default now()
);

insert into public.grit_environment_metadata (singleton, environment_id, environment_kind)
values (true, 'grit-staging-replace-with-unique-id', 'staging');
