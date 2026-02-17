-- Add organization profile fields
alter table organizations add column if not exists address text;
alter table organizations add column if not exists website text;
alter table organizations add column if not exists email text;
alter table organizations add column if not exists phone text;
alter table organizations add column if not exists logo_url text;
