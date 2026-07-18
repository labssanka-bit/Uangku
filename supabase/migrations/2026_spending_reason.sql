-- Keterangan Belanja: tag alasan (Impulsif, Self-reward, dll) + daftar label per user.
alter table public.transactions add column if not exists reason text;
alter table public.profiles add column if not exists spending_reasons text[]
  default array['Kebutuhan','Impulsif','Self-reward','Sosial','Darurat','Langganan'];
update public.profiles set spending_reasons =
  array['Kebutuhan','Impulsif','Self-reward','Sosial','Darurat','Langganan']
  where spending_reasons is null;
