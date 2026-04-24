-- Add image_url column to student_records table
alter table public.student_records add column if not exists image_url text;

-- Create a storage bucket for student uploads
insert into storage.buckets (id, name, public) 
values ('student_uploads', 'student_uploads', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload files to the bucket
create policy "Authenticated users can upload images"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'student_uploads' );

-- Allow public to view images (since bucket is public)
create policy "Public can view images"
on storage.objects for select
to public
using ( bucket_id = 'student_uploads' );

-- Allow users to update/delete their own images
create policy "Users can update their own images"
on storage.objects for update
to authenticated
using ( bucket_id = 'student_uploads' AND auth.uid() = owner );

create policy "Users can delete their own images"
on storage.objects for delete
to authenticated
using ( bucket_id = 'student_uploads' AND auth.uid() = owner );
