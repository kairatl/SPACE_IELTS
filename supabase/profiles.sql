-- Run this in Supabase → SQL Editor (once) to create profiles and sync after email verification.
-- Adjust columns to match your diagram (e.g. add phone, country).

create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    email text,
    full_name text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.profiles is 'User profile row created after email is verified; extend with personal details as needed.';

alter table public.profiles enable row level security;

create policy "profiles_select_own"
    on public.profiles for select
    using (auth.uid() = id);

create policy "profiles_update_own"
    on public.profiles for update
    using (auth.uid() = id);

-- Insert or update profile when the user confirms their email (email_confirmed_at becomes non-null).
create or replace function public.handle_user_email_verified()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if old.email_confirmed_at is null and new.email_confirmed_at is not null then
        insert into public.profiles (id, email, full_name, updated_at)
        values (new.id, new.email, null, now())
        on conflict (id) do update
            set email = excluded.email,
                updated_at = now();
    end if;
    return new;
end;
$$;

drop trigger if exists on_auth_user_email_verified on auth.users;
create trigger on_auth_user_email_verified
    after update on auth.users
    for each row
    execute function public.handle_user_email_verified();

-- If "Confirm email" is disabled in Auth settings, users are confirmed on signup — create profile on insert too.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if new.email_confirmed_at is not null then
        insert into public.profiles (id, email, full_name, updated_at)
        values (new.id, new.email, null, now())
        on conflict (id) do update
            set email = excluded.email,
                updated_at = now();
    end if;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created_profiles on auth.users;
create trigger on_auth_user_created_profiles
    after insert on auth.users
    for each row
    execute function public.handle_new_auth_user();
