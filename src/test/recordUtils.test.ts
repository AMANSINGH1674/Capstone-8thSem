import { describe, it, expect } from 'vitest';
import {
  filterRecords,
  formatRecordDate,
  categoryCount,
  type StudentRecord,
} from '@/lib/recordUtils';

const makeRecord = (overrides: Partial<StudentRecord> = {}): StudentRecord => ({
  id: '1',
  title: 'Test Achievement',
  category: 'Certifications',
  description: 'A useful description',
  date: '2024-06-15',
  ...overrides,
});

describe('filterRecords', () => {
  const records: StudentRecord[] = [
    makeRecord({ id: '1', title: 'AWS Certification', category: 'Certifications' }),
    makeRecord({ id: '2', title: 'Hackathon Win', category: 'Competitions' }),
    makeRecord({
      id: '3',
      title: 'Tech Club President',
      category: 'Leadership Roles',
      description: 'Led the technical committee',
    }),
  ];

  it('returns all records when search and category are empty', () => {
    expect(filterRecords(records, '', '')).toHaveLength(3);
  });

  it('filters by title search (case-insensitive)', () => {
    const result = filterRecords(records, 'aws', '');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('AWS Certification');
  });

  it('filters by description search', () => {
    const result = filterRecords(records, 'technical committee', '');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('filters by category', () => {
    const result = filterRecords(records, '', 'Competitions');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('combines search and category filter', () => {
    const result = filterRecords(records, 'club', 'Leadership Roles');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('returns empty array when no matches', () => {
    expect(filterRecords(records, 'xyz123', '')).toHaveLength(0);
  });

  it('handles records with null description', () => {
    const withNull = [makeRecord({ id: '4', description: null })];
    expect(() => filterRecords(withNull, 'desc', '')).not.toThrow();
  });
});

describe('formatRecordDate', () => {
  it('formats ISO date string to readable format', () => {
    const result = formatRecordDate('2024-06-15');
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2024/);
  });

  it('returns the input unchanged for invalid date strings', () => {
    const invalid = 'not-a-date';
    expect(formatRecordDate(invalid)).toBe(invalid);
  });
});

describe('categoryCount', () => {
  const records: StudentRecord[] = [
    makeRecord({ category: 'Certifications' }),
    makeRecord({ category: 'Certifications' }),
    makeRecord({ category: 'Competitions' }),
  ];

  it('counts records matching category', () => {
    expect(categoryCount(records, 'Certifications')).toBe(2);
  });

  it('returns 0 for a category with no records', () => {
    expect(categoryCount(records, 'Leadership Roles')).toBe(0);
  });
});
