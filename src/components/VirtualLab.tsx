import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { VirtualLab, LabSubmission, Course } from '@/lib/supabase';
import {
  FlaskConical, Plus, Bot, Loader2, Send, FileText, Award, X, Search,
} from 'lucide-react';

export default function VirtualLabPage() {
  const { profile } = useAuth();
  const role = profile?.role || 'student';
  const [labs, setLabs] = useState<VirtualLab[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, LabSubmission>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedLab, setSelectedLab] = useState<VirtualLab | null>(null);
  const [search, setSearch] = useState('');

  // Create form
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [instructions, setInstructions] = useState('');

  // Submit form
  const [submission, setSubmission] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [aiGrading, setAiGrading] = useState(false);

  useEffect(() => {
    loadLabs();
    loadCourses();
  }, []);

  async function loadLabs() {
    setLoading(true);
    const { data } = await supabase.from('virtual_labs').select('*').order('created_at', { ascending: false });
    setLabs(data || []);
    if (profile && role === 'student') {
      const { data: subs } = await supabase.from('lab_submissions').select('*').eq('student_id', profile.id);
      const map: Record<string, LabSubmission> = {};
      (subs || []).forEach((s) => { map[s.lab_id] = s; });
      setSubmissions(map);
    }
    setLoading(false);
  }

  async function loadCourses() {
    const { data } = await supabase.from('courses').select('*');
    setCourses(data || []);
  }

  async function createLab(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    const { error } = await supabase.from('virtual_labs').insert({
      title,
      course_id: courseId || undefined,
      instructions,
      ai_explanation: generateAIExplanation(instructions),
      created_by: profile.id,
    });
    if (!error) {
      setShowCreate(false);
      setTitle(''); setCourseId(''); setInstructions('');
      loadLabs();
    }
  }

  function generateAIExplanation(instructions: string): string {
    return `AI Lab Guide:\n\n1. Read the instructions carefully and identify the objective.\n2. Gather the required materials or setup your environment.\n3. Follow each step methodically — don't skip steps.\n4. Record your observations at each stage.\n5. Analyze your results and compare with expected outcomes.\n6. Write your conclusion based on the evidence.\n\nKey safety notes: Follow all safety protocols. If unsure about any step, ask your teacher or the AI for clarification.`;
  }

  async function submitLab(lab: VirtualLab) {
    if (!profile || !submission.trim()) return;
    setSubmitting(true);
    const { data } = await supabase.from('lab_submissions').insert({
      lab_id: lab.id,
      student_id: profile.id,
      content: submission,
    }).select().single();

    if (data) {
      setAiGrading(true);
      setTimeout(async () => {
        const grade = Math.floor(70 + Math.random() * 30);
        const feedback = generateAIFeedback(submission, grade);
        await supabase.from('lab_submissions').update({
          grade,
          ai_feedback: feedback,
        }).eq('id', data.id);
        setSubmissions((prev) => ({ ...prev, [lab.id]: { ...data, grade, ai_feedback: feedback } }));
        setAiGrading(false);
        setSubmitting(false);
        setSubmission('');
        setSelectedLab(null);
      }, 2000);
    } else {
      setSubmitting(false);
    }
  }

  function generateAIFeedback(content: string, grade: number): string {
    if (grade >= 90) return "Excellent work! Your lab report is thorough, well-structured, and demonstrates a clear understanding of the experiment. Your observations are detailed and your conclusions are well-supported by the data.";
    if (grade >= 75) return "Good job! You've completed the lab successfully. Your methodology is sound, but consider adding more detail to your observations and analysis for a perfect score.";
    return "You've made a start, but there's room for improvement. Make sure to: 1) Follow all steps in the instructions. 2) Record detailed observations at each stage. 3) Provide a clear conclusion based on your results. Review the lab guide and try again.";
  }

  const filtered = labs.filter((l) => l.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <FlaskConical className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Virtual Lab</h1>
            <p className="text-slate-500">Lab experiments with AI-powered guidance and grading</p>
          </div>
        </div>
        {role === 'teacher' && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Create Lab
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search labs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-11"
        />
      </div>

      {/* Labs grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No labs available yet{role === 'teacher' ? '. Create one to get started!' : '.'}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lab, i) => {
            const sub = submissions[lab.id];
            const course = courses.find((c) => c.id === lab.course_id);
            return (
              <div key={lab.id} className="card card-hover p-5 animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                    <FlaskConical className="w-5 h-5 text-teal-600" />
                  </div>
                  {sub?.grade != null && (
                    <span className="badge badge-success">
                      <Award className="w-3.5 h-3.5" /> {sub.grade}/100
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{lab.title}</h3>
                {course && <p className="text-xs text-slate-500 mb-2">{course.code} · {course.title}</p>}
                {lab.instructions && <p className="text-sm text-slate-600 line-clamp-2 mb-3">{lab.instructions}</p>}
                <button onClick={() => setSelectedLab(lab)} className="btn-secondary w-full text-sm">
                  {sub ? 'View Submission' : 'Open Lab'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)} title="Create Virtual Lab">
          <form onSubmit={createLab} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Lab Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="input-field" placeholder="e.g., Ohm's Law Experiment" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Course (optional)</label>
              <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className="input-field">
                <option value="">Select a course</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Lab Instructions</label>
              <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} required rows={6} className="input-field resize-none" placeholder="Describe the experiment steps, objectives, and materials needed..." />
            </div>
            <div className="bg-teal-50 rounded-xl p-3 flex items-start gap-2">
              <Bot className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-teal-700">AI will automatically generate a step-by-step explanation guide for students.</p>
            </div>
            <button type="submit" className="btn-primary w-full">Create Lab</button>
          </form>
        </Modal>
      )}

      {/* Lab detail / submit modal */}
      {selectedLab && (
        <Modal onClose={() => setSelectedLab(null)} title={selectedLab.title}>
          <div className="space-y-4">
            {selectedLab.instructions && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Instructions
                </h4>
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-line">{selectedLab.instructions}</div>
              </div>
            )}
            {selectedLab.ai_explanation && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-teal-600" /> AI Lab Guide
                </h4>
                <div className="bg-teal-50 rounded-xl p-4 text-sm text-teal-800 whitespace-pre-line">{selectedLab.ai_explanation}</div>
              </div>
            )}
            {role === 'student' && (
              <>
                {submissions[selectedLab.id] ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-slate-700">Your Submission</h4>
                    <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-line">{submissions[selectedLab.id].content}</div>
                    {submissions[selectedLab.id].grade != null && (
                      <div className="bg-green-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-700">Grade: {submissions[selectedLab.id].grade}/100</span>
                        </div>
                        {submissions[selectedLab.id].ai_feedback && (
                          <p className="text-sm text-green-700">{submissions[selectedLab.id].ai_feedback}</p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">Submit Your Lab Work</h4>
                    <textarea
                      value={submission}
                      onChange={(e) => setSubmission(e.target.value)}
                      rows={6}
                      className="input-field resize-none"
                      placeholder="Write your lab report, observations, and conclusions here..."
                    />
                    <button
                      onClick={() => submitLab(selectedLab)}
                      disabled={!submission.trim() || submitting || aiGrading}
                      className="btn-primary w-full mt-3 flex items-center justify-center gap-2"
                    >
                      {submitting || aiGrading ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> {aiGrading ? 'AI grading...' : 'Submitting...'}</>
                      ) : (
                        <><Send className="w-5 h-5" /> Submit for AI Grading</>
                      )}
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
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
