-- FIX 1: Ensure Storage Policies (For Uploads)
-- This allows any authenticated user to upload to the 'student_uploads' bucket
create policy "Authenticated users can upload images"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'student_uploads' );

-- This allows anyone (even unauthenticated) to VIEW the images
create policy "Public can view images"
on storage.objects for select
to public
using ( bucket_id = 'student_uploads' );

-- This allows users to UPDATE their own images
create policy "Users can update their own images"
on storage.objects for update
to authenticated
using ( bucket_id = 'student_uploads' AND auth.uid() = owner );

-- This allows users to DELETE their own images
create policy "Users can delete their own images"
on storage.objects for delete
to authenticated
using ( bucket_id = 'student_uploads' AND auth.uid() = owner );


-- FIX 2: Ensure Student Records Table Policies (For Saving Data)
-- Enable RLS just in case
alter table public.student_records enable row level security;

-- Drop existing policies to avoid conflicts if re-running
drop policy if exists "Users can insert their own records" on public.student_records;
drop policy if exists "Users can view their own records" on public.student_records;
drop policy if exists "Users can update their own records" on public.student_records;
drop policy if exists "Users can delete their own records" on public.student_records;

-- Re-create policies
create policy "Users can insert their own records" on public.student_records
  for insert with check (auth.uid() = user_id);

create policy "Users can view their own records" on public.student_records
  for select using (auth.uid() = user_id);

create policy "Users can update their own records" on public.student_records
  for update using (auth.uid() = user_id);

create policy "Users can delete their own records" on public.student_records
  for delete using (auth.uid() = user_id);

-- Ensure image_url column exists
alter table public.student_records add column if not exists image_url text;


-- FIX 3: Ensure Profiles Policies (For Profile Settings)
create table if not exists public.profiles (
  id uuid not null references auth.users on delete cascade,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  website text,
  bio text,
  theme_preference text default 'system',
  primary key (id)
);

alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone."
  on profiles for select using ( true );

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile."
  on profiles for insert with check ( auth.uid() = id );

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile."
  on profiles for update using ( auth.uid() = id );
