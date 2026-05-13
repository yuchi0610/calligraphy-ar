-- =====================================================
-- 核去核從 互動體驗 — Supabase Schema
-- 在 Supabase Dashboard > SQL Editor 執行此檔案
-- =====================================================

-- 場景表
CREATE TABLE scenes (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type        text NOT NULL CHECK (type IN ('animation','newspaper','dialog','signature','game','ending')),
  title       text NOT NULL,
  "order"     integer NOT NULL DEFAULT 0,
  config      jsonb NOT NULL DEFAULT '{}',
  visible     boolean NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- 結局表
CREATE TABLE endings (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type        text NOT NULL CHECK (type IN ('A','B','C')),
  label       text NOT NULL,
  score_min   integer NOT NULL,
  score_max   integer NOT NULL,
  config      jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);

-- 遊玩紀錄表
CREATE TABLE sessions (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at    timestamptz DEFAULT now(),
  ended_at      timestamptz,
  scores        jsonb DEFAULT '{}',
  total_score   integer DEFAULT 0,
  ending_type   text,
  user_agent    text,
  signature_url text
);

-- ── RLS（Row Level Security）─────────────────────────────────

ALTER TABLE scenes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE endings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- 公開：讀取可見場景與結局（觀眾用）
CREATE POLICY "public_read_scenes"   ON scenes   FOR SELECT TO anon USING (visible = true);
CREATE POLICY "public_read_endings"  ON endings  FOR SELECT TO anon USING (true);

-- 公開：建立與更新自己的 session
CREATE POLICY "public_insert_sessions" ON sessions FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "public_update_sessions" ON sessions FOR UPDATE TO anon USING (true);

-- 管理員：完整權限
CREATE POLICY "admin_all_scenes"   ON scenes   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_all_endings"  ON endings  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_read_sessions" ON sessions FOR SELECT TO authenticated USING (true);

-- ── 預設資料 ──────────────────────────────────────────────────

INSERT INTO endings (type, label, score_min, score_max, config) VALUES
  ('A', '和平之路',  67, 100, '{"description":"你做到了，世界選擇了和平。湯川的精神延續下去。"}'),
  ('B', '掙扎邊緣',  34,  66, '{"description":"世界仍在掙扎，但你的選擇留下了一線希望。"}'),
  ('C', '黑暗時代',   0,  33, '{"description":"戰爭的陰影籠罩著未來，歷史再次重演。"}');

-- ── Storage Bucket（在 Dashboard > Storage 手動建立）────────
-- Bucket 名稱：media
-- Public bucket：是
-- 允許上傳類型：image/*, video/*
-- 檔案大小上限：建議 100MB
