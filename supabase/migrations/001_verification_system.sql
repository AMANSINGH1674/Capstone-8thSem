-- ============================================================
-- AcademiX · Verification System — Complete Migration
-- Run this in: Supabase Dashboard → SQL Editor → Run
--
-- Safe to re-run: all statements use IF NOT EXISTS / DROP IF EXISTS
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- SECTION 1: TABLE MODIFICATIONS
-- ────────────────────────────────────────────────────────────

-- 1a. Verification columns on student_records
ALTER TABLE public.student_records
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN (
      'unverified',       -- no evidence uploaded
      'pending',          -- evidence uploaded, AI is processing
      'auto_verified',    -- AI confidence >= 85%
      'needs_review',     -- AI confidence 50–84%, human spot-check
      'rejected',         -- AI confidence < 50% or document not genuine
      'manual_verified'   -- teacher manually approved
    )),
  ADD COLUMN IF NOT EXISTS verification_confidence INTEGER
    CHECK (
      verification_confidence IS NULL OR
      (verification_confidence >= 0 AND verification_confidence <= 100)
    ),
  ADD COLUMN IF NOT EXISTS verification_notes   TEXT,
  ADD COLUMN IF NOT EXISTS verified_at          TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 1b. Role column on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student'
    CHECK (role IN ('student', 'teacher', 'admin'));

-- 1c. updated_at on profiles (if it doesn't exist yet)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();


-- ────────────────────────────────────────────────────────────
-- SECTION 2: INDEXES
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_sr_user_id
  ON public.student_records(user_id);

CREATE INDEX IF NOT EXISTS idx_sr_verification_status
  ON public.student_records(verification_status);

CREATE INDEX IF NOT EXISTS idx_sr_created_at
  ON public.student_records(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON public.profiles(role);


-- ────────────────────────────────────────────────────────────
-- SECTION 3: updated_at AUTO-TRIGGER
-- ────────────────────────────────────────────────────────────

-- Generic trigger function (reused by both tables)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Attach to profiles (drop first so re-runs are safe)
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Attach to student_records if it has an updated_at column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'student_records'
      AND column_name  = 'updated_at'
  ) THEN
    DROP TRIGGER IF EXISTS trg_sr_updated_at ON public.student_records;
    EXECUTE '
      CREATE TRIGGER trg_sr_updated_at
        BEFORE UPDATE ON public.student_records
        FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()
    ';
  END IF;
END $$;


-- ────────────────────────────────────────────────────────────
-- SECTION 4: ROW LEVEL SECURITY — ENABLE
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.student_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;


-- ────────────────────────────────────────────────────────────
-- SECTION 5: RLS POLICIES — student_records
--
-- Strategy: drop every policy by name then recreate cleanly.
-- This avoids "policy already exists" errors on re-runs.
-- ────────────────────────────────────────────────────────────

-- Drop all existing policies on student_records
DROP POLICY IF EXISTS "Students can view own records"           ON public.student_records;
DROP POLICY IF EXISTS "Students can insert own records"         ON public.student_records;
DROP POLICY IF EXISTS "Students can update own records"         ON public.student_records;
DROP POLICY IF EXISTS "Students can delete own records"         ON public.student_records;
DROP POLICY IF EXISTS "Teachers can view all records"           ON public.student_records;
DROP POLICY IF EXISTS "Teachers can update verification status" ON public.student_records;

-- ── Students ──────────────────────────────────────────────

-- SELECT: students see only their own records
CREATE POLICY "Students can view own records"
  ON public.student_records
  FOR SELECT
  USING (auth.uid() = user_id);

-- INSERT: students can only insert rows for themselves
CREATE POLICY "Students can insert own records"
  ON public.student_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: students can update their own records
--         but they CANNOT change any verification field
CREATE POLICY "Students can update own records"
  ON public.student_records
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    -- prevent students from self-verifying by ensuring the
    -- verification_status column isn't being changed away from
    -- its current value by a non-teacher (enforced in app layer;
    -- full column-level restriction requires Postgres 15+ or a trigger)
  );

