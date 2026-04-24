import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { GraduationCap, ArrowRight, Loader2, Shield, Users, BarChart3, BookOpen, ShieldCheck } from 'lucide-react';

// ── Demo accounts ─────────────────────────────────────────────────────────────

const DEMO_ACCOUNTS = [
  {
    label: 'Student',
    email: 'priya.sharma@demo.academix.in',
    password: 'AcademiX@2024',
    redirect: '/dashboard',
    icon: GraduationCap,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200',
    desc: 'Student dashboard & portfolio',
  },
  {
    label: 'Faculty',
    email: 'dr.kavitha@demo.academix.in',
    password: 'AcademiX@2024',
    redirect: '/teacher',
    icon: BookOpen,
    color: 'text-blue-600',
    bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    desc: 'Verification queue & approvals',
  },
  {
    label: 'Admin',
    email: 'admin@demo.academix.in',
    password: 'AcademiX@2024',
    redirect: '/admin',
    icon: ShieldCheck,
    color: 'text-violet-600',
    bg: 'bg-violet-50 hover:bg-violet-100 border-violet-200',
    desc: 'Analytics, reports & user management',
  },
] as const;

// ── Schema ────────────────────────────────────────────────────────────────────

const authSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().optional(),
});

type AuthFormData = z.infer<typeof authSchema>;

type SignupRole = 'student' | 'teacher' | 'admin';

const ROLE_OPTIONS: { value: SignupRole; label: string; icon: React.ElementType; desc: string; color: string; border: string }[] = [
  { value: 'student', label: 'Student',  icon: GraduationCap, desc: 'Upload & verify achievements', color: 'text-emerald-600', border: 'border-emerald-400 bg-emerald-50/60 ring-emerald-200' },
  { value: 'teacher', label: 'Faculty',  icon: BookOpen,       desc: 'Review & approve records',    color: 'text-blue-600',    border: 'border-blue-400 bg-blue-50/60 ring-blue-200' },
  { value: 'admin',   label: 'Admin',    icon: ShieldCheck,    desc: 'Manage users & analytics',    color: 'text-violet-600',  border: 'border-violet-400 bg-violet-50/60 ring-violet-200' },
];

