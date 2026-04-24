import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  PlusCircle,
  Loader2,
  LayoutDashboard,
  FileText,
  UserCircle,
  LogOut,
  GraduationCap,
  Menu,
  Pencil,
  Trash2,
  Search,
  ExternalLink,
  CalendarDays,
  Trophy,
  TrendingUp,
  Award,
  Users,
  Zap,
  BookOpen,
  Star,
  ChevronRight,
  Settings,
  ShieldCheck,
  RefreshCw,
  ImagePlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { NotificationCenter } from '@/components/NotificationCenter';
import { calculateEngagementScore, GRADE_COLORS, GRADE_BG } from '@/lib/engagementScore';
import { checkForDuplicate } from '@/lib/duplicateDetection';
import { DEMO_STUDENT_RECORDS } from '@/lib/demoData';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ProfileSettings } from '@/components/ProfileSettings';
import { VerificationBadge } from '@/components/VerificationBadge';
import {
  CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_CHART_COLORS,
  CATEGORY_SHORT,
  recordSchema,
  type RecordFormData,
  type Category,
} from '@/lib/recordSchema';
import { filterRecords, formatRecordDate, type StudentRecord } from '@/lib/recordUtils';

const PAGE_SIZE = 20;

// Category icon map
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Conferences & Workshops': BookOpen,
  'Certifications': Award,
  'Club Activities': Users,
  'Competitions': Trophy,
  'Academic Excellence': Star,
  'Internships': Zap,
  'Community Service': Users,
  'Leadership Roles': TrendingUp,
};

// ── Supabase helpers ──────────────────────────────────────────────────────────

