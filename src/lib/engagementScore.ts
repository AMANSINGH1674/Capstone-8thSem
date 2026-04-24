/**
 * Student Engagement Score Algorithm
 *
 * Produces a 0-100 score and letter grade for a student's verified activity portfolio.
 * Three components:
 *   1. Base score   — weighted sum of verified records (capped at 3 per category)
 *   2. Diversity    — bonus for breadth across categories
 *   3. Verification rate — multiplier penalising low evidence quality
 *
 * This is a novel contribution for the research paper: a quantifiable holistic
 * student engagement index beyond GPA.
 */

import type { StudentRecord } from './recordUtils';
import type { VerificationStatus } from './verificationTypes';

// ── Category weights (0-10, higher = more career/holistic impact) ───────────

export const CATEGORY_WEIGHTS: Record<string, number> = {
  'Internships':              10,
  'Leadership Roles':         10,
  'Academic Excellence':       9,
  'Competitions':              8,
  'Certifications':            7,
  'Conferences & Workshops':   6,
  'Community Service':         5,
  'Club Activities':           4,
};

const VERIFIED_STATUSES: VerificationStatus[] = ['auto_verified', 'manual_verified'];
const MAX_RECORDS_PER_CATEGORY = 3;   // diminishing returns beyond 3 records/category
const MAX_DIVERSITY_BONUS      = 40;  // +5 per unique verified category
const DIVERSITY_POINTS_EACH    = 5;
// Theoretical max raw = (10+10+9+8+7+6+5+4) * 3 + 40 = 177 + 40 = 217
const MAX_RAW_SCORE = 217;

// ── Types ─────────────────────────────────────────────────────────────────────

export type EngagementGrade = 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D';

export interface EngagementBreakdown {
  totalScore:        number;        // 0-100 normalised
  baseScore:         number;        // raw weighted sum
  diversityBonus:    number;        // 0-40
  verificationRate:  number;        // 0-100 %
  verifiedCount:     number;
  totalCount:        number;
  uniqueCategories:  number;        // categories with ≥1 verified record
  grade:             EngagementGrade;
  topCategory:       string | null; // category with most verified records
}

// ── Main export ───────────────────────────────────────────────────────────────

export function calculateEngagementScore(
  records: StudentRecord[],
): EngagementBreakdown {
  const empty: EngagementBreakdown = {
    totalScore: 0, baseScore: 0, diversityBonus: 0,
    verificationRate: 0, verifiedCount: 0, totalCount: 0,
    uniqueCategories: 0, grade: 'D', topCategory: null,
  };

  if (records.length === 0) return empty;

  const verified = records.filter((r) =>
    VERIFIED_STATUSES.includes((r.verification_status ?? 'unverified') as VerificationStatus),
  );

  // ── 1. Base score ─────────────────────────────────────────────────────────
  const categoryContrib: Record<string, number> = {};
  const categoryCounts:  Record<string, number> = {};

  for (const rec of verified) {
    const weight = CATEGORY_WEIGHTS[rec.category] ?? 4;
    const used   = categoryCounts[rec.category] ?? 0;
    if (used < MAX_RECORDS_PER_CATEGORY) {
      categoryContrib[rec.category] = (categoryContrib[rec.category] ?? 0) + weight;
      categoryCounts[rec.category]  = used + 1;
    }
  }

  const baseScore = Object.values(categoryContrib).reduce((s, v) => s + v, 0);

  // ── 2. Diversity bonus ────────────────────────────────────────────────────
  const uniqueCategories = Object.keys(categoryContrib).length;
  const diversityBonus   = Math.min(uniqueCategories * DIVERSITY_POINTS_EACH, MAX_DIVERSITY_BONUS);

  // ── 3. Verification rate multiplier (0.2 → 1.0) ──────────────────────────
  const verificationRate = verified.length / records.length;
  const vrMultiplier     = 0.2 + verificationRate * 0.8;

  // ── 4. Normalise to 0-100 ─────────────────────────────────────────────────
  const rawScore   = (baseScore + diversityBonus) * vrMultiplier;
  const totalScore = Math.min(100, Math.round((rawScore / MAX_RAW_SCORE) * 100));

  // ── Grade boundaries ──────────────────────────────────────────────────────
  const grade: EngagementGrade =
    totalScore >= 90 ? 'A+' :
    totalScore >= 75 ? 'A'  :
    totalScore >= 60 ? 'B+' :
    totalScore >= 45 ? 'B'  :
    totalScore >= 30 ? 'C'  : 'D';

  // ── Top category ──────────────────────────────────────────────────────────
  const topCategory = Object.keys(categoryCounts).reduce<string | null>(
    (best, cat) =>
      best === null || (categoryCounts[cat] ?? 0) > (categoryCounts[best] ?? 0)
        ? cat : best,
    null,
  );

  return {
    totalScore,
    baseScore:        Math.round(baseScore),
    diversityBonus,
    verificationRate: Math.round(verificationRate * 100),
    verifiedCount:    verified.length,
    totalCount:       records.length,
    uniqueCategories,
    grade,
    topCategory,
  };
}

// ── Grade color helper (for UI) ───────────────────────────────────────────────

export const GRADE_COLORS: Record<EngagementGrade, string> = {
  'A+': 'text-emerald-600',
  'A':  'text-green-600',
  'B+': 'text-teal-600',
  'B':  'text-blue-600',
  'C':  'text-amber-600',
  'D':  'text-red-500',
};

export const GRADE_BG: Record<EngagementGrade, string> = {
  'A+': 'bg-emerald-50 border-emerald-200',
  'A':  'bg-green-50  border-green-200',
  'B+': 'bg-teal-50   border-teal-200',
  'B':  'bg-blue-50   border-blue-200',
  'C':  'bg-amber-50  border-amber-200',
  'D':  'bg-red-50    border-red-200',
};
