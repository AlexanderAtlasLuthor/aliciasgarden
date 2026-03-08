alter table public.chat_threads
	add column if not exists plant_id uuid;

do $$
begin
	if not exists (
		select 1
		from pg_constraint
		where conname = 'chat_threads_plant_id_fkey'
			and conrelid = 'public.chat_threads'::regclass
	) then
		alter table public.chat_threads
			add constraint chat_threads_plant_id_fkey
			foreign key (plant_id)
			references public.plants(id)
			on delete cascade;
	end if;
end $$;

create index if not exists chat_threads_plant_created_idx
	on public.chat_threads (plant_id, created_at desc);
