-- Bổ sung cho VieNeu-TTS + 3 kịch bản mỗi lần tạo
-- Chạy sau 0001_init.sql trong Supabase SQL Editor

-- Lưu 3 kịch bản: [{ "hook": "...", "body": "...", "cta": "...", "audio_path": "..." }, ...]
alter table public.projects
  add column if not exists variants jsonb not null default '[]'::jsonb;

-- Cho phép nhà cung cấp giọng đọc 'vieneu'
alter table public.projects drop constraint if exists projects_tts_provider_check;
alter table public.projects
  add constraint projects_tts_provider_check
  check (tts_provider in ('vieneu', 'vbee', 'elevenlabs'));
