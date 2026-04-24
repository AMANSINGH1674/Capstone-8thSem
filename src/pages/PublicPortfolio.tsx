/**
 * Public Portfolio Page — /portfolio/:userId
 *
 * Shareable, read-only view of a student's verified achievement record.
 * Only visible when student has enabled portfolio sharing in Profile Settings.
 * Serves as a digital credential for job applications, scholarships, and admissions.
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  GraduationCap, Award, Calendar, Building2, ShieldCheck,
  Share2, Copy, ExternalLink, CheckCircle2, Loader2,
  Lock, TrendingUp, Star, Users, BookOpen, Zap, Trophy, Printer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { calculateEngagementScore, GRADE_COLORS, GRADE_BG } from '@/lib/engagementScore';
import { CATEGORY_CHART_COLORS } from '@/lib/recordSchema';
import type { StudentRecord } from '@/lib/recordUtils';
import type { VerificationStatus } from '@/lib/verificationTypes';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PublicProfile {
  id:                  string;
  full_name:           string | null;
  department:          string | null;
  year_of_study:       number | null;
  roll_number:         string | null;
  bio:                 string | null;
  avatar_url:          string | null;
  website:             string | null;
  is_portfolio_public: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const VERIFIED: VerificationStatus[] = ['auto_verified', 'manual_verified'];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Conferences & Workshops': BookOpen,
  'Certifications':          Award,
  'Club Activities':         Users,
  'Competitions':            Trophy,
  'Academic Excellence':     Star,
  'Internships':             Zap,
  'Community Service':       Users,
  'Leadership Roles':        TrendingUp,
};

function fmtDate(d: string) {
  try { return format(new Date(d), 'MMM yyyy'); } catch { return d; }
}

function VerifiedBadge({ status }: { status: VerificationStatus }) {
  const verified = VERIFIED.includes(status);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
      verified
        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
        : 'bg-amber-50 text-amber-700 border border-amber-200'
    }`}>
      {verified ? <ShieldCheck className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
      {verified ? 'Verified' : 'Pending'}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PublicPortfolio() {
  const { userId } = useParams<{ userId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['public_portfolio', userId],
    queryFn: async () => {
      const [profileRes, recordsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, department, year_of_study, roll_number, bio, avatar_url, website, is_portfolio_public')
          .eq('id', userId!)
          .single(),
        supabase
          .from('student_records')
          .select('*')
          .eq('user_id', userId!)
          .in('verification_status', ['auto_verified', 'manual_verified'])
          .order('date', { ascending: false }),
      ]);

      if (profileRes.error) throw new Error('Profile not found');
      return {
        profile:  profileRes.data  as PublicProfile,
        records:  (recordsRes.data ?? []) as StudentRecord[],
      };
    },
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Portfolio link copied!');
  };

  // ── Loading ────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#16B98A]" />
      </div>
    );
  }

  // ── Error / not found ──────────────────────────────────────────────────────

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">Portfolio not found</h2>
        <p className="text-sm text-muted-foreground mt-1">This student portfolio doesn't exist or has been removed.</p>
        <Link to="/" className="mt-4">
          <Button variant="outline" size="sm">Back to Home</Button>
        </Link>
      </div>
    );
  }

  // ── Private portfolio ──────────────────────────────────────────────────────

  if (!data.profile.is_portfolio_public) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Lock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold">Private Portfolio</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">
          This student hasn't made their portfolio public yet.
        </p>
        <Link to="/" className="mt-4">
          <Button variant="outline" size="sm">Back to Home</Button>
        </Link>
      </div>
    );
  }

  const { profile, records } = data;
  const score = calculateEngagementScore(records);
  const initials = (profile.full_name ?? 'U')
    .split(' ').map((s) => s[0]).join('').toUpperCase().slice(0, 2);

  // Group records by category
  const byCategory: Record<string, StudentRecord[]> = {};
  for (const rec of records) {
    (byCategory[rec.category] ??= []).push(rec);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">

      {/* ── Header bar ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#16B98A]">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-sm text-[#0D1B3A]">AcademiX</span>
          </div>
          <div className="flex items-center gap-2 print:hidden">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={handleCopyLink}>
              <Copy className="h-3.5 w-3.5" />
              Copy Link
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" />
              Print / PDF
            </Button>
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Website
                </Button>
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        {/* ── Profile card ────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white border shadow-sm overflow-hidden">
          {/* Banner */}
          <div className="h-20 bg-gradient-to-r from-[#0D1B3A] to-[#1a3060]" />
          <div className="px-6 pb-6">
            {/* Avatar */}
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-[#16B98A] text-white text-2xl font-bold shadow-md overflow-hidden">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.full_name ?? ''} className="h-full w-full object-cover" />
                  : initials}
              </div>
              {/* Engagement score badge */}
              <div className={`rounded-xl border px-4 py-2 text-center ${GRADE_BG[score.grade]}`}>
                <p className={`text-2xl font-black ${GRADE_COLORS[score.grade]}`}>{score.totalScore}</p>
                <p className={`text-xs font-bold ${GRADE_COLORS[score.grade]}`}>Grade {score.grade}</p>
                <p className="text-[10px] text-muted-foreground">Engagement Score</p>
              </div>
            </div>

            {/* Info */}
            <h1 className="text-2xl font-bold text-[#0D1B3A]">{profile.full_name ?? 'Student'}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
              {profile.department && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" />
                  {profile.department}
                </span>
              )}
              {profile.year_of_study && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Year {profile.year_of_study}
                </span>
              )}
              {profile.roll_number && (
                <span className="font-mono text-xs bg-muted rounded px-2 py-0.5">
                  {profile.roll_number}
                </span>
              )}
            </div>
            {profile.bio && (
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
            )}
          </div>
        </div>

        {/* ── Engagement stats ─────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Verified Records', value: score.verifiedCount, icon: ShieldCheck, color: 'text-emerald-600' },
            { label: 'Categories',       value: score.uniqueCategories, icon: Award, color: 'text-blue-600' },
            { label: 'Verify Rate',      value: `${score.verificationRate}%`, icon: TrendingUp, color: 'text-violet-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl bg-white border shadow-sm p-4 text-center">
              <Icon className={`h-5 w-5 mx-auto mb-1 ${color}`} />
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* ── Verified records by category ──────────────────────────────── */}
        {records.length === 0 ? (
          <div className="rounded-2xl bg-white border shadow-sm p-8 text-center">
            <Award className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No verified records yet</p>
          </div>
        ) : (
          Object.entries(byCategory).map(([category, catRecords]) => {
            const Icon = CATEGORY_ICONS[category] ?? Award;
            const accent = CATEGORY_CHART_COLORS[category as keyof typeof CATEGORY_CHART_COLORS] ?? '#16B98A';
            return (
              <div key={category} className="rounded-2xl bg-white border shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3.5 border-b" style={{ borderLeftColor: accent, borderLeftWidth: 4 }}>
                  <Icon className="h-4.5 w-4.5 text-muted-foreground" />
                  <h2 className="font-semibold text-sm">{category}</h2>
                  <span className="ml-auto text-xs font-medium text-muted-foreground">
                    {catRecords.length} record{catRecords.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="divide-y">
                  {catRecords.map((rec) => (
                    <div key={rec.id} className="px-5 py-4 flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-snug">{rec.title}</p>
                        {rec.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rec.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {fmtDate(rec.date)}
                          </span>
                          {(rec as any).institution_name && (
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              {(rec as any).institution_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <VerifiedBadge status={(rec.verification_status ?? 'unverified') as VerificationStatus} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}

        {/* ── Footer ──────────────────────────────────────────────────── */}
        <div className="text-center py-4 border-t">
          <p className="text-xs text-muted-foreground">
            Verified digital portfolio powered by{' '}
            <span className="font-semibold text-[#16B98A]">AcademiX</span>
            {' '}· AI-verified records
          </p>
        </div>
      </main>
    </div>
  );
}
