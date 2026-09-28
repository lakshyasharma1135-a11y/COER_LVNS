import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { AttendanceSession, AttendanceRecord, Course } from '@/lib/supabase';
import {
  CalendarCheck, Plus, Loader2, X, QrCode, CheckCircle2, Clock,
  MapPin, Users, Calendar,
} from 'lucide-react';

export default function Attendance() {
  const { profile } = useAuth();
  const role = profile?.role || 'student';
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [activeSession, setActiveSession] = useState<AttendanceSession | null>(null);
  const [qrToken, setQrToken] = useState('');
  const [marking, setMarking] = useState(false);
  const [marked, setMarked] = useState(false);

  const [sCourse, setSCourse] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data: sData } = await supabase.from('attendance_sessions').select('*').order('created_at', { ascending: false });
    setSessions(sData || []);
    const { data: cData } = await supabase.from('courses').select('*');
    setCourses(cData || []);
    if (profile) {
      const { data: rData } = await supabase.from('attendance_records').select('*').eq('student_id', profile.id);
      setRecords(rData || []);
    }
    setLoading(false);
  }

  async function createSession(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !sCourse) return;
    const token = Math.random().toString(36).substring(2, 10).toUpperCase();
    const { data } = await supabase.from('attendance_sessions').insert({
      course_id: sCourse,
      qr_token: token,
      created_by: profile.id,
    }).select().single();
    if (data) {
      setShowCreate(false);
      setSCourse('');
      setActiveSession(data);
      load();
    }
  }

  async function markAttendance(session: AttendanceSession) {
    if (!profile || marking) return;
    setMarking(true);
    const { error } = await supabase.from('attendance_records').insert({
      session_id: session.id,
      student_id: profile.id,
      status: 'present',
    });
    if (!error) {
      setMarked(true);
      load();
    }
    setMarking(false);
  }

  async function endSession() {
    if (!activeSession) return;
    setActiveSession(null);
    load();
  }

  const myAttendance = records.length;
  const presentCount = records.filter((r) => r.status === 'present').length;
  const attendanceRate = myAttendance > 0 ? Math.round((presentCount / myAttendance) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <CalendarCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Smart Attendance</h1>
            <p className="text-slate-500">Auto attendance via QR code or location check-in</p>
          </div>
        </div>
        {role === 'teacher' && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Start Session
          </button>
        )}
      </div>

      {/* Stats */}
      {role === 'student' && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center mb-2">
              <Calendar className="w-5 h-5 text-cyan-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{myAttendance}</p>
            <p className="text-sm text-slate-500">Total Sessions</p>
          </div>
          <div className="card p-5">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{presentCount}</p>
            <p className="text-sm text-slate-500">Present</p>
          </div>
          <div className="card p-5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{attendanceRate}%</p>
            <p className="text-sm text-slate-500">Attendance Rate</p>
          </div>
        </div>
      )}

      {/* Active QR session (teacher) */}
      {activeSession && role === 'teacher' && (
        <div className="card p-8 text-center animate-scale-in">
          <h3 className="font-bold text-slate-900 mb-4">Active Attendance Session</h3>
          <div className="inline-block bg-white border-4 border-slate-900 rounded-2xl p-6 mb-4">
            <div className="grid grid-cols-8 gap-1">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className={`w-5 h-5 ${Math.random() > 0.5 ? 'bg-slate-900' : 'bg-white'}`} />
              ))}
            </div>
          </div>
          <p className="text-3xl font-mono font-bold text-slate-900 tracking-widest mb-2">{activeSession.qr_token}</p>
          <p className="text-sm text-slate-500 mb-4">Share this code with students to mark attendance</p>
          <div className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-4">
            <Users className="w-4 h-4" />
            <span>{records.filter((r) => r.session_id === activeSession.id).length} students marked present</span>
          </div>
          <button onClick={endSession} className="btn-secondary">End Session</button>
        </div>
      )}

      {/* Student check-in */}
      {role === 'student' && sessions.length > 0 && !marked && (
        <div className="card p-6">
          <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-cyan-600" /> Enter Attendance Code
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={qrToken}
              onChange={(e) => setQrToken(e.target.value.toUpperCase())}
              placeholder="Enter QR code from teacher"
              className="input-field font-mono uppercase tracking-wider"
              maxLength={8}
            />
            <button
              onClick={() => {
                const session = sessions.find((s) => s.qr_token === qrToken);
                if (session) markAttendance(session);
                else alert('Invalid code. Please check with your teacher.');
              }}
              disabled={!qrToken || marking}
              className="btn-primary flex items-center gap-2"
            >
              {marking ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
              Mark Present
            </button>
          </div>
        </div>
      )}

      {marked && (
        <div className="card p-8 text-center bg-green-50 animate-scale-in">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-green-700">Attendance Marked!</h3>
          <p className="text-green-600 text-sm mt-1">You have been marked present for this session.</p>
          <button onClick={() => setMarked(false)} className="btn-secondary mt-4">Done</button>
        </div>
      )}

      {/* Sessions list */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900">Recent Sessions</h3>
          {sessions.length === 0 ? (
            <div className="card p-12 text-center">
              <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No attendance sessions yet</p>
            </div>
          ) : (
            sessions.slice(0, 10).map((s) => {
              const course = courses.find((c) => c.id === s.course_id);
              const myRecord = records.find((r) => r.session_id === s.id);
              return (
                <div key={s.id} className="card p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${myRecord ? 'bg-green-50' : 'bg-slate-100'}`}>
                    {myRecord ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <Clock className="w-5 h-5 text-slate-400" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 text-sm">{course?.title || 'Session'}</p>
                    <p className="text-xs text-slate-500">{new Date(s.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                  </div>
                  {myRecord ? (
                    <span className="badge badge-success">Present</span>
                  ) : role === 'student' ? (
                    <span className="badge badge-neutral">Not marked</span>
                  ) : (
                    <span className="badge badge-info">Active</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Create session modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="font-bold text-slate-900">Start Attendance Session</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <form onSubmit={createSession} className="p-5 space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Select Course</label>
                <select value={sCourse} onChange={(e) => setSCourse(e.target.value)} required className="input-field">
                  <option value="">Choose a course</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
                </select>
              </div>
              <div className="bg-cyan-50 rounded-xl p-3 flex items-start gap-2">
                <MapPin className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-cyan-700">A unique QR code will be generated. Students enter the code to mark themselves present.</p>
              </div>
              <button type="submit" className="btn-primary w-full">Generate QR Code</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