async function fetchRecords(userId: string): Promise<StudentRecord[]> {
  const { data, error } = await supabase
    .from('student_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Component ─────────────────────────────────────────────────────────────────

const Dashboard = () => {
  const { user, role, loading, signOut, isDemo } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'settings'>('overview');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<StudentRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    if (loading || user) return;
    // React state has no user — double-check Supabase session before redirecting
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) navigate('/login');
    });
  }, [user, loading, navigate]);

  // ── Queries ────────────────────────────────────────────────────────────────

  const {
    data: records = [],
    isLoading: fetching,
  } = useQuery({
    queryKey: ['student_records', user?.id],
    queryFn: () => isDemo ? DEMO_STUDENT_RECORDS : fetchRecords(user!.id),
    enabled: !!user,
  });

  // Realtime: re-fetch when any of this user's records change verification_status
  useEffect(() => {
    if (!user || isDemo) return; // Skip realtime in demo mode
    const channel = supabase
      .channel(`verification:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'student_records',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['student_records', user.id] });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['student_records', user?.id] });

  const insertMutation = useMutation({
    mutationFn: async ({
      values,
      file,
    }: {
      values: RecordFormData;
      file: File | null;
    }) => {
      if (isDemo) {
        // In demo mode, add to local cache
        const newRecord = {
          id: `demo-${Date.now()}`,
          user_id: user!.id,
          title: values.title,
          category: values.category,
          date: values.date,
          description: values.description ?? null,
          image_url: null,
          created_at: new Date().toISOString(),
          verification_status: (file ? 'pending' : 'unverified') as StudentRecord['verification_status'],
          verification_confidence: null,
          verification_notes: file ? 'Demo: AI verification simulated.' : null,
          verified_at: null,
          institution_name: values.institution_name ?? null,
          engagement_points: 5,
        } satisfies StudentRecord;
        queryClient.setQueryData<StudentRecord[]>(
          ['student_records', user?.id],
          (old) => [newRecord, ...(old ?? [])],
        );
        return { hadFile: !!file };
      }
      let imageUrl: string | null = null;
      let storagePath: string | null = null;
      if (file) {
        const ext = file.name.split('.').pop();
        storagePath = `${user!.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('student_uploads')
          .upload(storagePath, file);
        if (uploadError) throw new Error(uploadError.message);
        const { data } = supabase.storage.from('student_uploads').getPublicUrl(storagePath);
        imageUrl = data.publicUrl;
      }
      const { data: inserted, error } = await supabase
        .from('student_records')
        .insert([{ user_id: user!.id, ...values, image_url: imageUrl }])
        .select('id')
        .single();
      if (error) {
        if (storagePath) {
          await supabase.storage.from('student_uploads').remove([storagePath]);
        }
        throw new Error(error.message);
      }
      if (imageUrl && inserted?.id) {
        supabase.functions
          .invoke('verify-record', { body: { record_id: inserted.id } })
          .then(() => invalidate())
          .catch(() => { /* verification failure is non-fatal */ });
      }
      return { hadFile: !!imageUrl };
    },
    onSuccess: ({ hadFile }) => {
      toast.success(
        hadFile
          ? 'Record added — verifying your evidence in the background…'
          : 'Record added!',
      );
      setIsDialogOpen(false);
      if (!isDemo) invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      values,
      file,
    }: {
      id: string;
      values: RecordFormData;
      file: File | null;
    }) => {
      if (isDemo) {
        queryClient.setQueryData<StudentRecord[]>(
          ['student_records', user?.id],
          (old) => (old ?? []).map((r) => r.id === id ? { ...r, ...values } : r),
        );
        return { hadNewFile: false };
      }
      let imageUrl: string | null | undefined = undefined;
      if (file) {
        const ext = file.name.split('.').pop();
        const storagePath = `${user!.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('student_uploads')
          .upload(storagePath, file);
        if (uploadError) throw new Error(uploadError.message);
        const { data } = supabase.storage.from('student_uploads').getPublicUrl(storagePath);
        imageUrl = data.publicUrl;
      }
      const updatePayload: Record<string, unknown> = { ...values };
      if (imageUrl !== undefined) {
        updatePayload.image_url = imageUrl;
        updatePayload.verification_status = 'pending';
        updatePayload.verification_confidence = null;
        updatePayload.verification_notes = 'Re-verifying with new evidence…';
        updatePayload.verified_at = null;
        updatePayload.verified_by = null;
      }
      const { error } = await supabase
        .from('student_records')
        .update(updatePayload)
        .eq('id', id);
      if (error) throw new Error(error.message);
      if (imageUrl) {
        supabase.functions
          .invoke('verify-record', { body: { record_id: id } })
          .then(() => invalidate())
          .catch(() => { /* non-fatal */ });
      }
      return { hadNewFile: !!imageUrl };
    },
    onSuccess: ({ hadNewFile }) => {
      toast.success(
        hadNewFile
          ? 'Record updated — re-verifying new evidence…'
          : 'Record updated!',
      );
      setIsDialogOpen(false);
      setEditingRecord(null);
      if (!isDemo) invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Retry verification for a record (re-fires the Edge Function)
  const retryVerifyMutation = useMutation({
    mutationFn: async (recordId: string) => {
      if (isDemo) {
        // Simulate a re-verification in demo mode
        queryClient.setQueryData<StudentRecord[]>(
          ['student_records', user?.id],
          (old) => (old ?? []).map((r) =>
            r.id === recordId
              ? { ...r, verification_status: 'auto_verified' as const, verification_confidence: 92, verification_notes: 'Demo: Re-verified successfully.' }
              : r,
          ),
        );
        return;
      }
      const { error } = await supabase
        .from('student_records')
        .update({
          verification_status: 'pending',
          verification_notes: 'Retrying AI verification…',
          verification_confidence: null,
        })
        .eq('id', recordId);
      if (error) throw new Error(error.message);
      const { error: fnErr } = await supabase.functions.invoke('verify-record', {
        body: { record_id: recordId },
      });
      if (fnErr) throw new Error(fnErr.message);
    },
    onSuccess: () => {
      toast.success('Re-verification started…');
      if (!isDemo) invalidate();
    },
    onError: (e: Error) => toast.error(`Retry failed: ${e.message}`),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (isDemo) {
        queryClient.setQueryData<StudentRecord[]>(
          ['student_records', user?.id],
          (old) => (old ?? []).filter((r) => r.id !== id),
        );
        return;
      }
      const { error } = await supabase
        .from('student_records')
        .delete()
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Record deleted');
      setDeleteId(null);
      if (!isDemo) invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // ── Form ───────────────────────────────────────────────────────────────────

  const [fileInput, setFileInput] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5 MB');
      e.target.value = '';
      return;
    }
    setFileInput(file);
  };

  const form = useForm<RecordFormData>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      title: '',
      category: CATEGORIES[0],
      date: '',
      description: '',
    },
  });

  const openAdd = () => {
    setEditingRecord(null);
    form.reset({ title: '', category: CATEGORIES[0], date: '', description: '', institution_name: '' });
    setFileInput(null);
    setIsDialogOpen(true);
  };

  const openEdit = (record: StudentRecord) => {
    setEditingRecord(record);
    form.reset({
      title:            record.title,
      category:         record.category as Category,
      date:             record.date,
      description:      record.description ?? '',
      institution_name: record.institution_name ?? '',
    });
    setFileInput(null);
    setIsDialogOpen(true);
  };

  const onSubmit = (values: RecordFormData) => {
    if (editingRecord) {
      updateMutation.mutate({ id: editingRecord.id, values, file: fileInput });
      return;
    }
    // Duplicate detection before insert
    const dupResult = checkForDuplicate(values as { title: string; category: string; date: string }, records);
    if (dupResult.severity === 'duplicate') {
      toast.error(`Possible duplicate: ${dupResult.reason}`, { duration: 6000 });
      return;
    }
    if (dupResult.severity === 'warning') {
      toast.warning(`Note: ${dupResult.reason}`, { duration: 5000 });
    }
    insertMutation.mutate({ values, file: fileInput });
  };

  const isPending = insertMutation.isPending || updateMutation.isPending || retryVerifyMutation.isPending;

  // ── Derived data ──────────────────────────────────────────────────────────

  const filteredRecords = useMemo(
    () => filterRecords(records, searchQuery, categoryFilter),
    [records, searchQuery, categoryFilter],
  );

  const visibleRecords = filteredRecords.slice(0, visibleCount);
  const hasMore = filteredRecords.length > visibleCount;

  const chartData = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        name: CATEGORY_SHORT[cat],
        fullName: cat,
        count: records.filter((r) => r.category === cat).length,
        color: CATEGORY_CHART_COLORS[cat],
      })).filter((d) => d.count > 0),
    [records],
  );

  const activeCategories = CATEGORIES.filter((c) =>
    records.some((r) => r.category === c),
  ).length;

  const engagementScore = useMemo(() => calculateEngagementScore(records), [records]);

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  // ── Add record dialog ─────────────────────────────────────────────────────

  const addRecordDialog = (
    <Dialog
      open={isDialogOpen}
      onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingRecord(null);
      }}
    >
      <DialogTrigger asChild>
        <Button
          size="default"
          className="shrink-0 bg-accent hover:bg-accent/90 text-accent-foreground shadow-md gap-2"
          onClick={openAdd}
        >
          <PlusCircle className="h-4 w-4" />
          Add Record
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {editingRecord ? 'Edit Record' : 'Add New Record'}
          </DialogTitle>
          <DialogDescription>
            {editingRecord
              ? 'Update the details of your achievement.'
              : 'Add details about your achievement or activity to your portfolio.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Hackathon Winner, React Workshop"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Completed</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your achievement, skills learned, or impact..."
                      className="min-h-[90px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="institution_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organising Institution <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. IIT Bangalore, Coursera, ACM"
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label htmlFor="file">
                {editingRecord ? 'Replace Evidence (optional)' : 'Evidence (Image, optional)'}
              </Label>
              <Input
                id="file"
                type="file"
                accept="image/*,.pdf"
                className="cursor-pointer"
                onChange={handleFileChange}
              />
              {fileInput && (
                <p className="text-xs text-emerald-600 font-medium truncate">
                  <ImagePlus className="inline h-3 w-3 mr-1" />
                  Selected: {fileInput.name}
                </p>
              )}
              {editingRecord?.image_url && !fileInput && (
                <p className="text-xs text-muted-foreground">
                  Current evidence is already uploaded. Choose a new file to replace it and re-trigger AI verification.
                </p>
              )}
              {!editingRecord && (
                <p className="text-xs text-muted-foreground">
                  Upload a certificate, photo, or screenshot (max 5 MB). AI will verify it.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingRecord ? 'Save Changes' : 'Add Record'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  // ── Sidebar nav items ─────────────────────────────────────────────────────

  const sidebarNav = (onNavigate?: () => void) => (
    <nav className="space-y-0.5 px-3">
      {(
        [
          { key: 'overview', icon: LayoutDashboard, label: 'Overview' },
          { key: 'records', icon: FileText, label: 'My Records' },
          { key: 'settings', icon: Settings, label: 'Profile & Settings' },
        ] as const
      ).map(({ key, icon: Icon, label }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => { setActiveTab(key); onNavigate?.(); }}
            className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
              isActive
                ? 'bg-white/[0.1] text-[#16B98A]'
                : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
            {isActive && (
              <ChevronRight className="ml-auto h-3.5 w-3.5 text-[#16B98A]" />
            )}
          </button>
        );
      })}
    </nav>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      {/* ── Mobile header ──────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-20 flex h-14 items-center gap-3 border-b border-white/[0.08] bg-[#0D1B3A] px-4 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-300 hover:bg-white/[0.08] hover:text-white">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 bg-[#0D1B3A] border-white/[0.08]">
            <div className="flex h-14 items-center gap-2.5 px-5 border-b border-white/[0.08]">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#16B98A]">
                <GraduationCap className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-white">AcademiX</span>
            </div>
            <div className="pt-4 pb-2">{sidebarNav()}</div>
            <div className="absolute bottom-0 left-0 right-0 border-t border-white/[0.08] p-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/[0.12] transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#16B98A]">
            <GraduationCap className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="font-bold text-white">AcademiX</span>
        </div>
      </header>

      {/* ── Desktop sidebar ────────────────────────────────────────────────── */}
      <aside className="hidden w-60 flex-col bg-[#0D1B3A] md:flex flex-shrink-0">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 px-5 border-b border-white/[0.08]">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#16B98A] shadow-md">
            <GraduationCap className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">AcademiX</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Achievement Hub</p>
          </div>
        </div>

        {/* Nav */}
        <div className="flex-1 pt-5 pb-4 space-y-6">
          <div>
            <p className="px-5 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              Navigation
            </p>
            {sidebarNav()}
          </div>
        </div>

        {/* Teacher / Admin shortcuts */}
        {(role === 'teacher' || role === 'admin') && (
          <div className="px-3 pb-4">
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
              Faculty
            </p>
            <button
              onClick={() => navigate('/teacher')}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-all"
            >
              <ShieldCheck className="h-4 w-4" />
              Verification Queue
            </button>
            {role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-all"
              >
                <Users className="h-4 w-4" />
                Admin Portal
              </button>
            )}
          </div>
        )}

        {/* User + logout */}
        <div className="border-t border-white/[0.08] p-3 space-y-1">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#16B98A]/20 text-[#16B98A] text-xs font-semibold">
              {user?.email?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
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

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <div className="hidden md:flex h-16 items-center justify-between border-b bg-card px-8 flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold text-foreground leading-none">
              {activeTab === 'overview' && 'Dashboard Overview'}
              {activeTab === 'records' && 'My Records'}
              {activeTab === 'settings' && 'Account Settings'}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeTab === 'overview' && `${records.length} achievement${records.length !== 1 ? 's' : ''} across ${activeCategories} categories`}
              {activeTab === 'records' && 'Manage your academic and extracurricular activities'}
              {activeTab === 'settings' && 'Update your profile and preferences'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <NotificationCenter />
            {activeTab !== 'settings' && addRecordDialog}
          </div>
        </div>

        {/* Mobile add button */}
        <div className="md:hidden fixed bottom-6 right-6 z-10">
          {activeTab !== 'settings' && (
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingRecord(null); }}
            >
              <DialogTrigger asChild>
                <Button
                  size="icon"
                  className="h-14 w-14 rounded-full bg-accent hover:bg-accent/90 shadow-xl"
                  onClick={openAdd}
                >
                  <PlusCircle className="h-6 w-6" />
                </Button>
              </DialogTrigger>
            </Dialog>
          )}
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
          <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-6">

            {/* ── Overview tab ─────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-400">

                {/* Engagement Score banner */}
                <div className={`rounded-xl border p-4 flex items-center gap-4 ${GRADE_BG[engagementScore.grade]}`}>
                  <div className={`text-center min-w-[64px]`}>
                    <p className={`text-3xl font-black ${GRADE_COLORS[engagementScore.grade]}`}>
                      {engagementScore.totalScore}
                    </p>
                    <p className={`text-xs font-bold ${GRADE_COLORS[engagementScore.grade]}`}>
                      Grade {engagementScore.grade}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">Engagement Score</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {engagementScore.verifiedCount} verified · {engagementScore.uniqueCategories} categories · {engagementScore.verificationRate}% verification rate
                    </p>
                    {/* Score bar */}
                    <div className="mt-2 h-1.5 rounded-full bg-black/10 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          engagementScore.totalScore >= 75 ? 'bg-emerald-500' :
                          engagementScore.totalScore >= 45 ? 'bg-blue-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${engagementScore.totalScore}%` }}
                      />
                    </div>
                  </div>
                  <div className="hidden sm:block text-right text-xs text-muted-foreground space-y-0.5">
                    <p>Diversity +{engagementScore.diversityBonus}</p>
                    <p>Base {engagementScore.baseScore}</p>
                  </div>
                </div>

                {/* KPI row */}
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                  <KpiCard
                    label="Total Achievements"
                    value={records.length}
                    sub={`${activeCategories} active categories`}
                    icon={Trophy}
                    iconBg="bg-accent/10"
                    iconColor="text-accent"
                  />
                  <KpiCard
                    label="Certifications"
                    value={records.filter((r) => r.category === 'Certifications').length}
                    sub="Professional credentials"
                    icon={Award}
                    iconBg="bg-violet-100"
                    iconColor="text-violet-600"
                    onClick={() => { setCategoryFilter('Certifications'); setActiveTab('records'); }}
                  />
                  <KpiCard
                    label="Competitions"
                    value={records.filter((r) => r.category === 'Competitions').length}
                    sub="Contests & hackathons"
                    icon={TrendingUp}
                    iconBg="bg-orange-100"
                    iconColor="text-orange-500"
                    onClick={() => { setCategoryFilter('Competitions'); setActiveTab('records'); }}
                  />
                  <KpiCard
                    label="Academic Excellence"
                    value={records.filter((r) => r.category === 'Academic Excellence').length}
                    sub="Academic milestones"
                    icon={Star}
                    iconBg="bg-amber-100"
                    iconColor="text-amber-500"
                    onClick={() => { setCategoryFilter('Academic Excellence'); setActiveTab('records'); }}
                  />
                </div>

                {/* Chart + Latest row */}
                <div className="grid gap-4 lg:grid-cols-5">
                  {/* Chart */}
                  <div className="lg:col-span-3 rounded-xl border bg-card p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h3 className="font-semibold text-foreground">Activity Breakdown</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Records per category</p>
                      </div>
                    </div>
                    {records.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-[200px] text-center">
                        <div className="rounded-full bg-muted p-3 mb-3">
                          <LayoutDashboard className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Add records to see your activity chart.
                        </p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              background: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px',
                              fontSize: 12,
                              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                            }}
                            cursor={{ fill: 'hsl(var(--muted))', radius: 4 }}
                            formatter={(value, _name, props) => [value, props.payload.fullName]}
                          />
                          <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={40}>
                            {chartData.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Latest + quick links */}
                  <div className="lg:col-span-2 space-y-4">
                    {/* Latest achievement */}
                    <div className="rounded-xl border bg-card p-5 shadow-sm">
                      <h3 className="text-sm font-semibold text-foreground mb-3">Latest Achievement</h3>
                      {records.length === 0 ? (
                        <div className="flex flex-col items-center py-4 text-center">
                          <div className="rounded-full bg-muted p-2 mb-2">
                            <Trophy className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <p className="text-xs text-muted-foreground">No records yet.</p>
                          <button
                            onClick={openAdd}
                            className="mt-2 text-xs font-medium text-accent hover:underline"
                          >
                            Add your first →
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {records.slice(0, 3).map((rec) => {
                            const CatIcon = CATEGORY_ICONS[rec.category] ?? Trophy;
                            return (
                              <div key={rec.id} className="flex items-center gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                                  <CatIcon className="h-3.5 w-3.5 text-accent" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-semibold truncate text-foreground">{rec.title}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {rec.category} · {formatRecordDate(rec.date)}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          {records.length > 3 && (
                            <button
                              onClick={() => setActiveTab('records')}
                              className="text-xs font-medium text-accent hover:underline flex items-center gap-1 pt-1"
                            >
                              View all {records.length} records
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Category quick links */}
                    <div className="rounded-xl border bg-card p-5 shadow-sm">
                      <h3 className="text-sm font-semibold text-foreground mb-3">Browse by Category</h3>
                      <div className="space-y-1.5">
                        {CATEGORIES.slice(0, 5).map((cat) => {
                          const count = records.filter((r) => r.category === cat).length;
                          const CatIcon = CATEGORY_ICONS[cat] ?? Trophy;
                          return (
                            <button
                              key={cat}
                              onClick={() => { setCategoryFilter(cat); setActiveTab('records'); }}
                              className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
                            >
                              <CatIcon className="h-3.5 w-3.5 shrink-0" />
                              <span className="flex-1 text-left truncate">{cat}</span>
                              <span className="font-semibold text-foreground/70">{count}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* All category cards */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">All Categories</h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {CATEGORIES.map((cat) => {
                      const count = records.filter((r) => r.category === cat).length;
                      const CatIcon = CATEGORY_ICONS[cat] ?? Trophy;
                      const colorClass = CATEGORY_COLORS[cat as Category] ?? 'bg-muted/50 text-muted-foreground border-border';
                      return (
                        <button
                          key={cat}
                          onClick={() => { setCategoryFilter(cat); setActiveTab('records'); }}
                          className="group text-left rounded-xl border bg-card p-4 shadow-sm hover:shadow-md hover:border-accent/30 transition-all duration-200"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60">
                              <CatIcon className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                            </div>
                            <span className="text-2xl font-bold text-foreground">{count}</span>
                          </div>
                          <p className="text-xs font-medium text-foreground/80 leading-snug line-clamp-2">{cat}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            {count === 1 ? '1 record' : `${count} records`}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Records tab ──────────────────────────────────────────── */}
            {activeTab === 'records' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-400">

                {/* Mobile add button row */}
                <div className="flex md:hidden items-center justify-between">
                  <h1 className="text-xl font-bold">My Records</h1>
                  {addRecordDialog}
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search records..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setVisibleCount(PAGE_SIZE);
                      }}
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={categoryFilter || '__all__'}
                    onValueChange={(v) => {
                      setCategoryFilter(v === '__all__' ? '' : v);
                      setVisibleCount(PAGE_SIZE);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-52">
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All categories</SelectItem>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Result count */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {filteredRecords.length === records.length
                      ? `${records.length} record${records.length !== 1 ? 's' : ''}`
                      : `${filteredRecords.length} of ${records.length} records`}
                  </p>
                  {categoryFilter && (
                    <button
                      onClick={() => setCategoryFilter('')}
                      className="text-xs font-medium text-accent hover:underline"
                    >
                      Clear filter
                    </button>
                  )}
                </div>

                {/* Records list */}
                {fetching ? (
                  <div className="flex justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  </div>
                ) : records.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">No records yet</h3>
                    <p className="text-muted-foreground max-w-sm mt-2 mb-6 text-sm">
                      Start building your portfolio by adding your first achievement,
                      certification, or activity.
                    </p>
                    <Button onClick={openAdd} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add First Record
                    </Button>
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-16 text-center">
                    <Search className="h-8 w-8 text-muted-foreground mb-3" />
                    <h3 className="text-lg font-semibold">No matches</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Try a different search term or category filter.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {visibleRecords.map((record) => (
                      <RecordCard
                        key={record.id}
                        record={record}
                        onEdit={openEdit}
                        onDelete={(id) => setDeleteId(id)}
                        onRetryVerify={(id) => retryVerifyMutation.mutate(id)}
                        isRetrying={retryVerifyMutation.isPending}
                      />
                    ))}

                    {hasMore && (
                      <div className="pt-3 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                        >
                          Load more ({filteredRecords.length - visibleCount} remaining)
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Settings tab ─────────────────────────────────────────── */}
            {activeTab === 'settings' && (
              <div className="animate-in fade-in slide-in-from-bottom-3 duration-400 max-w-2xl">
                <ProfileSettings />
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The record and any associated evidence will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ── KpiCard ───────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: number;
  sub: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  onClick?: () => void;
}

const KpiCard = ({ label, value, sub, icon: Icon, iconBg, iconColor, onClick }: KpiCardProps) => (
  <div
    onClick={onClick}
    className={`rounded-xl border bg-card p-5 shadow-sm transition-all duration-200 ${
      onClick ? 'cursor-pointer hover:shadow-md hover:border-accent/30 hover:-translate-y-px' : ''
    }`}
  >
    <div className="flex items-start justify-between mb-3">
      <p className="text-xs font-medium text-muted-foreground leading-snug">{label}</p>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
    </div>
    <p className="text-3xl font-bold text-foreground tabular-nums">{value}</p>
    <p className="text-[11px] text-muted-foreground mt-1">{sub}</p>
  </div>
);

// ── RecordCard ────────────────────────────────────────────────────────────────

interface RecordCardProps {
  record: StudentRecord;
  onEdit: (record: StudentRecord) => void;
  onDelete: (id: string) => void;
  onRetryVerify: (id: string) => void;
  isRetrying: boolean;
}

const CATEGORY_BORDER: Partial<Record<string, string>> = {
  'Certifications': 'border-l-violet-400',
  'Competitions': 'border-l-orange-400',
  'Academic Excellence': 'border-l-amber-400',
  'Leadership Roles': 'border-l-blue-400',
  'Internships': 'border-l-cyan-400',
  'Club Activities': 'border-l-pink-400',
  'Community Service': 'border-l-green-400',
  'Conferences & Workshops': 'border-l-indigo-400',
};

const RecordCard = ({ record, onEdit, onDelete, onRetryVerify, isRetrying }: RecordCardProps) => {
  const colorClass =
    CATEGORY_COLORS[record.category as Category] ??
    'bg-muted/50 text-muted-foreground border-border';

  const borderAccent = CATEGORY_BORDER[record.category] ?? 'border-l-accent';
  const CatIcon = CATEGORY_ICONS[record.category] ?? Trophy;

  return (
    <div className={`group relative flex gap-4 rounded-xl border border-l-4 ${borderAccent} bg-card p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-px`}>
      {/* Category icon column */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 mt-0.5">
        <CatIcon className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 pr-14">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm leading-snug text-foreground truncate">{record.title}</h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${colorClass}`}>
                {record.category}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                {formatRecordDate(record.date)}
              </span>
            </div>
          </div>

          {/* Thumbnail */}
          {record.image_url && (
            <img
              src={record.image_url}
              alt="Evidence"
              className="h-12 w-12 shrink-0 rounded-lg object-cover border"
            />
          )}
        </div>

        {record.description && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {record.description}
          </p>
        )}

        <div className="mt-2 flex items-center gap-3 flex-wrap">
          {record.verification_status && (
            <VerificationBadge
              status={record.verification_status}
              confidence={record.verification_confidence}
              notes={record.verification_notes}
            />
          )}
          {record.image_url && (
            <a
              href={record.image_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              View evidence
            </a>
          )}
          {record.image_url &&
            record.verification_status &&
            ['rejected', 'needs_review', 'unverified'].includes(record.verification_status) && (
              <button
                onClick={() => onRetryVerify(record.id)}
                disabled={isRetrying}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50"
              >
                <RefreshCw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
                Retry verification
              </button>
            )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:bg-muted"
          onClick={() => onEdit(record)}
        >
          <Pencil className="h-3.5 w-3.5" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(record.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </div>
  );
};

export default Dashboard;
