-- Create the table for student records
create table public.student_records (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  user_id uuid not null default auth.uid (),
  title text not null,
  category text not null,
  description text null,
  date date not null,
  constraint student_records_pkey primary key (id),
  constraint student_records_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);

-- Enable Row Level Security (RLS)
alter table public.student_records enable row level security;

-- Create policies
create policy "Users can view their own records" on public.student_records
  for select
  using (auth.uid() = user_id);

create policy "Users can insert their own records" on public.student_records
  for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own records" on public.student_records
  for update
  using (auth.uid() = user_id);

create policy "Users can delete their own records" on public.student_records
  for delete
  using (auth.uid() = user_id);
