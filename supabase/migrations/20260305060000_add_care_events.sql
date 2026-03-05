create table if not exists public.care_events (
	id uuid primary key default gen_random_uuid(),
	profile_id text not null,
	plant_id uuid not null references public.plants(id) on delete cascade,
	type text not null check (type in ('water','fertilize','prune','repot','pest','treatment','note')),
	details jsonb,
	event_at timestamptz not null default now(),
	created_at timestamptz default now()
);

create index if not exists care_events_profile_event_idx
	on public.care_events (profile_id, event_at desc);

create index if not exists care_events_plant_event_idx
	on public.care_events (plant_id, event_at desc);
