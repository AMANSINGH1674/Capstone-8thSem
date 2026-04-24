import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  GraduationCap, Users, FileText, ShieldCheck, TrendingUp, Download,
  UserCheck, AlertTriangle, LogOut, LayoutDashboard, BarChart2,
  FileSpreadsheet, Settings2, ChevronRight, Loader2, Search,
  ArrowUpDown, Building2, Award, Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { calculateEngagementScore, GRADE_COLORS } from '@/lib/engagementScore';
import {
  generateNAACDetailedCSV, generateNIRFSummaryCSV,
  generateEngagementScoresCSV, downloadCSV, reportFilename,
  type StudentWithRecords, type ProfileRow,
} from '@/lib/reportUtils';
import type { StudentRecord } from '@/lib/recordUtils';
import type { VerificationStatus } from '@/lib/verificationTypes';
import { CATEGORIES } from '@/lib/recordSchema';
import { DEMO_STUDENT_RECORDS } from '@/lib/demoData';

// ── Constants ─────────────────────────────────────────────────────────────────

const CHART_COLORS = [
  '#16B98A','#6366f1','#f59e0b','#ef4444',
  '#8b5cf6','#ec4899','#14b8a6','#f97316',
];

const STATUS_COLORS: Record<VerificationStatus, string> = {
  auto_verified:  '#16B98A',
  manual_verified:'#22c55e',
  needs_review:   '#f59e0b',
  pending:        '#6366f1',
  rejected:       '#ef4444',
  unverified:     '#94a3b8',
};

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function fetchAllProfiles(): Promise<ProfileRow[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, department, roll_number, year_of_study, role, is_portfolio_public');
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function fetchAllRecords(): Promise<(StudentRecord & { institution_name?: string | null })[]> {
  const { data, error } = await supabase
    .from('student_records')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, icon: Icon, color, onClick,
}: {
  label: string; value: string | number; sub: string;
  icon: React.ElementType; color: string; onClick?: () => void;
}) {
  return (
    <div
      className={`rounded-xl border bg-card p-5 shadow-sm ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, string> = {
    admin:   'bg-violet-100 text-violet-700 border-violet-200',
    teacher: 'bg-blue-100 text-blue-700 border-blue-200',
    student: 'bg-slate-100 text-slate-600 border-slate-200',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${map[role] ?? map.student}`}>
      {role}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type AdminTab = 'overview' | 'users' | 'analytics' | 'reports';

export default function AdminDashboard() {
  const { user, role, loading, signOut, isDemo } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // ── Auth guard — verify session with Supabase before redirecting ────────
  useEffect(() => {
    if (loading) return;
    if (user && role === 'admin') return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/login');
    });
  }, [loading, user, role, navigate]);

  const isAdmin = !loading && !!user && role === 'admin';

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: profiles = [], isLoading: loadingProfiles } = useQuery({
    queryKey: ['admin_profiles'],
    queryFn:  () => isDemo ? [
      { id: 'demo-student-1', full_name: 'Priya Sharma', department: 'Computer Science', roll_number: 'CS21001', year_of_study: 3, role: 'student' as const, is_portfolio_public: true },
      { id: 'demo-student-2', full_name: 'Rahul Verma', department: 'Computer Science', roll_number: 'CS21002', year_of_study: 3, role: 'student' as const, is_portfolio_public: false },
      { id: 'demo-student-3', full_name: 'Ananya Iyer', department: 'Electronics', roll_number: 'EC21010', year_of_study: 2, role: 'student' as const, is_portfolio_public: true },
      { id: 'demo-teacher-1', full_name: 'Dr. Kavitha Rajan', department: 'Computer Science', roll_number: null, year_of_study: null, role: 'teacher' as const, is_portfolio_public: false },
      { id: 'demo-admin-1', full_name: 'Admin User', department: 'Administration', roll_number: null, year_of_study: null, role: 'admin' as const, is_portfolio_public: false },
    ] as ProfileRow[] : fetchAllProfiles(),
    enabled:  isAdmin,
    staleTime: 60_000,
  });

  const { data: allRecords = [], isLoading: loadingRecords } = useQuery({
    queryKey: ['admin_records'],
    queryFn:  () => isDemo ? DEMO_STUDENT_RECORDS : fetchAllRecords(),
    enabled:  isAdmin,
    staleTime: 60_000,
  });

  const isLoading = loading || loadingProfiles || loadingRecords;

  // ── Role change mutation ───────────────────────────────────────────────────

  const roleChangeMutation = useMutation({
    mutationFn: async ({ target_user_id, new_role }: { target_user_id: string; new_role: string }) => {
      if (isDemo) {
        // In demo mode, update the local cache
        queryClient.setQueryData<ProfileRow[]>(['admin_profiles'], (old) =>
          (old ?? []).map((p) =>
            p.id === target_user_id ? { ...p, role: new_role } : p,
          ),
        );
        return;
      }
      const { error } = await supabase.functions.invoke('set-user-role', {
        body: { target_user_id, new_role },
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Role updated');
      if (!isDemo) queryClient.invalidateQueries({ queryKey: ['admin_profiles'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Derived data (hooks must be above any early return) ─────────────────

  const studentsWithRecords = useMemo<StudentWithRecords[]>(() => {
    const recordsByUser: Record<string, typeof allRecords> = {};
    for (const r of allRecords) {
      if (r.user_id) {
        (recordsByUser[r.user_id] ??= []).push(r);
      }
    }
    return profiles.map((p) => ({
      ...p,
      records: recordsByUser[p.id] ?? [],
    }));
  }, [profiles, allRecords]);

  const students = studentsWithRecords.filter((s) => s.role === 'student');
  const faculty  = studentsWithRecords.filter((s) => s.role === 'teacher');

  const verifiedRecords = allRecords.filter((r) =>
    r.verification_status === 'auto_verified' || r.verification_status === 'manual_verified',
  );
  const needsReview = allRecords.filter((r) => r.verification_status === 'needs_review');
  const verificationRate = allRecords.length > 0
    ? Math.round((verifiedRecords.length / allRecords.length) * 100)
    : 0;

  const departments = [...new Set(profiles.map((p) => p.department).filter(Boolean))];

  const deptChartData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of allRecords) {
      const profile = profiles.find((p) => p.id === r.user_id);
      const dept = profile?.department ?? 'Unassigned';
      map[dept] = (map[dept] ?? 0) + 1;
    }
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [allRecords, profiles]);

  const monthlyTrend = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
      const key = format(d, 'MMM yy');
      const count = allRecords.filter((r) => {
        if (!r.created_at) return false;
        const rd = new Date(r.created_at);
        return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
      }).length;
      return { month: key, count };
    });
  }, [allRecords]);

  const statusDist = useMemo(() => {
    const map: Partial<Record<VerificationStatus, number>> = {};
    for (const r of allRecords) {
      const s = (r.verification_status ?? 'unverified') as VerificationStatus;
      map[s] = (map[s] ?? 0) + 1;
    }
    return Object.entries(map).map(([status, count]) => ({
      name: status.replace('_', ' '),
      value: count,
      color: STATUS_COLORS[status as VerificationStatus] ?? '#94a3b8',
    }));
  }, [allRecords]);

  const categoryDist = useMemo(() =>
    CATEGORIES.map((cat, i) => ({
      name: cat.length > 15 ? cat.split(' ')[0] : cat,
      fullName: cat,
      count: allRecords.filter((r) => r.category === cat).length,
      color: CHART_COLORS[i % CHART_COLORS.length],
    })).filter((d) => d.count > 0),
  [allRecords]);

  const filteredUsers = useMemo(() => {
    return studentsWithRecords.filter((u) => {
      const matchSearch =
        !userSearch ||
        (u.full_name ?? '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.department ?? '').toLowerCase().includes(userSearch.toLowerCase()) ||
        (u.roll_number ?? '').toLowerCase().includes(userSearch.toLowerCase());
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [studentsWithRecords, userSearch, roleFilter]);

  // ── Loading / not authorized ──────────────────────────────────────────────

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#16B98A]" />
      </div>
    );
  }

  // ── Sidebar nav ────────────────────────────────────────────────────────────

  const navItems: { key: AdminTab; icon: React.ElementType; label: string }[] = [
    { key: 'overview',  icon: LayoutDashboard, label: 'Overview' },
    { key: 'users',     icon: Users,           label: 'User Management' },
    { key: 'analytics', icon: BarChart2,       label: 'Analytics' },
    { key: 'reports',   icon: FileSpreadsheet, label: 'Reports & Export' },
  ];

  const sidebarNav = (onClose?: () => void) => (
    <nav className="space-y-0.5 px-3">
      {navItems.map(({ key, icon: Icon, label }) => {
        const active = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => { setActiveTab(key); onClose?.(); }}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
              active
                ? 'bg-white/[0.1] text-[#16B98A]'
                : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
            {active && <ChevronRight className="ml-auto h-3.5 w-3.5 text-[#16B98A]" />}
          </button>
        );
      })}
    </nav>
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">

      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 z-20 flex h-14 items-center gap-3 border-b border-white/[0.08] bg-[#0D1B3A] px-4 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-300 hover:bg-white/[0.08]">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-[#0D1B3A] border-white/[0.08]">
            <div className="flex h-14 items-center gap-2.5 px-5 border-b border-white/[0.08]">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
                <Settings2 className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-white">Admin Portal</span>
            </div>
            <div className="pt-4 pb-2">{sidebarNav()}</div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-600">
            <Settings2 className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-white">Admin Portal</span>
        </div>
      </header>

      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-col bg-[#0D1B3A] md:flex flex-shrink-0">
        <div className="flex h-16 items-center gap-2.5 px-5 border-b border-white/[0.08]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 shadow-md">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">AcademiX</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Admin Portal</p>
          </div>
        </div>

        <div className="flex-1 pt-5 pb-4">
          <p className="px-5 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            Management
          </p>
          {sidebarNav()}
        </div>

        <div className="border-t border-white/[0.08] p-3 space-y-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Student View
          </button>
          <button
            onClick={() => { signOut(); navigate('/login'); }}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/[0.12] transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <div className="hidden md:flex h-16 items-center justify-between border-b bg-card px-8 flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold">
              {activeTab === 'overview'  && 'System Overview'}
              {activeTab === 'users'     && 'User Management'}
              {activeTab === 'analytics' && 'Analytics Dashboard'}
              {activeTab === 'reports'   && 'Reports & Export'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {profiles.length} users · {allRecords.length} records · {departments.length} departments
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live data
          </div>
        </div>

        {/* Scrollable body */}
        <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
          <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-6">

            {isLoading && (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            )}

            {!isLoading && (
              <>
                {/* ── OVERVIEW ───────────────────────────────────────── */}
                {activeTab === 'overview' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-400">

                    {/* KPI row */}
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                      <KpiCard label="Total Students"    value={students.length} sub={`${faculty.length} faculty registered`}       icon={Users}        color="bg-accent/10 text-accent"     onClick={() => setActiveTab('users')} />
                      <KpiCard label="Total Records"     value={allRecords.length}  sub={`${verifiedRecords.length} verified`}       icon={FileText}     color="bg-blue-100 text-blue-600"   />
                      <KpiCard label="Verification Rate" value={`${verificationRate}%`} sub={`${needsReview.length} pending review`} icon={ShieldCheck}  color="bg-emerald-100 text-emerald-600" onClick={() => navigate('/teacher')} />
                      <KpiCard label="Departments"       value={departments.length} sub={`${allRecords.length > 0 ? Math.round(allRecords.length / Math.max(departments.length, 1)) : 0} avg records/dept`} icon={Building2} color="bg-violet-100 text-violet-600" />
                    </div>

                    {/* AI verification stats */}
                    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                      {[
                        { label: 'Auto-Verified',  value: allRecords.filter(r => r.verification_status === 'auto_verified').length,   color: 'text-emerald-600' },
                        { label: 'Manual Verified', value: allRecords.filter(r => r.verification_status === 'manual_verified').length, color: 'text-green-600' },
                        { label: 'Needs Review',   value: needsReview.length,                                                          color: 'text-amber-600' },
                        { label: 'Rejected',       value: allRecords.filter(r => r.verification_status === 'rejected').length,         color: 'text-red-600' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="rounded-xl border bg-card p-4 shadow-sm text-center">
                          <p className={`text-2xl font-bold ${color}`}>{value}</p>
                          <p className="text-xs text-muted-foreground mt-1">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Charts row */}
                    <div className="grid gap-4 lg:grid-cols-2">
                      {/* Monthly trend */}
                      <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <h3 className="font-semibold mb-1">Monthly Submissions</h3>
                        <p className="text-xs text-muted-foreground mb-4">New records over the last 12 months</p>
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart data={monthlyTrend} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                            <Line type="monotone" dataKey="count" stroke="#16B98A" strokeWidth={2} dot={{ r: 3, fill: '#16B98A' }} activeDot={{ r: 5 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Verification distribution pie */}
                      <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <h3 className="font-semibold mb-1">Verification Status</h3>
                        <p className="text-xs text-muted-foreground mb-4">Distribution across all records</p>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie data={statusDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                              {statusDist.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Top students by engagement */}
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">Engagement Leaderboard</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Top students by engagement score</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setActiveTab('reports')}>
                          <Download className="h-3.5 w-3.5 mr-1.5" />
                          Export
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {students
                          .map((s) => ({ ...s, score: calculateEngagementScore(s.records) }))
                          .sort((a, b) => b.score.totalScore - a.score.totalScore)
                          .slice(0, 8)
                          .map((s, i) => (
                            <div key={s.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                              <span className="text-xs font-bold text-muted-foreground w-5 text-center">#{i + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{s.full_name ?? 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">{s.department ?? 'No dept'} · {s.records.length} records</p>
                              </div>
                              <div className="text-right">
                                <p className={`text-sm font-bold ${GRADE_COLORS[s.score.grade]}`}>{s.score.totalScore}</p>
                                <p className={`text-xs font-semibold ${GRADE_COLORS[s.score.grade]}`}>{s.score.grade}</p>
                              </div>
                            </div>
                          ))}
                        {students.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-4">No students yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── USERS ──────────────────────────────────────────── */}
                {activeTab === 'users' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-400">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name, department, roll number…"
                          className="pl-9"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                        />
                      </div>
                      <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="All roles" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All roles</SelectItem>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b bg-muted/40">
                              {['Name', 'Department', 'Roll No.', 'Role', 'Records', 'Engagement', 'Actions'].map((h) => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {filteredUsers.map((u) => {
                              const score = calculateEngagementScore(u.records);
                              return (
                                <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                                  <td className="px-4 py-3">
                                    <p className="font-medium">{u.full_name ?? '—'}</p>
                                    <p className="text-xs text-muted-foreground">{u.year_of_study ? `Year ${u.year_of_study}` : ''}</p>
                                  </td>
                                  <td className="px-4 py-3 text-muted-foreground">{u.department ?? '—'}</td>
                                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{u.roll_number ?? '—'}</td>
                                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                                  <td className="px-4 py-3 text-center">{u.records.length}</td>
                                  <td className="px-4 py-3">
                                    <span className={`font-bold text-sm ${GRADE_COLORS[score.grade]}`}>
                                      {score.totalScore} <span className="text-xs">({score.grade})</span>
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    {u.id !== user?.id && (
                                      <Select
                                        value={u.role}
                                        onValueChange={(newRole) =>
                                          roleChangeMutation.mutate({ target_user_id: u.id, new_role: newRole })
                                        }
                                      >
                                        <SelectTrigger className="h-7 w-[110px] text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="student">Student</SelectItem>
                                          <SelectItem value="teacher">Teacher</SelectItem>
                                          <SelectItem value="admin">Admin</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )}
                                    {u.id === user?.id && (
                                      <span className="text-xs text-muted-foreground italic">You</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {filteredUsers.length === 0 && (
                          <div className="py-12 text-center text-sm text-muted-foreground">
                            No users found matching your search.
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Showing {filteredUsers.length} of {studentsWithRecords.length} users
                    </p>
                  </div>
                )}

                {/* ── ANALYTICS ──────────────────────────────────────── */}
                {activeTab === 'analytics' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-400">

                    {/* Department participation */}
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                      <h3 className="font-semibold mb-1">Department Participation</h3>
                      <p className="text-xs text-muted-foreground mb-4">Total submitted records per department</p>
                      {deptChartData.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No department data yet. Students need to fill in their department in Profile Settings.</p>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={deptChartData} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                            <Bar dataKey="count" name="Records" radius={[0, 4, 4, 0]}>
                              {deptChartData.map((_, i) => (
                                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </div>

                    {/* Category distribution */}
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <h3 className="font-semibold mb-1">Activity Categories</h3>
                        <p className="text-xs text-muted-foreground mb-4">Records submitted per category</p>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={categoryDist} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                            <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                            <Tooltip
                              contentStyle={{ fontSize: 12, borderRadius: 8 }}
                              formatter={(v, _, p) => [v, p.payload.fullName]}
                            />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                              {categoryDist.map((d, i) => (
                                <Cell key={i} fill={d.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Engagement score distribution */}
                      <div className="rounded-xl border bg-card p-6 shadow-sm">
                        <h3 className="font-semibold mb-1">Engagement Score Distribution</h3>
                        <p className="text-xs text-muted-foreground mb-4">Students by grade band</p>
                        {(() => {
                          const gradeBands = students.reduce<Record<string, number>>(
                            (acc, s) => {
                              const g = calculateEngagementScore(s.records).grade;
                              acc[g] = (acc[g] ?? 0) + 1;
                              return acc;
                            }, {},
                          );
                          const data = ['A+','A','B+','B','C','D'].map((g) => ({
                            grade: g, count: gradeBands[g] ?? 0,
                            color: g === 'A+' ? '#10b981' : g === 'A' ? '#22c55e' :
                                   g === 'B+' ? '#14b8a6' : g === 'B' ? '#6366f1' :
                                   g === 'C' ? '#f59e0b' : '#ef4444',
                          }));
                          return (
                            <ResponsiveContainer width="100%" height={220}>
                              <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                <XAxis dataKey="grade" tick={{ fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                                <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                                  {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          );
                        })()}
                      </div>
                    </div>

                    {/* AI Confidence histogram */}
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                      <h3 className="font-semibold mb-1">AI Confidence Distribution</h3>
                      <p className="text-xs text-muted-foreground mb-4">
                        Histogram of confidence scores across all AI-analysed records (10-point buckets)
                      </p>
                      {(() => {
                        const buckets = [0,10,20,30,40,50,60,70,80,90].map(lo => {
                          const hi = lo + 10;
                          const count = allRecords.filter(r => {
                            const c = r.verification_confidence;
                            return c != null && c >= lo && c < hi;
                          }).length;
                          return { range: `${lo}–${hi}`, count,
                            color: lo >= 85 ? '#16B98A' : lo >= 50 ? '#f59e0b' : '#ef4444' };
                        });
                        // Add 100 as its own bucket
                        buckets.push({
                          range: '100',
                          count: allRecords.filter(r => r.verification_confidence === 100).length,
                          color: '#16B98A',
                        });
                        const withConf = allRecords.filter(r => r.verification_confidence != null);
                        return withConf.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-8">
                            No AI-analysed records yet.
                          </p>
                        ) : (
                          <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={buckets} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                              <XAxis dataKey="range" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [v, 'Records']} />
                              <Bar dataKey="count" name="Records" radius={[4,4,0,0]}>
                                {buckets.map((b, i) => <Cell key={i} fill={b.color} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        );
                      })()}
                    </div>

                    {/* AI Verification accuracy metrics */}
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                      <h3 className="font-semibold mb-1">AI Verification Metrics</h3>
                      <p className="text-xs text-muted-foreground mb-4">Performance of the Claude Vision verification pipeline</p>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                          {
                            label: 'Auto-Verify Rate',
                            value: allRecords.length > 0
                              ? `${Math.round((allRecords.filter(r => r.verification_status === 'auto_verified').length / allRecords.length) * 100)}%`
                              : '—',
                            sub: 'of all submitted records',
                          },
                          {
                            label: 'Avg. Confidence',
                            value: (() => {
                              const withConf = allRecords.filter(r => r.verification_confidence != null);
                              if (withConf.length === 0) return '—';
                              const avg = withConf.reduce((s, r) => s + (r.verification_confidence ?? 0), 0) / withConf.length;
                              return `${Math.round(avg)}%`;
                            })(),
                            sub: 'mean AI confidence score',
                          },
                          {
                            label: 'Human Override Rate',
                            value: allRecords.length > 0
                              ? `${Math.round((allRecords.filter(r => r.verification_status === 'manual_verified').length / allRecords.length) * 100)}%`
                              : '—',
                            sub: 'manually verified by faculty',
                          },
                          {
                            label: 'Rejection Rate',
                            value: allRecords.length > 0
                              ? `${Math.round((allRecords.filter(r => r.verification_status === 'rejected').length / allRecords.length) * 100)}%`
                              : '—',
                            sub: 'failed AI verification',
                          },
                        ].map(({ label, value, sub }) => (
                          <div key={label} className="text-center p-4 rounded-lg border bg-muted/30">
                            <p className="text-2xl font-bold text-foreground">{value}</p>
                            <p className="text-xs font-medium mt-1">{label}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── REPORTS ────────────────────────────────────────── */}
                {activeTab === 'reports' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-400">
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                      <h3 className="font-semibold mb-1">Accreditation Reports</h3>
                      <p className="text-xs text-muted-foreground mb-6">
                        Export institution-wide data in formats suitable for NAAC/NIRF submissions.
                      </p>
                      <div className="grid gap-4 sm:grid-cols-3">
                        {[
                          {
                            title: 'NAAC Detailed Report',
                            desc: 'All student activities with verification details. One row per activity.',
                            icon: FileSpreadsheet,
                            color: 'border-emerald-200 bg-emerald-50',
                            action: () => {
                              const csv = generateNAACDetailedCSV(studentsWithRecords);
                              downloadCSV(csv, reportFilename('NAAC_Detailed'));
                              toast.success('NAAC report downloaded');
                            },
                          },
                          {
                            title: 'NIRF Summary Report',
                            desc: 'Department-wise participation summary with verification rates.',
                            icon: BarChart2,
                            color: 'border-blue-200 bg-blue-50',
                            action: () => {
                              const csv = generateNIRFSummaryCSV(studentsWithRecords);
                              downloadCSV(csv, reportFilename('NIRF_Summary'));
                              toast.success('NIRF summary downloaded');
                            },
                          },
                          {
                            title: 'Engagement Scores',
                            desc: 'Student engagement index, grade, and breakdown for all students.',
                            icon: Award,
                            color: 'border-violet-200 bg-violet-50',
                            action: () => {
                              const csv = generateEngagementScoresCSV(studentsWithRecords);
                              downloadCSV(csv, reportFilename('Engagement_Scores'));
                              toast.success('Engagement scores downloaded');
                            },
                          },
                        ].map(({ title, desc, icon: Icon, color, action }) => (
                          <div key={title} className={`rounded-xl border p-5 ${color}`}>
                            <div className="flex items-center gap-2.5 mb-3">
                              <Icon className="h-5 w-5 text-foreground/70" />
                              <h4 className="font-semibold text-sm">{title}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{desc}</p>
                            <Button size="sm" className="w-full gap-2" onClick={action}>
                              <Download className="h-3.5 w-3.5" />
                              Download CSV
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Stats summary for report */}
                    <div className="rounded-xl border bg-card p-6 shadow-sm">
                      <h3 className="font-semibold mb-4">Snapshot for Report Narrative</h3>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                        {[
                          ['Total Registered Students', students.length],
                          ['Total Activity Records', allRecords.length],
                          ['Verified Records', verifiedRecords.length],
                          ['Verification Rate', `${verificationRate}%`],
                          ['Departments Represented', departments.length],
                          ['Active Categories', new Set(allRecords.map(r => r.category)).size],
                          ['AI Auto-Verified', allRecords.filter(r => r.verification_status === 'auto_verified').length],
                          ['Faculty Verified', allRecords.filter(r => r.verification_status === 'manual_verified').length],
                          ['Avg Records / Student', students.length > 0 ? (allRecords.length / students.length).toFixed(1) : '0'],
                        ].map(([label, val]) => (
                          <div key={String(label)} className="flex justify-between py-2 border-b last:border-0">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-semibold">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
