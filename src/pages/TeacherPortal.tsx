import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  GraduationCap,
  LogOut,
  Search,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  Users,
  FileText,
  TrendingUp,
  ChevronDown,
  ExternalLink,
  CalendarDays,
  Filter,
  LayoutDashboard,
} from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VerificationBadge } from '@/components/VerificationBadge';
import { CATEGORIES } from '@/lib/recordSchema';
import { formatRecordDate } from '@/lib/recordUtils';
import type { VerificationStatus, UserRole } from '@/lib/verificationTypes';
import { DEMO_TEACHER_RECORDS } from '@/lib/demoData';

const PAGE_SIZE = 25;

// ── Types ─────────────────────────────────────────────────────────────────────

interface RecordWithStudent {
  id: string;
  title: string;
  category: string;
  date: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  user_id: string;
  verification_status: VerificationStatus;
  verification_confidence: number | null;
  verification_notes: string | null;
  verified_at: string | null;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    role: UserRole;
  } | null;
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function fetchAllRecords(): Promise<RecordWithStudent[]> {
  const { data, error } = await supabase
    .from('student_records')
    .select('*, profiles(full_name, avatar_url, role)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RecordWithStudent[];
}

async function updateVerification(
  id: string,
  status: VerificationStatus,
  verifiedBy: string,
): Promise<void> {
  const { error } = await supabase
    .from('student_records')
    .update({
      verification_status: status,
      verified_at: new Date().toISOString(),
      verified_by: verifiedBy,
      verification_notes:
        status === 'manual_verified'
          ? 'Manually verified by a teacher.'
          : status === 'rejected'
            ? 'Manually rejected by a teacher.'
            : undefined,
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Status filter options ─────────────────────────────────────────────────────

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: '__all__', label: 'All statuses' },
  { value: 'needs_review', label: 'Needs Review' },
  { value: 'pending', label: 'Verifying' },
  { value: 'auto_verified', label: 'Auto-verified' },
  { value: 'manual_verified', label: 'Manual-verified' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'unverified', label: 'Unverified' },
];

// ── KPI ───────────────────────────────────────────────────────────────────────

interface KpiProps {
  label: string;
  value: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  onClick?: () => void;
}

const Kpi = ({ label, value, icon: Icon, iconBg, iconColor, onClick }: KpiProps) => (
  <div
    onClick={onClick}
    className={`rounded-xl border bg-white p-5 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md hover:border-[#16B98A]/30 transition-all' : ''}`}
  >
    <div className="flex items-start justify-between mb-2">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${iconBg}`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
    </div>
    <p className="text-3xl font-bold text-slate-900 tabular-nums">{value}</p>
  </div>
);

// ── Component ─────────────────────────────────────────────────────────────────

const TeacherPortal = () => {
  const { user, role, loading, signOut, isDemo } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('__all__');
  const [categoryFilter, setCategoryFilter] = useState('__all__');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Redirect non-teachers
  useEffect(() => {
    if (loading) return;
    if (user && role !== 'student') return;
    if (user && role === 'student') { navigate('/dashboard'); return; }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/login');
    });
  }, [loading, user, role, navigate]);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['teacher_records'],
    queryFn: () => isDemo ? DEMO_TEACHER_RECORDS as RecordWithStudent[] : fetchAllRecords(),
    enabled: !!user && (role === 'teacher' || role === 'admin'),
    staleTime: 30_000,
  });

  // Realtime: re-fetch whenever any student_records row changes
  useEffect(() => {
    if (!user || isDemo || (role !== 'teacher' && role !== 'admin')) return;

    const channel = supabase
      .channel('teacher_records_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'student_records' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['teacher_records'] });
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, role, queryClient]);

  const verifyMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: VerificationStatus }) => {
      if (isDemo) {
        // In demo mode, update the local cache instead of calling Supabase
        queryClient.setQueryData<RecordWithStudent[]>(['teacher_records'], (old) =>
          (old ?? []).map((r) =>
            r.id === id
              ? {
                  ...r,
                  verification_status: status,
                  verified_at: new Date().toISOString(),
                  verified_by: user!.id,
                  verification_notes:
                    status === 'manual_verified'
                      ? 'Manually verified by a teacher.'
                      : 'Manually rejected by a teacher.',
                }
              : r,
          ),
        );
        return;
      }
      return updateVerification(id, status, user!.id);
    },
    onSuccess: (_, { status }) => {
      toast.success(
        status === 'manual_verified' ? 'Record approved.' : 'Record rejected.',
      );
      if (!isDemo) queryClient.invalidateQueries({ queryKey: ['teacher_records'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  // ── Derived data ────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const matchSearch =
        !q ||
        r.title.toLowerCase().includes(q) ||
        (r.profiles?.full_name ?? '').toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === '__all__' || r.verification_status === statusFilter;
      const matchCat =
        categoryFilter === '__all__' || r.category === categoryFilter;
      return matchSearch && matchStatus && matchCat;
    });
  }, [records, search, statusFilter, categoryFilter]);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, statusFilter, categoryFilter]);

  const visibleRecords = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  // KPI counts
  const total = records.length;
  const needsReview = records.filter((r) => r.verification_status === 'needs_review').length;
  const verified = records.filter(
    (r) => r.verification_status === 'auto_verified' || r.verification_status === 'manual_verified',
  ).length;
  const uniqueStudents = new Set(records.map((r) => r.user_id)).size;

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFD]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#16B98A] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFD]">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="hidden w-56 flex-col bg-[#0D1B3A] md:flex flex-shrink-0">
        <div className="flex h-16 items-center gap-2.5 px-5 border-b border-white/[0.08]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#16B98A]">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">AcademiX</p>
            <p className="text-[10px] text-slate-500 mt-0.5 capitalize">{role} Portal</p>
          </div>
        </div>

        <nav className="flex-1 pt-5 px-3 space-y-0.5">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Workspace
          </p>
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium bg-white/[0.1] text-[#16B98A]">
            <LayoutDashboard className="h-4 w-4" />
            Verification Queue
          </div>
        </nav>

        <div className="border-t border-white/[0.08] p-3 space-y-1">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#16B98A]/20 text-[#16B98A] text-xs font-semibold">
              {user?.email?.[0]?.toUpperCase() ?? 'T'}
            </div>
            <p className="text-xs font-medium text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/[0.12] transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <div className="flex h-16 items-center justify-between border-b bg-white px-8 flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">
              Verification Queue
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {needsReview > 0
                ? `${needsReview} record${needsReview !== 1 ? 's' : ''} need your attention`
                : 'All records are up to date'}
            </p>
          </div>
          {needsReview > 0 && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 text-white text-xs font-bold">
              {needsReview > 99 ? '99+' : needsReview}
            </span>
          )}
        </div>

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* KPIs */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <Kpi label="Total Records" value={total} icon={FileText} iconBg="bg-slate-100" iconColor="text-slate-600" />
              <Kpi label="Active Students" value={uniqueStudents} icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600" />
              <Kpi
                label="Needs Review"
                value={needsReview}
                icon={AlertTriangle}
                iconBg="bg-orange-50"
                iconColor="text-orange-500"
                onClick={() => setStatusFilter('needs_review')}
              />
              <Kpi label="Verified" value={verified} icon={TrendingUp} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by student, title, or category…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-white"
                  aria-label="Search records"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44 bg-white" aria-label="Filter by status">
                  <Filter className="mr-2 h-3.5 w-3.5 text-slate-400" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-white" aria-label="Filter by category">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Result count + clear */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing {Math.min(visibleCount, filtered.length)} of {filtered.length} records
                {filtered.length !== records.length && ` (filtered from ${records.length})`}
              </p>
              {(statusFilter !== '__all__' || categoryFilter !== '__all__' || search) && (
                <button
                  onClick={() => { setStatusFilter('__all__'); setCategoryFilter('__all__'); setSearch(''); }}
                  className="text-xs font-medium text-[#16B98A] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>

            {/* Records list */}
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#16B98A] border-t-transparent" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border bg-white py-16 text-center">
                <FileText className="h-8 w-8 text-slate-300 mb-3" />
                <p className="text-slate-500 text-sm">No records match your filters.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {visibleRecords.map((record) => (
                    <TeacherRecordRow
                      key={record.id}
                      record={record}
                      expanded={expandedId === record.id}
                      onToggle={() =>
                        setExpandedId(expandedId === record.id ? null : record.id)
                      }
                      onApprove={() =>
                        verifyMutation.mutate({ id: record.id, status: 'manual_verified' })
                      }
                      onReject={() =>
                        verifyMutation.mutate({ id: record.id, status: 'rejected' })
                      }
                      isPending={verifyMutation.isPending}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="pt-2 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white"
                      onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                    >
                      Load more ({filtered.length - visibleCount} remaining)
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

// ── TeacherRecordRow ──────────────────────────────────────────────────────────

interface RowProps {
  record: RecordWithStudent;
  expanded: boolean;
  onToggle: () => void;
  onApprove: () => void;
  onReject: () => void;
  isPending: boolean;
}

const TeacherRecordRow = ({
  record,
  expanded,
  onToggle,
  onApprove,
  onReject,
  isPending,
}: RowProps) => {
  const studentName = record.profiles?.full_name ?? record.user_id.slice(0, 8) + '…';
  const initials = studentName.slice(0, 2).toUpperCase();
  const canOverride =
    record.verification_status === 'needs_review' ||
    record.verification_status === 'rejected' ||
    record.verification_status === 'auto_verified';

  return (
    <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
      {/* Row header */}
      <button
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16B98A] focus-visible:ring-inset"
      >
        {/* Student avatar */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0D1B3A]/10 text-[#0D1B3A] text-xs font-semibold">
          {initials}
        </div>

        {/* Student + title */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{record.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {studentName} · {record.category} ·{' '}
            <span className="inline-flex items-center gap-0.5">
              <CalendarDays className="h-3 w-3" />
              {formatRecordDate(record.date)}
            </span>
          </p>
        </div>

        {/* Verification badge */}
        <div className="shrink-0">
          <VerificationBadge
            status={record.verification_status}
            confidence={record.verification_confidence}
            notes={record.verification_notes}
          />
        </div>

        {/* Expand chevron */}
        <ChevronDown
          className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t px-5 py-4 bg-slate-50/50 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Left: description + AI analysis */}
            <div className="space-y-3">
              {record.description && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    Description
                  </p>
                  <p className="text-sm text-slate-700 leading-relaxed">{record.description}</p>
                </div>
              )}
              {record.verification_notes && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                    AI Analysis
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {record.verification_notes}
                  </p>
                  {record.verification_confidence != null && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-400">Confidence</span>
                        <span className="text-xs font-semibold text-slate-600">
                          {record.verification_confidence}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-200">
                        <div
                          className={`h-1.5 rounded-full transition-all ${
                            record.verification_confidence >= 85
                              ? 'bg-emerald-500'
                              : record.verification_confidence >= 50
                                ? 'bg-orange-400'
                                : 'bg-red-400'
                          }`}
                          style={{ width: `${record.verification_confidence}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right: evidence image */}
            {record.image_url && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                  Evidence Document
                </p>
                <a href={record.image_url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={record.image_url}
                    alt="Evidence document"
                    loading="lazy"
                    className="w-full max-h-48 object-cover rounded-lg border hover:opacity-90 transition-opacity"
                  />
                </a>
                <a
                  href={record.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-xs text-[#16B98A] font-medium hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open full size
                </a>
              </div>
            )}
          </div>

          {/* Actions */}
          {canOverride && (
            <div className="flex items-center gap-2 pt-1 border-t">
              <p className="text-xs text-slate-400 flex-1">Manual override:</p>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50"
                onClick={onReject}
                disabled={isPending}
              >
                <XCircle className="mr-1.5 h-3.5 w-3.5" />
                Reject
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={onApprove}
                disabled={isPending}
              >
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                Approve
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherPortal;