// ── Component ─────────────────────────────────────────────────────────────────

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<SignupRole>('student');
  const navigate = useNavigate();
  const { demoLogin } = useAuth();

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '', fullName: '' },
  });

  const onSubmit = async (values: AuthFormData) => {
    try {
      if (isSignUp) {
        if (!values.fullName?.trim()) {
          toast.error('Please enter your full name');
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: values.email!,
          password: values.password!,
          options: {
            data: {
              full_name: values.fullName.trim(),
              role: selectedRole,
            },
          },
        });
        if (error) throw error;

        toast.success('Account created! You can now sign in.');
        const redirect = selectedRole === 'admin' ? '/admin' : selectedRole === 'teacher' ? '/teacher' : '/dashboard';
        navigate(redirect);
      } else {
        // Try demo login first
        if (demoLogin(values.email!)) {
          navigate('/dashboard');
          return;
        }
        const { data, error } = await supabase.auth.signInWithPassword({
          email: values.email!,
          password: values.password!,
        });
        if (error) throw error;
        const userRole = data.user?.user_metadata?.role ?? 'student';
        const redirect = userRole === 'admin' ? '/admin' : userRole === 'teacher' ? '/teacher' : '/dashboard';
        navigate(redirect);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  const handleDemoLogin = async (email: string, _password: string, redirect: string) => {
    setDemoLoading(email);
    try {
      // Use local demo mode — no Supabase needed
      if (demoLogin(email)) {
        navigate(redirect);
        return;
      }
      // Fallback to real Supabase auth
      const { error } = await supabase.auth.signInWithPassword({ email, password: _password });
      if (error) throw error;
      navigate(redirect);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Demo login failed');
    } finally {
      setDemoLoading(null);
    }
  };

  const isLoading = form.formState.isSubmitting;

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel: brand ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden flex-col justify-between p-12">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-accent shadow-glow">
            <GraduationCap className="h-5 w-5 text-accent-foreground" />
          </div>
          <span className="text-2xl font-bold text-primary-foreground">
            Academi<span className="text-accent">X</span>
          </span>
        </Link>

        {/* Hero text */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 border border-accent/30">
            <span className="flex h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-xs font-medium text-accent">Verified student portfolios</span>
          </div>
          <h2 className="text-4xl font-bold text-primary-foreground leading-tight">
            Your achievements,{' '}
            <span className="text-gradient">verified &amp; ready</span>
          </h2>
          <p className="text-primary-foreground/70 text-lg max-w-sm">
            Document every milestone. From certifications to competitions — build
            the portfolio that tells your whole story.
          </p>

          {/* Trust indicators */}
          <div className="flex flex-col gap-3 pt-2">
            {[
              { icon: Shield, text: 'NAAC & NIRF Compliant records' },
              { icon: Users, text: 'Faculty-verified achievements' },
              { icon: BarChart3, text: 'Analytics for institutions' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-primary-foreground/70">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-6 pt-6 border-t border-primary-foreground/10">
          {[
            { value: '50K+', label: 'Students' },
            { value: '1M+', label: 'Verified records' },
            { value: '500+', label: 'Institutions' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl font-bold text-accent">{s.value}</div>
              <div className="text-xs text-primary-foreground/50">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Decorative glow */}
        <div className="absolute top-1/4 right-0 w-64 h-64 rounded-full gradient-glow opacity-30 pointer-events-none" />
      </div>

      {/* ── Right panel: form ─────────────────────────────────────────────── */}
      <div className="flex w-full lg:w-1/2 flex-col items-center justify-center bg-background p-8">
        {/* Mobile logo */}
        <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-accent shadow-glow">
            <GraduationCap className="h-4.5 w-4.5 text-accent-foreground" />
          </div>
          <span className="text-xl font-bold">
            Academi<span className="text-accent">X</span>
          </span>
        </Link>

        <div className="w-full max-w-sm space-y-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {isSignUp
                ? 'Join AcademiX and start your verified portfolio'
                : 'Sign in to access your dashboard'}
            </p>
          </div>

          {/* Role selector — only shown during signup */}
          {isSignUp && (
            <div className="space-y-2">
              <p className="text-sm font-medium">I am a…</p>
              <div className="grid grid-cols-3 gap-2">
                {ROLE_OPTIONS.map((opt) => {
                  const active = selectedRole === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSelectedRole(opt.value)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition-all ${
                        active
                          ? `${opt.border} ring-2 shadow-sm scale-[1.02]`
                          : 'border-border bg-background hover:border-muted-foreground/30 hover:bg-muted/50'
                      }`}
                    >
                      <opt.icon className={`h-5 w-5 ${active ? opt.color : 'text-muted-foreground'}`} />
                      <span className={`text-xs font-semibold ${active ? opt.color : 'text-muted-foreground'}`}>
                        {opt.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground leading-tight">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        autoComplete="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isSignUp && (
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="e.g. Priya Sharma"
                          autoComplete="name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        autoComplete={isSignUp ? 'new-password' : 'current-password'}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                {isSignUp ? 'Create account' : 'Sign in'}
              </Button>
            </form>
          </Form>

          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsSignUp((v) => !v);
                form.reset();
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </div>

          {/* ── Demo access ─────────────────────────────────────────────── */}
          {!isSignUp && (
            <div className="space-y-3">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground tracking-wider font-medium">
                    Demo access
                  </span>
                </div>
              </div>
              <p className="text-center text-[11px] text-muted-foreground">
                Explore each role — all use password <code className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">AcademiX@2024</code>
              </p>
              <div className="grid grid-cols-3 gap-2">
                {DEMO_ACCOUNTS.map((acct) => {
                  const busy = demoLoading === acct.email;
                  return (
                    <button
                      key={acct.label}
                      type="button"
                      onClick={() => handleDemoLogin(acct.email, acct.password, acct.redirect)}
                      disabled={!!demoLoading || isLoading}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors disabled:opacity-50 ${acct.bg}`}
                    >
                      {busy
                        ? <Loader2 className={`h-5 w-5 animate-spin ${acct.color}`} />
                        : <acct.icon className={`h-5 w-5 ${acct.color}`} />}
                      <span className={`text-xs font-semibold ${acct.color}`}>{acct.label}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight">{acct.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
