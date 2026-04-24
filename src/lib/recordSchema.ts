import { z } from 'zod';

export const CATEGORIES = [
  'Conferences & Workshops',
  'Certifications',
  'Club Activities',
  'Competitions',
  'Academic Excellence',
  'Internships',
  'Community Service',
  'Leadership Roles',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const recordSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be under 100 characters'),
  category: z.enum(CATEGORIES),
  date: z.string().min(1, 'Date is required'),
  description: z
    .string()
    .max(500, 'Description must be under 500 characters')
    .optional()
    .or(z.literal('')),
  institution_name: z
    .string()
    .max(150, 'Institution name must be under 150 characters')
    .optional()
    .or(z.literal('')),
});

export type RecordFormData = z.infer<typeof recordSchema>;

export const CATEGORY_COLORS: Record<Category, string> = {
  'Conferences & Workshops': 'bg-info/10 text-info border-info/20',
  Certifications: 'bg-warning/10 text-warning border-warning/20',
  'Club Activities': 'bg-accent/10 text-accent border-accent/20',
  Competitions: 'bg-destructive/10 text-destructive border-destructive/20',
  'Academic Excellence': 'bg-success/10 text-success border-success/20',
  Internships: 'bg-secondary/20 text-secondary-foreground border-secondary/30',
  'Community Service': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'Leadership Roles': 'bg-orange-500/10 text-orange-600 border-orange-500/20',
};

export const CATEGORY_CHART_COLORS: Record<Category, string> = {
  'Conferences & Workshops': 'hsl(var(--info))',
  Certifications: 'hsl(var(--warning))',
  'Club Activities': 'hsl(var(--accent))',
  Competitions: 'hsl(var(--destructive))',
  'Academic Excellence': 'hsl(var(--success))',
  Internships: 'hsl(215 25% 27%)',
  'Community Service': 'hsl(270 60% 55%)',
  'Leadership Roles': 'hsl(25 95% 53%)',
};

export const CATEGORY_SHORT: Record<Category, string> = {
  'Conferences & Workshops': 'Conf.',
  Certifications: 'Certs',
  'Club Activities': 'Clubs',
  Competitions: 'Comps',
  'Academic Excellence': 'Academic',
  Internships: 'Intern.',
  'Community Service': 'Service',
  'Leadership Roles': 'Lead.',
};
