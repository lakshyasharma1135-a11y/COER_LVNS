import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { GraduationCap, Users, BookOpen, Mail, Lock, User, Building2, Hash, Loader2, ArrowLeft, KeyRound } from 'lucide-react';

type Mode = 'signin' | 'signup' | 'forgot' | 'reset';

export default function AuthPage({ recoveryMode = false }: { recoveryMode?: boolean }) {
  const { signIn, signUp, sendPasswordReset, updatePassword } = useAuth();
  const [mode, setMode] = useState<Mode>(recoveryMode ? 'reset' : 'signin');
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setMessage(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    if (mode === 'forgot') {
      const { error: err } = await sendPasswordReset(email);
      if (err) setError(err);
      else setMessage('Password reset link sent. Check your email inbox and spam folder.');
    } else if (mode === 'reset') {
      if (newPassword.length < 6) setError('New password must be at least 6 characters.');
      else {
        const { error: err } = await updatePassword(newPassword);
        if (err) setError(err);
        else setMessage('Password updated successfully. You can now sign in with your new password.');
      }
    } else if (mode === 'signup') {
      const { error: err } = await signUp(email, password, fullName, role, {
        studentId,
        teacherId,
        department,
        semester: semester ? parseInt(semester) : undefined,
      });
      if (err) setError(err);
      else setMessage('Account created successfully. If email confirmation is enabled, check your email before signing in.');
    } else {
      const { error: err } = await signIn(email, password);
      if (err) setError(err);
    }
    setLoading(false);
  }

  const title = mode === 'forgot' ? 'Forgot Password?' : mode === 'reset' ? 'Set New Password' : 'COER LVNS';
  const subtitle = mode === 'forgot'
    ? 'Enter your registered email to receive a reset link.'
    : mode === 'reset'
      ? 'Create a new password for your COER LVNS account.'
      : 'COER University’s complete digital learning ecosystem';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-teal-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20 mb-4">
            {mode === 'forgot' || mode === 'reset' ? <KeyRound className="w-9 h-9 text-white" /> : <GraduationCap className="w-9 h-9 text-white" />}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-slate-500 mt-1">{subtitle}</p>
        </div>

        <div className="card p-8 animate-slide-up">
          {(mode === 'signin' || mode === 'signup') && (
            <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6">
              <button type="button" onClick={() => switchMode('signin')} className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${mode === 'signin' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Sign In</button>
              <button type="button" onClick={() => switchMode('signup')} className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-all ${mode === 'signup' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Sign Up</button>
            </div>
          )}

          {mode === 'signup' && (
            <div className="flex gap-2 mb-5">
              <button type="button" onClick={() => setRole('student')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border-2 transition-all ${role === 'student' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-500'}`}><Users className="w-4 h-4" /> Student</button>
              <button type="button" onClick={() => setRole('teacher')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border-2 transition-all ${role === 'teacher' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-500'}`}><BookOpen className="w-4 h-4" /> Teacher</button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="relative"><User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="input-field pl-11" /></div>
                <div className="relative"><Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="text" placeholder={role === 'student' ? 'Student ID' : 'Teacher ID'} value={role === 'student' ? studentId : teacherId} onChange={(e) => role === 'student' ? setStudentId(e.target.value) : setTeacherId(e.target.value)} className="input-field pl-11" /></div>
                <div className="relative"><Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="text" placeholder="Department (e.g. Computer Science)" value={department} onChange={(e) => setDepartment(e.target.value)} className="input-field pl-11" /></div>
                {role === 'student' && <div className="relative"><Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="number" placeholder="Semester (1-8)" value={semester} onChange={(e) => setSemester(e.target.value)} min="1" max="8" className="input-field pl-11" /></div>}
              </>
            )}

            <div className="relative"><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field pl-11" /></div>

            {(mode === 'signin' || mode === 'signup') && <div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="input-field pl-11" /></div>}
            {mode === 'reset' && <div className="relative"><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="input-field pl-11" /></div>}

            {mode === 'signin' && <div className="text-right -mt-1"><button type="button" onClick={() => switchMode('forgot')} className="text-sm text-blue-600 font-semibold hover:underline">Forgot Password?</button></div>}

            {error && <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 animate-fade-in">{error}</div>}
            {message && <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl px-4 py-3 animate-fade-in">{message}</div>}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {mode === 'signin' ? 'Sign In' : mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Send Reset Link' : 'Update Password'}
            </button>
          </form>

          <div className="text-center mt-6">
            {(mode === 'forgot' || mode === 'reset') ? (
              <button type="button" onClick={() => switchMode('signin')} className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to Sign In</button>
            ) : (
              <p className="text-center text-sm text-slate-500">{mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}<button type="button" onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')} className="text-blue-600 font-semibold hover:underline">{mode === 'signin' ? 'Sign up' : 'Sign in'}</button></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
