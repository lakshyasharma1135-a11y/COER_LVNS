import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import {
  Bot, FlaskConical, Code2, FileCheck, CalendarCheck, Library,
  Presentation, Trophy, Rocket, Briefcase, ScanFace, Bell,
  TrendingUp, Clock, CheckCircle2, AlertCircle, BookOpen, Award,
} from 'lucide-react';
import type { NavKey } from './AppShell';

type Stat = { label: string; value: string; icon: typeof Bot; color: string; bg: string };

export default function Dashboard({ onNavigate }: { onNavigate: (k: NavKey) => void }) {
  const { profile } = useAuth();
  const role = profile?.role || 'student';
  const [stats, setStats] = useState<Stat[]>([]);
  const [recentNotifs, setRecentNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    const userId = profile?.id;
    if (!userId) { setLoading(false); return; }

    try {
      if (role === 'student') {
        const [enrollments, assignments, attendance, skills, notifs] = await Promise.all([
          supabase.from('enrollments').select('id').eq('student_id', userId),
          supabase.from('assignment_submissions').select('id').eq('student_id', userId),
          supabase.from('attendance_records').select('id').eq('student_id', userId),
          supabase.from('skill_enrollments').select('id').eq('student_id', userId),
          supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
        ]);

        setStats([
          { label: 'Enrolled Courses', value: String(enrollments.data?.length || 0), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Assignments Done', value: String(assignments.data?.length || 0), icon: FileCheck, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Attendance', value: String(attendance.data?.length || 0), icon: CalendarCheck, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Skills Learning', value: String(skills.data?.length || 0), icon: Rocket, color: 'text-amber-600', bg: 'bg-amber-50' },
        ]);
        setRecentNotifs(notifs.data || []);
      } else {
        const [courses, lectures, assignments, quizzes, notifs] = await Promise.all([
          supabase.from('courses').select('id').eq('teacher_id', userId),
          supabase.from('lectures').select('id').eq('created_by', userId),
          supabase.from('assignments').select('id').eq('created_by', userId),
          supabase.from('quizzes').select('id').eq('created_by', userId),
          supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(5),
        ]);

        setStats([
          { label: 'My Courses', value: String(courses.data?.length || 0), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Lectures', value: String(lectures.data?.length || 0), icon: Presentation, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Assignments', value: String(assignments.data?.length || 0), icon: FileCheck, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Quizzes', value: String(quizzes.data?.length || 0), icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
        ]);
        setRecentNotifs(notifs.data || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  const studentFeatures: { key: NavKey; label: string; desc: string; icon: typeof Bot; color: string }[] = [
    { key: 'ai-teacher', label: 'AI Teacher', desc: 'Ask anything, learn interactively', icon: Bot, color: 'from-blue-500 to-blue-600' },
    { key: 'virtual-lab', label: 'AI Virtual Lab', desc: 'Lab experiments with AI guidance', icon: FlaskConical, color: 'from-teal-500 to-teal-600' },
    { key: 'coding-lab', label: 'AI Coding Lab', desc: 'Practice coding right in the browser', icon: Code2, color: 'from-slate-700 to-slate-800' },
    { key: 'assignments', label: 'Smart Assignment', desc: 'Cheating-free submissions with AI grading', icon: FileCheck, color: 'from-green-500 to-green-600' },
    { key: 'attendance', label: 'Smart Attendance', desc: 'Auto attendance via QR / location', icon: CalendarCheck, color: 'from-cyan-500 to-cyan-600' },
    { key: 'library', label: 'E-Library', desc: 'Thousands of books at your fingertips', icon: Library, color: 'from-amber-500 to-amber-600' },
    { key: 'lectures', label: 'Lectures / PPT', desc: 'AI-summarized lectures and slides', icon: Presentation, color: 'from-rose-500 to-rose-600' },
    { key: 'activities', label: 'Activities & Competitions', desc: 'Quizzes after every lecture', icon: Trophy, color: 'from-orange-500 to-orange-600' },
    { key: 'skills', label: 'Projects & Skills', desc: 'Learn new skills, earn diplomas', icon: Rocket, color: 'from-indigo-500 to-indigo-600' },
    { key: 'career', label: 'Career & Internship', desc: 'Direct LinkedIn internship & job links', icon: Briefcase, color: 'from-sky-500 to-sky-600' },
    { key: 'gate-scan', label: 'Smart ID / Gate Scan', desc: 'Mobile ID, gate & vehicle scanning', icon: ScanFace, color: 'from-violet-500 to-violet-600' },
  ];

  const teacherFeatures: { key: NavKey; label: string; desc: string; icon: typeof Bot; color: string }[] = [
    { key: 'virtual-lab', label: 'AI Virtual Lab', desc: 'Create lab sheets, AI explains them', icon: FlaskConical, color: 'from-teal-500 to-teal-600' },
    { key: 'coding-lab', label: 'AI Coding Lab', desc: 'Create coding challenges for students', icon: Code2, color: 'from-slate-700 to-slate-800' },
    { key: 'assignments', label: 'Smart Assignment', desc: 'Create & review assignments', icon: FileCheck, color: 'from-green-500 to-green-600' },
    { key: 'attendance', label: 'Smart Attendance', desc: 'Start sessions, see live attendance', icon: CalendarCheck, color: 'from-cyan-500 to-cyan-600' },
    { key: 'library', label: 'E-Library', desc: 'Manage the digital library', icon: Library, color: 'from-amber-500 to-amber-600' },
    { key: 'lectures', label: 'Lectures / PPT', desc: 'Create lectures & PPTs with AI summary', icon: Presentation, color: 'from-rose-500 to-rose-600' },
    { key: 'activities', label: 'Activities & Competitions', desc: 'Create quizzes for students', icon: Trophy, color: 'from-orange-500 to-orange-600' },
    { key: 'skills', label: 'Projects & Skills', desc: 'Manage skill tracks & student progress', icon: Rocket, color: 'from-indigo-500 to-indigo-600' },
  ];

  const features = role === 'student' ? studentFeatures : teacherFeatures;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-teal-600 p-8 lg:p-10 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-400/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />
        <div className="relative">
          <p className="text-blue-100 text-sm font-medium mb-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <h1 className="text-3xl lg:text-4xl font-bold mb-2">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p className="text-blue-100 max-w-lg">
            {role === 'student'
              ? 'Your entire learning journey in one place. Learn, practice, build skills, and grow — all powered by AI.'
              : 'Manage your courses, create content, track students, and let AI assist with grading and summaries.'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [0, 1, 2, 3].map((i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-slate-100 mb-3" />
              <div className="h-8 w-16 bg-slate-100 rounded mb-2" />
              <div className="h-4 w-24 bg-slate-100 rounded" />
            </div>
          ))
        ) : (
          stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="card card-hover p-5 animate-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-6 h-6 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900">{s.value}</p>
                <p className="text-sm text-slate-500">{s.label}</p>
              </div>
            );
          })
        )}
      </div>

      {/* Feature grid */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          {role === 'student' ? 'Explore Features' : 'Teaching Tools'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <button
                key={f.key}
                onClick={() => onNavigate(f.key)}
                className="card card-hover p-5 text-left animate-slide-up group"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{f.label}</h3>
                <p className="text-sm text-slate-500">{f.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Recent notifications */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Recent Notifications
          </h2>
          <button onClick={() => onNavigate('notifications')} className="text-sm text-blue-600 font-semibold hover:underline">
            View all
          </button>
        </div>
        {recentNotifs.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No notifications yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentNotifs.map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${n.read ? 'bg-slate-100' : 'bg-blue-50'}`}>
                  {n.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                   n.type === 'warning' ? <AlertCircle className="w-5 h-5 text-yellow-600" /> :
                   <Bell className={`w-5 h-5 ${n.read ? 'text-slate-400' : 'text-blue-600'}`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${n.read ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>{n.title}</p>
                  {n.message && <p className="text-xs text-slate-500 mt-0.5 truncate">{n.message}</p>}
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">
                  {new Date(n.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
