-- Catat siapa pemakai tiap kode (utk panel admin). Idempotent.
alter table public.license_keys add column if not exists used_by uuid;
alter table public.license_keys add column if not exists used_email text;
