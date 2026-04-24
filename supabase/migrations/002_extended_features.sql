-- ============================================================
-- AcademiX · Extended Features — Migration 002
-- Safe to re-run: uses IF NOT EXISTS / DROP IF EXISTS
-- Run after: 001_verification_system.sql
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- SECTION 1: EXTENDED PROFILE FIELDS
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS department        TEXT,
  ADD COLUMN IF NOT EXISTS year_of_study     INTEGER
    CHECK (year_of_study IS NULL OR (year_of_study BETWEEN 1 AND 6)),
  ADD COLUMN IF NOT EXISTS roll_number       TEXT,
  ADD COLUMN IF NOT EXISTS phone             TEXT,
  ADD COLUMN IF NOT EXISTS is_portfolio_public BOOLEAN DEFAULT false;


-- ────────────────────────────────────────────────────────────
-- SECTION 2: EXTENDED STUDENT_RECORDS FIELDS
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.student_records
  ADD COLUMN IF NOT EXISTS institution_name  TEXT,
  ADD COLUMN IF NOT EXISTS is_duplicate_flag BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS engagement_points INTEGER DEFAULT 0;


-- ────────────────────────────────────────────────────────────
-- SECTION 3: NOTIFICATIONS TABLE
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.notifications (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL CHECK (type IN (
               'verification_update', 'record_approved',
               'record_rejected', 'system'
             )),
  title      TEXT        NOT NULL,
  message    TEXT        NOT NULL,
  record_id  UUID        REFERENCES public.student_records(id) ON DELETE SET NULL,
  is_read    BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON public.notifications(created_at DESC);


-- ────────────────────────────────────────────────────────────
-- SECTION 4: RLS — notifications
-- ────────────────────────────────────────────────────────────

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users view own notifications"   ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;

CREATE POLICY "Users view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role (used by triggers and edge functions) can insert
-- No INSERT policy needed for regular users.


-- ────────────────────────────────────────────────────────────
-- SECTION 5: AUTO-NOTIFY TRIGGER
-- Creates a notification whenever verification_status changes
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.notify_on_verification_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_title   TEXT;
  v_message TEXT;
  v_type    TEXT;
BEGIN
  IF NEW.verification_status = OLD.verification_status THEN
    RETURN NEW;
  END IF;

  CASE NEW.verification_status
    WHEN 'auto_verified' THEN
      v_type    := 'record_approved';
      v_title   := 'Record Verified';
      v_message := 'Your record "' || NEW.title || '" was automatically verified'
                   || CASE WHEN NEW.verification_confidence IS NOT NULL
                        THEN ' with ' || NEW.verification_confidence || '% confidence.'
                        ELSE '.' END;
    WHEN 'manual_verified' THEN
      v_type    := 'record_approved';
      v_title   := 'Record Approved';
      v_message := 'Your record "' || NEW.title || '" was manually approved by faculty.';
    WHEN 'rejected' THEN
      v_type    := 'record_rejected';
      v_title   := 'Record Rejected';
      v_message := 'Your record "' || NEW.title || '" was rejected. '
                   || COALESCE(NEW.verification_notes, 'Please check the evidence and resubmit.');
    WHEN 'needs_review' THEN
      v_type    := 'verification_update';
      v_title   := 'Under Review';
      v_message := 'Your record "' || NEW.title || '" has been flagged for manual faculty review.';
    ELSE
      RETURN NEW;
  END CASE;

  INSERT INTO public.notifications (user_id, type, title, message, record_id)
  VALUES (NEW.user_id, v_type, v_title, v_message, NEW.id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_verification_change ON public.student_records;
CREATE TRIGGER trg_notify_verification_change
  AFTER UPDATE OF verification_status ON public.student_records
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_verification_change();


-- ────────────────────────────────────────────────────────────
-- SECTION 6: INDEXES FOR NEW FIELDS
-- ────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_profiles_department
  ON public.profiles(department);

CREATE INDEX IF NOT EXISTS idx_sr_duplicate_flag
  ON public.student_records(is_duplicate_flag) WHERE is_duplicate_flag = true;


-- ────────────────────────────────────────────────────────────
-- SECTION 7: ADMIN HELPER VIEWS
-- Read-only views for admin analytics (service role / admin use)
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW public.admin_student_summary AS
SELECT
  p.id,
  p.full_name,
  p.department,
  p.roll_number,
  p.year_of_study,
  p.role,
  p.is_portfolio_public,
  COUNT(sr.id)                                                         AS total_records,
  COUNT(CASE WHEN sr.verification_status IN
    ('auto_verified','manual_verified') THEN 1 END)                   AS verified_records,
  COUNT(CASE WHEN sr.verification_status = 'needs_review'   THEN 1 END) AS needs_review,
  COUNT(CASE WHEN sr.verification_status = 'rejected'       THEN 1 END) AS rejected_records,
  MAX(sr.created_at)                                                   AS last_activity
FROM public.profiles p
LEFT JOIN public.student_records sr ON sr.user_id = p.id
GROUP BY p.id, p.full_name, p.department, p.roll_number,
         p.year_of_study, p.role, p.is_portfolio_public;


-- ────────────────────────────────────────────────────────────
-- DONE
-- Next steps:
--   1. Run: supabase functions deploy set-user-role
--   2. Run: supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
--   3. Add SUPABASE_SERVICE_ROLE_KEY to edge function env
-- ────────────────────────────────────────────────────────────
