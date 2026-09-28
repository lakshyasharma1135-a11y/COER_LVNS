import { useState } from 'react';
import { AuthProvider, useAuth } from '@/lib/auth';
import AuthPage from '@/components/AuthPage';
import AppShell, { type NavKey } from '@/components/AppShell';
import Dashboard from '@/components/Dashboard';
import AITeacher from '@/components/AITeacher';
import VirtualLab from '@/components/VirtualLab';
import CodingLab from '@/components/CodingLab';
import Assignments from '@/components/Assignments';
import Attendance from '@/components/Attendance';
import Library from '@/components/Library';
import Lectures from '@/components/Lectures';
import Activities from '@/components/Activities';
import Skills from '@/components/Skills';
import Career from '@/components/Career';
import GateScan from '@/components/GateScan';
import Notifications from '@/components/Notifications';
import { Loader2, GraduationCap } from 'lucide-react';

function AppContent() {
  const { session, profile, loading, recoveryMode } = useAuth();
  const [active, setActive] = useState<NavKey>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20 mb-4 animate-pulse">
            <GraduationCap className="w-9 h-9 text-white" />
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading COER LVNS...</span>
          </div>
        </div>
      </div>
    );
  }

  if (recoveryMode) {
    return <AuthPage recoveryMode />;
  }

  if (!session || !profile) {
    return <AuthPage />;
  }

  const pages: Record<NavKey, React.ReactNode> = {
    'dashboard': <Dashboard onNavigate={setActive} />,
    'ai-teacher': <AITeacher />,
    'virtual-lab': <VirtualLab />,
    'coding-lab': <CodingLab />,
    'assignments': <Assignments />,
    'attendance': <Attendance />,
    'library': <Library />,
    'lectures': <Lectures />,
    'activities': <Activities />,
    'skills': <Skills />,
    'career': <Career />,
    'gate-scan': <GateScan />,
    'notifications': <Notifications />,
  };

  return (
    <AppShell active={active} onSelect={setActive}>
      {pages[active]}
    </AppShell>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
