import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from '@/lib/verificationTypes';

const roleSchema = z.enum(['student', 'teacher', 'admin']).catch('student');

// ── Demo mode ─────────────────────────────────────────────────────────────────
// When Supabase isn't configured or demo accounts don't exist, we use local
// mock sessions so the UI is fully explorable without a backend.

const DEMO_STORAGE_KEY = 'academix_demo_session';

interface DemoSession {
  email: string;
  role: UserRole;
  fullName: string;
}

const DEMO_USERS: Record<string, DemoSession> = {
  'priya.sharma@demo.academix.in': {
    email: 'priya.sharma@demo.academix.in',
    role: 'student',
    fullName: 'Priya Sharma',
  },
  'dr.kavitha@demo.academix.in': {
    email: 'dr.kavitha@demo.academix.in',
    role: 'teacher',
    fullName: 'Dr. Kavitha Rajan',
  },
  'admin@demo.academix.in': {
    email: 'admin@demo.academix.in',
    role: 'admin',
    fullName: 'Admin User',
  },
};

function createMockUser(demo: DemoSession): User {
  return {
    id: `demo-${demo.role}-${btoa(demo.email).slice(0, 12)}`,
    email: demo.email,
    app_metadata: {},
    user_metadata: { full_name: demo.fullName },
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  } as User;
}

// ── Auth context ──────────────────────────────────────────────────────────────

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole;
  loading: boolean;
  isDemo: boolean;
  signOut: () => Promise<void>;
  demoLogin: (email: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: 'student',
  loading: true,
  isDemo: false,
  signOut: async () => {},
  demoLogin: () => false,
});

async function fetchRole(userId: string, userMeta?: Record<string, unknown>): Promise<UserRole> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist yet (new signup) — create it from user_metadata
      const fullName = (userMeta?.full_name as string) ?? '';
      const metaRole = roleSchema.parse(userMeta?.role) as UserRole;
      const { error: insertErr } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          full_name: fullName,
          role: metaRole,
        }, { onConflict: 'id' });
      if (insertErr) {
        console.warn('Auto-create profile failed:', insertErr.message);
      }
      return metaRole;
    }

    if (error) {
      console.warn('Failed to fetch role:', error.message);
      return 'student';
    }
    return roleSchema.parse(data?.role) as UserRole;
  } catch (err) {
    console.warn('Error fetching role:', err);
    return 'student';
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('student');
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  // Restore demo session from localStorage on mount
  const restoreDemoSession = useCallback(() => {
    try {
      const stored = localStorage.getItem(DEMO_STORAGE_KEY);
      if (stored) {
        const demo: DemoSession = JSON.parse(stored);
        setUser(createMockUser(demo));
        setRole(demo.role);
        setIsDemo(true);
        return true;
      }
    } catch {
      localStorage.removeItem(DEMO_STORAGE_KEY);
    }
    return false;
  }, []);

  // Demo login: set mock user without touching Supabase
  const demoLogin = useCallback((email: string): boolean => {
    const demo = DEMO_USERS[email];
    if (!demo) return false;
    localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(demo));
    setUser(createMockUser(demo));
    setRole(demo.role);
    setIsDemo(true);
    setLoading(false);
    return true;
  }, []);

  const handleSignOut = useCallback(async () => {
    // Clear demo session
    localStorage.removeItem(DEMO_STORAGE_KEY);
    setUser(null);
    setSession(null);
    setRole('student');
    setIsDemo(false);
    await supabase.auth.signOut().catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1. Check for existing demo session first
    if (restoreDemoSession()) {
      setLoading(false);
      return;
    }

    // 2. Try real Supabase auth
    const timeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth session check timed out — continuing without auth');
        setLoading(false);
      }
    }, 3000);

    supabase.auth
      .getSession()
      .then(async ({ data: { session: s } }) => {
        if (!mounted) return;
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          // Set role from metadata immediately
          const metaRole = roleSchema.parse(s.user.user_metadata?.role) as UserRole;
          setRole(metaRole);
          setLoading(false);
          // Refine from DB in background
          const r = await fetchRole(s.user.id, s.user.user_metadata);
          if (mounted) setRole(r);
        } else {
          if (mounted) setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Auth getSession failed:', err);
        if (mounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, s) => {
      if (!mounted || isDemo) return; // Don't override demo session
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // Set role from metadata immediately so navigation isn't blocked
        const metaRole = roleSchema.parse(s.user.user_metadata?.role) as UserRole;
        setRole(metaRole);
        setLoading(false);
        // Then refine from DB in background
        const r = await fetchRole(s.user.id, s.user.user_metadata);
        if (mounted) setRole(r);
      } else {
        setRole('student');
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, user, role, loading, isDemo, signOut: handleSignOut, demoLogin }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
