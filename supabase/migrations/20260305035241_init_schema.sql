create extension if not exists pgcrypto;

create table if not exists public.plants (
	id uuid primary key default gen_random_uuid(),
	profile_id text not null,
	nickname text not null,
	species_common text,
	location text,
	light text,
	watering_interval_days int,
	notes text,
	created_at timestamptz default now()
);

create index if not exists plants_profile_created_idx
	on public.plants (profile_id, created_at desc);

create table if not exists public.chat_threads (
	id uuid primary key default gen_random_uuid(),
	profile_id text not null,
	title text,
	created_at timestamptz default now()
);

create index if not exists chat_threads_profile_created_idx
	on public.chat_threads (profile_id, created_at desc);

create table if not exists public.chat_messages (
	id uuid primary key default gen_random_uuid(),
	thread_id uuid not null references public.chat_threads(id) on delete cascade,
	role text not null check (role in ('user','assistant','system')),
	content text not null,
	created_at timestamptz default now()
);

create index if not exists chat_messages_thread_created_idx
	on public.chat_messages (thread_id, created_at asc);
