/**
 * Report Generation Utilities
 *
 * Produces NAAC/NIRF-ready CSV exports and summary reports for accreditation.
 * All generation is client-side — no server round-trip needed.
 *
 * NAAC = National Assessment and Accreditation Council (India)
 * NIRF = National Institutional Ranking Framework (India)
 */

import { format } from 'date-fns';
import type { StudentRecord } from './recordUtils';
import { calculateEngagementScore } from './engagementScore';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ProfileRow {
  id:               string;
  full_name:        string | null;
  department:       string | null;
  roll_number:      string | null;
  year_of_study:    number | null;
  role:             string;
  is_portfolio_public: boolean;
  total_records?:   number;
  verified_records?: number;
}

export interface StudentWithRecords extends ProfileRow {
  records: (StudentRecord & { institution_name?: string | null })[];
}

// ── CSV helpers ───────────────────────────────────────────────────────────────

function esc(val: string | number | null | undefined): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(esc).join(',');
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return 'N/A';
  try { return format(new Date(d), 'dd/MM/yyyy'); } catch { return d; }
}

// ── NAAC Detailed Activity Report ─────────────────────────────────────────────

export function generateNAACDetailedCSV(students: StudentWithRecords[]): string {
  const header = csvRow([
    'S.No.', 'Student Name', 'Roll Number', 'Department', 'Year of Study',
    'Activity Category', 'Activity Title', 'Activity Date',
    'Organising Institution', 'Verification Status',
    'AI Confidence (%)', 'Verified On',
  ]);

  const rows: string[] = [];
  let sno = 1;

  for (const student of students) {
    for (const rec of student.records) {
      rows.push(csvRow([
        sno++,
        student.full_name,
        student.roll_number,
        student.department,
        student.year_of_study,
        rec.category,
        rec.title,
        fmtDate(rec.date),
        rec.institution_name,
        rec.verification_status ?? 'unverified',
        rec.verification_confidence ?? 'N/A',
        fmtDate(rec.verified_at),
      ]));
    }
  }

  return [header, ...rows].join('\n');
}

// ── NIRF Department-wise Participation Summary ─────────────────────────────────

export function generateNIRFSummaryCSV(students: StudentWithRecords[]): string {
  const deptMap: Record<string, {
    students: Set<string>;
    totalRecords: number;
    verifiedRecords: number;
    byCategory: Record<string, number>;
  }> = {};

  for (const student of students) {
    const dept = student.department ?? 'Unassigned';
    if (!deptMap[dept]) {
      deptMap[dept] = {
        students:        new Set(),
        totalRecords:    0,
        verifiedRecords: 0,
        byCategory:      {},
      };
    }
    deptMap[dept].students.add(student.id);

    for (const rec of student.records) {
      deptMap[dept].totalRecords++;
      if (['auto_verified', 'manual_verified'].includes(rec.verification_status ?? '')) {
        deptMap[dept].verifiedRecords++;
      }
      deptMap[dept].byCategory[rec.category] =
        (deptMap[dept].byCategory[rec.category] ?? 0) + 1;
    }
  }

  const header = csvRow([
    'Department', 'Total Students', 'Active Students',
    'Total Records', 'Verified Records', 'Verification Rate (%)',
    'Top Activity Category',
  ]);

  const rows = Object.entries(deptMap).map(([dept, stats]) => {
    const verRate = stats.totalRecords > 0
      ? Math.round((stats.verifiedRecords / stats.totalRecords) * 100)
      : 0;
    const topCat = Object.entries(stats.byCategory)
      .sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'N/A';

    return csvRow([
      dept,
      stats.students.size,
      stats.students.size,  // all are "active" if they have records
      stats.totalRecords,
      stats.verifiedRecords,
      verRate,
      topCat,
    ]);
  });

  return [header, ...rows].join('\n');
}

// ── Engagement Scores Report ───────────────────────────────────────────────────

export function generateEngagementScoresCSV(students: StudentWithRecords[]): string {
  const header = csvRow([
    'Student Name', 'Roll Number', 'Department', 'Year of Study',
    'Engagement Score (0-100)', 'Grade', 'Verified Records',
    'Total Records', 'Unique Categories', 'Verification Rate (%)',
  ]);

  const rows = students.map((student) => {
    const score = calculateEngagementScore(student.records);
    return csvRow([
      student.full_name,
      student.roll_number,
      student.department,
      student.year_of_study,
      score.totalScore,
      score.grade,
      score.verifiedCount,
      score.totalCount,
      score.uniqueCategories,
      score.verificationRate,
    ]);
  });

  return [header, ...rows].join('\n');
}

// ── Download helper ───────────────────────────────────────────────────────────

export function downloadCSV(content: string, filename: string): void {
  const bom  = '\uFEFF'; // UTF-8 BOM so Excel opens it correctly
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function reportFilename(type: string): string {
  const stamp = format(new Date(), 'yyyyMMdd_HHmm');
  return `AcademiX_${type}_${stamp}.csv`;
}
