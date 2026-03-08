create extension if not exists pgcrypto;

create table if not exists public.diagnoses (
	id uuid primary key default gen_random_uuid(),
	profile_id text not null,
	plant_id uuid not null references public.plants(id) on delete cascade,
	photo_url text not null,
	possible_causes jsonb not null default '[]'::jsonb,
	action_plan jsonb not null default '[]'::jsonb,
	confirmation_questions jsonb not null default '[]'::jsonb,
	created_at timestamptz default now()
);

create index if not exists diagnoses_plant_created_idx
	on public.diagnoses (plant_id, created_at desc);
