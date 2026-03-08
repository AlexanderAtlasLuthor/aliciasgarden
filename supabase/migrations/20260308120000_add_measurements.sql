create table if not exists public.measurements (
	id uuid primary key default gen_random_uuid(),
	profile_id text not null,
	plant_id uuid not null references public.plants(id) on delete cascade,
	height_cm numeric check (height_cm is null or height_cm >= 0),
	leaf_count int check (leaf_count is null or leaf_count >= 0),
	notes text,
	measured_at timestamptz not null default now(),
	created_at timestamptz default now()
);

create index if not exists measurements_plant_measured_idx
	on public.measurements (plant_id, measured_at desc);
