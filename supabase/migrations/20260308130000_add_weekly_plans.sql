create table if not exists public.weekly_plans (
	id uuid primary key default gen_random_uuid(),
	profile_id text not null,
	week_start date not null,
	tasks_json jsonb not null default '[]'::jsonb,
	created_at timestamptz default now(),
	updated_at timestamptz default now()
);

create unique index if not exists weekly_plans_profile_week_unique_idx
	on public.weekly_plans (profile_id, week_start);
