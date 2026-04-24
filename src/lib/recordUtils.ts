import type { VerificationStatus } from './verificationTypes';

export interface StudentRecord {
  id: string;
  title: string;
  category: string;
  description?: string | null;
  date: string;
  image_url?: string | null;
  created_at?: string;
  user_id?: string;
  // verification fields (migration 001)
  verification_status?: VerificationStatus;
  verification_confidence?: number | null;
  verification_notes?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
  // extended fields (migration 002)
  institution_name?: string | null;
  is_duplicate_flag?: boolean;
  engagement_points?: number;
}

export function filterRecords(
  records: StudentRecord[],
  search: string,
  category: string,
): StudentRecord[] {
  const q = search.trim().toLowerCase();
  return records.filter((r) => {
    const matchesSearch =
      !q ||
      r.title.toLowerCase().includes(q) ||
      (r.description ?? '').toLowerCase().includes(q);
    const matchesCategory = !category || r.category === category;
    return matchesSearch && matchesCategory;
  });
}

export function formatRecordDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function categoryCount(
  records: StudentRecord[],
  category: string,
): number {
  return records.filter((r) => r.category === category).length;
}
