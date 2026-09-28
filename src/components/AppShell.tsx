import { ReactNode, useState } from 'react';
import { useAuth } from '@/lib/auth';
import {
  GraduationCap, LayoutDashboard, Bot, FlaskConical, Code2,
  FileCheck, CalendarCheck, Library, Presentation, Trophy,
  Rocket, Briefcase, ScanFace, Bell, LogOut, Menu, X, ChevronRight,
} from 'lucide-react';

export type NavKey =
  | 'dashboard' | 'ai-teacher' | 'virtual-lab' | 'coding-lab'
  | 'assignments' | 'attendance' | 'library' | 'lectures'
  | 'activities' | 'skills' | 'career' | 'gate-scan' | 'notifications';

const navItems: { key: NavKey; label: string; icon: typeof LayoutDashboard; roles: ('student' | 'teacher')[] }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['student', 'teacher'] },
  { key: 'ai-teacher', label: 'AI Teacher', icon: Bot, roles: ['student'] },
  { key: 'virtual-lab', label: 'AI Virtual Lab', icon: FlaskConical, roles: ['student', 'teacher'] },
  { key: 'coding-lab', label: 'AI Coding Lab', icon: Code2, roles: ['student', 'teacher'] },
  { key: 'assignments', label: 'Smart Assignment', icon: FileCheck, roles: ['student', 'teacher'] },
  { key: 'attendance', label: 'Smart Attendance', icon: CalendarCheck, roles: ['student', 'teacher'] },
  { key: 'library', label: 'E-Library', icon: Library, roles: ['student', 'teacher'] },
  { key: 'lectures', label: 'Lectures / PPT', icon: Presentation, roles: ['student', 'teacher'] },
  { key: 'activities', label: 'Activities & Competitions', icon: Trophy, roles: ['student', 'teacher'] },
  { key: 'skills', label: 'Projects & Skills', icon: Rocket, roles: ['student', 'teacher'] },
  { key: 'career', label: 'Career & Internship', icon: Briefcase, roles: ['student'] },
  { key: 'gate-scan', label: 'Smart ID / Gate Scan', icon: ScanFace, roles: ['student'] },
  { key: 'notifications', label: 'Notifications', icon: Bell, roles: ['student', 'teacher'] },
];

export default function AppShell({ active, onSelect, children }: { active: NavKey; onSelect: (k: NavKey) => void; children: ReactNode }) {
  const { profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const role = profile?.role || 'student';
  const items = navItems.filter((i) => i.roles.includes(role));

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-600/20">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-slate-900 text-lg leading-tight">COER LVNS</h1>
          <p className="text-xs text-slate-500 capitalize">{role} Portal</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => { onSelect(item.key); setMobileOpen(false); }}
              className={`nav-item w-full ${isActive ? 'nav-item-active' : ''}`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className="flex items-center gap-3 px-2 py-2 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-semibold text-sm">
            {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-900 truncate">{profile?.full_name}</p>
            <p className="text-xs text-slate-500 truncate">{role === 'student' ? profile?.student_id : profile?.teacher_id}</p>
          </div>
        </div>
        <button onClick={() => signOut()} className="nav-item w-full text-red-500 hover:bg-red-50">
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col fixed inset-y-0 left-0 z-30">
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white z-50 lg:hidden animate-slide-up">
            {sidebar}
          </aside>
        </>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-slate-100">
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-slate-900">COER LVNS</span>
          </div>
          <button onClick={() => onSelect('notifications')} className="p-2 rounded-lg hover:bg-slate-100 relative">
            <Bell className="w-5 h-5 text-slate-700" />
          </button>
        </header>

        <main className="p-4 lg:p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
