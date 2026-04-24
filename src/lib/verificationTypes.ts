export type VerificationStatus =
  | 'unverified'
  | 'pending'
  | 'auto_verified'
  | 'needs_review'
  | 'rejected'
  | 'manual_verified';

export type UserRole = 'student' | 'teacher' | 'admin';

export interface VerificationMeta {
  verification_status: VerificationStatus;
  verification_confidence: number | null;
  verification_notes: string | null;
  verified_at: string | null;
  verified_by: string | null;
}

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  unverified: 'Unverified',
  pending: 'Verifying…',
  auto_verified: 'Verified',
  needs_review: 'Under Review',
  rejected: 'Rejected',
  manual_verified: 'Verified',
};

export const VERIFICATION_DESCRIPTION: Record<VerificationStatus, string> = {
  unverified: 'No evidence document uploaded.',
  pending: 'AI is analysing the uploaded document.',
  auto_verified: 'Automatically verified by AI with high confidence.',
  needs_review: 'Flagged for human spot-check.',
  rejected: 'Document did not pass automated verification.',
  manual_verified: 'Manually verified by a teacher.',
};
