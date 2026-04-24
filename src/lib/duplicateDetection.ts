/**
 * Semantic Duplicate Detection
 *
 * Detects near-duplicate student record submissions using:
 *   - Jaccard similarity on title word sets (ignores stopwords)
 *   - Same category constraint
 *   - Date proximity window (±60 days)
 *
 * Thresholds:
 *   ≥ 70% title similarity + same category + date within 60 days → duplicate
 *   ≥ 50% title similarity + same category + date within 60 days → potential duplicate (warn)
 *
 * Novel contribution for the research paper: semantic deduplication
 * vs. naive exact-match used by all prior systems.
 */

import type { StudentRecord } from './recordUtils';

// Common English stopwords to strip before comparison
const STOPWORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','as','is','was','are','were','been','be','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall',
  'i','my','we','our','you','your','he','his','she','her','it','its','they','their',
  'this','that','these','those',
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

function tokenise(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
  );
}

function jaccardSimilarity(a: string, b: string): number {
  const setA = tokenise(a);
  const setB = tokenise(b);
  if (setA.size === 0 && setB.size === 0) return 1;
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = [...setA].filter((w) => setB.has(w)).length;
  const union        = new Set([...setA, ...setB]).size;
  return intersection / union;
}

function daysBetween(d1: string, d2: string): number {
  const ms = Math.abs(new Date(d1).getTime() - new Date(d2).getTime());
  return ms / (1000 * 60 * 60 * 24);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type DuplicateSeverity = 'duplicate' | 'warning' | 'clear';

export interface DuplicateCheckResult {
  severity:       DuplicateSeverity;
  similarity:     number;        // 0-100 %
  matchedRecord?: StudentRecord;
  reason?:        string;
}

// ── Main export ───────────────────────────────────────────────────────────────

export function checkForDuplicate(
  candidate: { title: string; category: string; date: string },
  existingRecords: StudentRecord[],
): DuplicateCheckResult {
  const sameCategory = existingRecords.filter(
    (r) => r.category === candidate.category,
  );

  let bestSimilarity = 0;
  let bestMatch: StudentRecord | undefined;

  for (const existing of sameCategory) {
    const sim    = jaccardSimilarity(candidate.title, existing.title);
    const days   = daysBetween(candidate.date, existing.date);
    const nearby = days <= 60;

    if (nearby && sim > bestSimilarity) {
      bestSimilarity = sim;
      bestMatch      = existing;
    }
  }

  const pct = Math.round(bestSimilarity * 100);

  if (bestSimilarity >= 0.7 && bestMatch) {
    return {
      severity:      'duplicate',
      similarity:    pct,
      matchedRecord: bestMatch,
      reason: `Very similar to "${bestMatch.title}" (${pct}% match, same category, date within 60 days).`,
    };
  }

  if (bestSimilarity >= 0.5 && bestMatch) {
    return {
      severity:      'warning',
      similarity:    pct,
      matchedRecord: bestMatch,
      reason: `Possibly similar to "${bestMatch.title}" (${pct}% match). Please confirm this is a different activity.`,
    };
  }

  return { severity: 'clear', similarity: 0 };
}
