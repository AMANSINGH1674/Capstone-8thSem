import { describe, it, expect } from 'vitest';
import { recordSchema, CATEGORIES } from '@/lib/recordSchema';

describe('recordSchema', () => {
  const validInput = {
    title: 'AWS Cloud Practitioner',
    category: 'Certifications',
    date: '2024-06-15',
    description: 'Passed with 850/1000',
  };

  it('accepts a fully valid record', () => {
    const result = recordSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts a record with empty description', () => {
    const result = recordSchema.safeParse({ ...validInput, description: '' });
    expect(result.success).toBe(true);
  });

  it('accepts a record without description field', () => {
    const { description: _d, ...withoutDesc } = validInput;
    const result = recordSchema.safeParse(withoutDesc);
    expect(result.success).toBe(true);
  });

  it('rejects empty title', () => {
    const result = recordSchema.safeParse({ ...validInput, title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects title over 100 characters', () => {
    const result = recordSchema.safeParse({ ...validInput, title: 'A'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('rejects invalid category', () => {
    const result = recordSchema.safeParse({ ...validInput, category: 'Invalid Category' });
    expect(result.success).toBe(false);
  });

  it('accepts all valid categories', () => {
    for (const cat of CATEGORIES) {
      const result = recordSchema.safeParse({ ...validInput, category: cat });
      expect(result.success).toBe(true);
    }
  });

  it('rejects empty date', () => {
    const result = recordSchema.safeParse({ ...validInput, date: '' });
    expect(result.success).toBe(false);
  });

  it('rejects description over 500 characters', () => {
    const result = recordSchema.safeParse({
      ...validInput,
      description: 'D'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});
