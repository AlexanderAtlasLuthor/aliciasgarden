alter table public.plants
	add column if not exists is_favorite boolean not null default false;
