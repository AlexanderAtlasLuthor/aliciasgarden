create table if not exists public.plant_photos (
	id uuid primary key default gen_random_uuid(),
	profile_id text not null,
	plant_id uuid not null references public.plants(id) on delete cascade,
	storage_path text not null,
	caption text,
	taken_at timestamptz,
	created_at timestamptz default now()
);

create index if not exists plant_photos_plant_created_idx
	on public.plant_photos (plant_id, created_at desc);

alter table public.plants
	add column if not exists cover_photo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
	'plant-photos',
	'plant-photos',
	false,
	8388608,
	array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
	public = excluded.public,
	file_size_limit = excluded.file_size_limit,
	allowed_mime_types = excluded.allowed_mime_types;
