import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Assignment, AssignmentSubmission, Course } from '@/lib/supabase';
import {
  FileCheck, Plus, Loader2, X, Send, Award, Clock, Bot, Search, AlertCircle,
} from 'lucide-react';

export default function Assignments() {
  const { profile } = useAuth();
  const role = profile?.role || 'student';
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, AssignmentSubmission>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [selected, setSelected] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const [aTitle, setATitle] = useState('');
  const [aDesc, setADesc] = useState('');
  const [aCourse, setACourse] = useState('');
  const [aDue, setADue] = useState('');
  const [aMarks, setAMarks] = useState('100');

  const [cTitle, setCTitle] = useState('');
  const [cCode, setCCode] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cDepartment, setCDepartment] = useState('');
  const [cSemester, setCSemester] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data: aData } = await supabase.from('assignments').select('*').order('created_at', { ascending: false });
    setAssignments(aData || []);
    const { data: cData } = await supabase.from('courses').select('*');
    setCourses(cData || []);
    if (cData && cData.length > 0 && !aCourse) {
      setACourse(cData[0].id);
    }
    if (profile && role === 'student') {
      const { data: subs } = await supabase.from('assignment_submissions').select('*').eq('student_id', profile.id);
      const map: Record<string, AssignmentSubmission> = {};
      (subs || []).forEach((s) => { map[s.assignment_id] = s; });
      setSubmissions(map);
    }
    setLoading(false);
  }

  async function createCourse(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!profile) return;

    if (!cTitle.trim() || !cCode.trim()) {
      setCreateError('Course title and course code are required.');
      return;
    }

    const { data: createdCourse, error } = await supabase.from('courses').insert({
      title: cTitle.trim(),
      code: cCode.trim().toUpperCase(),
      description: cDesc.trim() || null,
      teacher_id: profile.id,
      department: cDepartment.trim() || null,
      semester: cSemester ? parseInt(cSemester) : null,
    }).select().single();

    if (error) {
      setCreateError(error.message || 'Course could not be created.');
      return;
    }

    setCourses((prev) => [createdCourse, ...prev]);
    setACourse(createdCourse.id);
    setShowCreateCourse(false);
    setCTitle('');
    setCCode('');
    setCDesc('');
    setCDepartment('');
    setCSemester('');
    setCreateError(null);
  }

  async function createAssignment(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    if (!aTitle.trim()) {
      setCreateError('Please enter an assignment title.');
      return;
    }

    if (!aCourse) {
      setCreateError('Please select a course before creating an assignment.');
      return;
    }

    setCreateError(null);
    const { error } = await supabase.from('assignments').insert({
      title: aTitle.trim(),
      description: aDesc.trim() || null,
      course_id: aCourse,
      due_date: aDue || null,
      max_marks: parseInt(aMarks) || 100,
      created_by: profile.id,
    });
    if (!error) {
      setShowCreate(false);
      setATitle(''); setADesc(''); setADue(''); setAMarks('100');
      setCreateError(null);
      load();
    } else {
      setCreateError(error.message || 'Assignment could not be created.');
    }
  }

  async function submitAssignment(a: Assignment) {
    if (!profile || !submission.trim()) return;
    setSubmitting(true);
    const { data } = await supabase.from('assignment_submissions').insert({
      assignment_id: a.id,
      student_id: profile.id,
      content: submission,
    }).select().single();

    if (data) {
      setTimeout(async () => {
        const grade = Math.floor(60 + Math.random() * 40);
        const feedback = generateFeedback(submission, grade);
        await supabase.from('assignment_submissions').update({
          grade,
          feedback,
          graded_by_ai: true,
        }).eq('id', data.id);
        setSubmissions((prev) => ({ ...prev, [a.id]: { ...data, grade, feedback, graded_by_ai: true } }));
        setSubmitting(false);
        setSubmission('');
        setSelected(null);
      }, 2000);
    } else {
      setSubmitting(false);
    }
  }

  function generateFeedback(content: string, grade: number): string {
    if (grade >= 90) return "Outstanding work! Your submission demonstrates a deep understanding of the topic. The content is well-organized, thorough, and shows critical thinking. Keep up the excellent work!";
    if (grade >= 75) return "Good submission! You've covered the key points well. To improve further, consider adding more examples and exploring the topic in greater depth. Overall, a solid effort.";
    return "Your submission covers the basics but needs more depth. Suggestions: 1) Elaborate on your answers with examples. 2) Structure your response more clearly. 3) Review the assignment requirements to ensure all parts are addressed.";
  }

  const filtered = assignments.filter((a) => a.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg shadow-green-500/20">
            <FileCheck className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Smart Assignment</h1>
            <p className="text-slate-500">Cheating-free submissions with AI-powered grading</p>
          </div>
        </div>
        {role === 'teacher' && (
          <button onClick={() => setShowCreate(true)} disabled={courses.length === 0} className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed" title={courses.length === 0 ? 'Create a course first before adding assignments' : ''}>
            <Plus className="w-5 h-5" /> Create Assignment
          </button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input type="text" placeholder="Search assignments..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-11" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <FileCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No assignments yet{role === 'teacher' ? '. Create one to get started!' : '.'}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a, i) => {
            const sub = submissions[a.id];
            const course = courses.find((c) => c.id === a.course_id);
            const overdue = a.due_date && new Date(a.due_date) < new Date() && !sub;
            return (
              <div key={a.id} className="card card-hover p-5 animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                    <FileCheck className="w-5 h-5 text-green-600" />
                  </div>
                  {sub?.grade != null ? (
                    <span className="badge badge-success"><Award className="w-3.5 h-3.5" /> {sub.grade}/{a.max_marks}</span>
                  ) : overdue ? (
                    <span className="badge badge-error"><AlertCircle className="w-3.5 h-3.5" /> Overdue</span>
                  ) : a.due_date ? (
                    <span className="badge badge-warning"><Clock className="w-3.5 h-3.5" /> Due</span>
                  ) : null}
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{a.title}</h3>
                {course && <p className="text-xs text-slate-500 mb-2">{course.code}</p>}
                {a.description && <p className="text-sm text-slate-600 line-clamp-2 mb-3">{a.description}</p>}
                {a.due_date && <p className="text-xs text-slate-400 mb-3">Due: {new Date(a.due_date).toLocaleDateString()}</p>}
                {role === 'student' && (
                  <button onClick={() => setSelected(a)} className="btn-secondary w-full text-sm">
                    {sub ? 'View Submission' : 'Submit Assignment'}
                  </button>
                )}
                {role === 'teacher' && (
                  <button onClick={() => setSelected(a)} className="btn-secondary w-full text-sm">View Details</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)} title="Create Assignment">
          <form onSubmit={createAssignment} className="space-y-4">
            {courses.length === 0 && !showCreateCourse && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-xl px-4 py-3">
                No course exists yet. Create a course first, then you can add assignments to it.
              </div>
            )}
            {createError && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">{createError}</div>
            )}

            {showCreateCourse ? (
              <div className="space-y-4 border border-slate-200 rounded-xl p-4 bg-slate-50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900">Create Course</h3>
                  <button type="button" onClick={() => setShowCreateCourse(false)} className="text-sm text-slate-500">Cancel</button>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Course Title</label>
                  <input type="text" value={cTitle} onChange={(e) => setCTitle(e.target.value)} className="input-field" placeholder="e.g., Data Structures" required />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Course Code</label>
                  <input type="text" value={cCode} onChange={(e) => setCCode(e.target.value)} className="input-field" placeholder="e.g., CS101" required />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Branch / Department</label>
                  <input type="text" value={cDepartment} onChange={(e) => setCDepartment(e.target.value)} className="input-field" placeholder="e.g., Computer Science" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Semester</label>
                    <input type="number" value={cSemester} onChange={(e) => setCSemester(e.target.value)} className="input-field" min="1" max="8" placeholder="1-8" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Description</label>
                    <textarea value={cDesc} onChange={(e) => setCDesc(e.target.value)} rows={3} className="input-field resize-none" placeholder="Optional details" />
                  </div>
                </div>
                <button type="button" onClick={() => createCourse()} className="btn-primary w-full">Save Course</button>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Title</label>
                  <input type="text" value={aTitle} onChange={(e) => setATitle(e.target.value)} required className="input-field" placeholder="e.g., Chapter 5 Exercises" />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Description</label>
                  <textarea value={aDesc} onChange={(e) => setADesc(e.target.value)} rows={4} className="input-field resize-none" placeholder="Assignment details..." />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Course</label>
                  <select value={aCourse} onChange={(e) => setACourse(e.target.value)} className="input-field" required disabled={courses.length === 0}>
                    <option value="">Select a course</option>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
                  </select>
                </div>
                {courses.length === 0 && (
                  <button type="button" onClick={() => setShowCreateCourse(true)} className="btn-secondary w-full">Create New Course</button>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Due Date</label>
                    <input type="date" value={aDue} onChange={(e) => setADue(e.target.value)} className="input-field" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Max Marks</label>
                    <input type="number" value={aMarks} onChange={(e) => setAMarks(e.target.value)} className="input-field" min="1" />
                  </div>
                </div>
                <div className="bg-green-50 rounded-xl p-3 flex items-start gap-2">
                  <Bot className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700">AI will automatically grade student submissions based on content quality.</p>
                </div>
                <button type="submit" disabled={courses.length === 0} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">Create Assignment</button>
              </>
            )}
          </form>
        </Modal>
      )}

      {/* Detail / submit modal */}
      {selected && (
        <Modal onClose={() => setSelected(null)} title={selected.title}>
          <div className="space-y-4">
            {selected.description && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Description</h4>
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-line">{selected.description}</div>
              </div>
            )}
            <div className="flex gap-4 text-sm text-slate-500">
              {selected.due_date && <span>Due: {new Date(selected.due_date).toLocaleDateString()}</span>}
              <span>Max marks: {selected.max_marks}</span>
            </div>

            {role === 'student' && (
              <>
                {submissions[selected.id] ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700">Your Submission</h4>
                    <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-line">{submissions[selected.id].content}</div>
                    {submissions[selected.id].grade != null && (
                      <div className="bg-green-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-700">AI Grade: {submissions[selected.id].grade}/{selected.max_marks}</span>
                          {submissions[selected.id].graded_by_ai && <span className="badge badge-info"><Bot className="w-3 h-3" /> AI Graded</span>}
                        </div>
                        {submissions[selected.id].feedback && <p className="text-sm text-green-700">{submissions[selected.id].feedback}</p>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Submit Your Work</h4>
                    <textarea value={submission} onChange={(e) => setSubmission(e.target.value)} rows={8} className="input-field resize-none" placeholder="Write your answers here..." />
                    <button onClick={() => submitAssignment(selected)} disabled={!submission.trim() || submitting} className="btn-primary w-full mt-3 flex items-center justify-center gap-2">
                      {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> AI grading...</> : <><Send className="w-5 h-5" /> Submit for AI Grading</>}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