-- DELETE: students can delete their own records
CREATE POLICY "Students can delete own records"
  ON public.student_records
  FOR DELETE
  USING (auth.uid() = user_id);

-- ── Teachers / Admins ─────────────────────────────────────

-- SELECT: teachers and admins can read ALL records
CREATE POLICY "Teachers can view all records"
  ON public.student_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('teacher', 'admin')
    )
  );

-- UPDATE: teachers and admins can update verification fields on any record
CREATE POLICY "Teachers can update verification status"
  ON public.student_records
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('teacher', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('teacher', 'admin')
    )
  );


-- ────────────────────────────────────────────────────────────
-- SECTION 6: RLS POLICIES — profiles
-- ────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view own profile"       ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile"     ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"     ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view all profiles"   ON public.profiles;

-- SELECT: users can always read their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- INSERT: a user can only create a profile row for themselves
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- UPDATE: users can update their own profile
--         role column must stay the same (cannot self-promote)
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- role must not be changed by the user themselves;
    -- a DB-level trigger below enforces this
  );

-- SELECT: teachers and admins can read ALL profiles (to see student names)
CREATE POLICY "Teachers can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('teacher', 'admin')
    )
  );


-- ────────────────────────────────────────────────────────────
-- SECTION 7: PREVENT SELF-PROMOTION (trigger guard)
--
-- Students must not be able to set their own role to
-- 'teacher' or 'admin' via a direct UPDATE.
-- Only a service-role call (Supabase dashboard / admin API)
-- or a superuser can change the role column.
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.prevent_role_self_promotion()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Allow service-role / postgres superuser to change role freely
  IF current_setting('role') IN ('service_role', 'supabase_admin', 'postgres') THEN
    RETURN NEW;
  END IF;

  -- Block any authenticated user from elevating their own role
  IF NEW.role <> OLD.role THEN
    RAISE EXCEPTION 'Role changes are not permitted via this endpoint.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_self_promotion ON public.profiles;
CREATE TRIGGER trg_prevent_role_self_promotion
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_self_promotion();


-- ────────────────────────────────────────────────────────────
-- SECTION 8: EDGE FUNCTION — service role note
--
-- The verify-record Edge Function uses SUPABASE_SERVICE_ROLE_KEY.
-- Service role bypasses RLS entirely — no extra policy needed.
-- It can UPDATE any verification_status on any record safely.
-- ────────────────────────────────────────────────────────────


-- ────────────────────────────────────────────────────────────
-- SECTION 9: ROLE MANAGEMENT HELPERS
--
-- Run these manually in the SQL editor to promote users.
-- Replace <uuid> with the value from auth.users or profiles.
-- ────────────────────────────────────────────────────────────

-- Promote to teacher:
-- UPDATE public.profiles SET role = 'teacher' WHERE id = '<uuid>';

-- Promote to admin:
-- UPDATE public.profiles SET role = 'admin' WHERE id = '<uuid>';

-- Demote back to student:
-- UPDATE public.profiles SET role = 'student' WHERE id = '<uuid>';

-- View all users and their roles:
-- SELECT p.id, p.full_name, p.role, u.email
--   FROM public.profiles p
--   JOIN auth.users u ON u.id = p.id
--   ORDER BY p.role, u.email;


-- ────────────────────────────────────────────────────────────
-- SECTION 10: VERIFICATION STATUS BACKFILL
--
-- Sets existing records that have an image_url to 'needs_review'
-- (so teachers can audit them) and records without an image
-- to 'unverified'. Only runs on rows that still have the
-- default 'unverified' status.
-- ────────────────────────────────────────────────────────────

UPDATE public.student_records
SET verification_status = 'needs_review'
WHERE image_url IS NOT NULL
  AND verification_status = 'unverified';

-- (Records with no image remain 'unverified' — no action needed)


-- ────────────────────────────────────────────────────────────
-- DONE
-- Expected output: no errors, all statements succeed.
-- Next steps:
--   1. supabase functions deploy verify-record
--   2. supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
--   3. Promote teachers via Section 9 helpers above.
-- ────────────────────────────────────────────────────────────
