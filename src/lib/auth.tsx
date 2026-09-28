import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase, Profile } from './supabase';
import type { Session } from '@supabase/supabase-js';

type AuthContextType = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  recoveryMode: boolean;
  signUp: (email: string, password: string, fullName: string, role: 'student' | 'teacher', extra: { studentId?: string; teacherId?: string; department?: string; semester?: number }) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  sendPasswordReset: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function friendlyAuthError(message: string) {
  const text = message.toLowerCase();
  if (text.includes('failed to fetch') || text.includes('network') || text.includes('fetch')) {
    return 'Server connection failed. Check your internet connection and make sure the Supabase project is available.';
  }
  if (text.includes('invalid login credentials')) return 'Invalid email or password.';
  if (text.includes('email not confirmed')) return 'Please confirm your email first, then sign in.';
  if (text.includes('password should be at least')) return 'Password must be at least 6 characters.';
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [recoveryMode, setRecoveryMode] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.error('Session load error:', error);
      setSession(data.session);
      if (data.session) loadProfile(data.session.user.id);
      else setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, sess) => {
      if (!mounted) return;
      setSession(sess);
      if (event === 'PASSWORD_RECOVERY') setRecoveryMode(true);
      if (event === 'SIGNED_OUT') setRecoveryMode(false);
      if (sess) loadProfile(sess.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function loadProfile(userId: string) {
    try {
      let { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Profile load error:', error);
      }

      if (!data) {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.error('User lookup error:', userError);
          setProfile(null);
          setLoading(false);
          return;
        }

        const metadata = userData.user?.user_metadata ?? {};
        const fallbackRole = metadata.role === 'teacher' ? 'teacher' : 'student';

        const { data: createdProfile, error: createError } = await supabase.from('profiles').upsert({
          id: userId,
          full_name: String(metadata.full_name || userData.user?.email?.split('@')[0] || 'User'),
          role: fallbackRole,
          student_id: metadata.student_id ?? null,
          teacher_id: metadata.teacher_id ?? null,
          department: metadata.department ?? null,
          semester: metadata.semester === undefined || metadata.semester === null ? null : Number(metadata.semester),
        }, { onConflict: 'id' }).select().single();

        if (createError) {
          console.error('Profile recovery error:', createError);
          setProfile(null);
          setLoading(false);
          return;
        }

        data = createdProfile;
      }

      setProfile(data as Profile | null);
      setLoading(false);
    } catch (error) {
      console.error('Profile load failed:', error);
      setProfile(null);
      setLoading(false);
    }
  }

  async function signUp(email: string, password: string, fullName: string, role: 'student' | 'teacher', extra: { studentId?: string; teacherId?: string; department?: string; semester?: number }) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role,
            student_id: role === 'student' ? extra.studentId || null : null,
            teacher_id: role === 'teacher' ? extra.teacherId || null : null,
            department: extra.department || null,
            semester: role === 'student' ? extra.semester || null : null,
          },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) return { error: friendlyAuthError(error.message) };
      if (!data.user) return { error: 'Sign up failed. Please try again.' };

      // If email confirmation is disabled, a session exists and the profile can be created here.
      // When confirmation is enabled, the SQL trigger in supabase/migrations creates it safely.
      if (data.session) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: fullName.trim(),
          role,
          student_id: role === 'student' ? extra.studentId || null : null,
          teacher_id: role === 'teacher' ? extra.teacherId || null : null,
          department: extra.department || null,
          semester: role === 'student' ? extra.semester || null : null,
        }, { onConflict: 'id' });
        if (profileError) return { error: friendlyAuthError(profileError.message) };
      }

      return { error: null };
    } catch (error) {
      return { error: friendlyAuthError(error instanceof Error ? error.message : 'Unable to connect to the server.') };
    }
  }

  async function signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      return { error: error ? friendlyAuthError(error.message) : null };
    } catch (error) {
      return { error: friendlyAuthError(error instanceof Error ? error.message : 'Unable to connect to the server.') };
    }
  }

  async function sendPasswordReset(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      return { error: error ? friendlyAuthError(error.message) : null };
    } catch (error) {
      return { error: friendlyAuthError(error instanceof Error ? error.message : 'Unable to connect to the server.') };
    }
  }

  async function updatePassword(password: string) {
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return { error: friendlyAuthError(error.message) };
      setRecoveryMode(false);
      return { error: null };
    } catch (error) {
      return { error: friendlyAuthError(error instanceof Error ? error.message : 'Unable to connect to the server.') };
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
    setRecoveryMode(false);
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, recoveryMode, signUp, signIn, sendPasswordReset, updatePassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
