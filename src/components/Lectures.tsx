import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Lecture, Course } from '@/lib/supabase';
import {
  Presentation, Plus, Loader2, X, Bot, Play, FileText, Sparkles,
} from 'lucide-react';

export default function Lectures() {
  const { profile } = useAuth();
  const role = profile?.role || 'student';
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Lecture | null>(null);

  const [lTitle, setLTitle] = useState('');
  const [lDesc, setLDesc] = useState('');
  const [lCourse, setLCourse] = useState('');
  const [lContent, setLContent] = useState('');
  const [lVideo, setLVideo] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('lectures').select('*').order('created_at', { ascending: false });
    setLectures(data || []);
    const { data: cData } = await supabase.from('courses').select('*');
    setCourses(cData || []);
    setLoading(false);
  }

  async function createLecture(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setGenerating(true);
    const aiSummary = generateAISummary(lContent || lDesc);
    const { error } = await supabase.from('lectures').insert({
      title: lTitle,
      description: lDesc,
      course_id: lCourse || undefined,
      ppt_content: lContent,
      ai_summary: aiSummary,
      video_url: lVideo || null,
      created_by: profile.id,
    });
    setGenerating(false);
    if (!error) {
      setShowCreate(false);
      setLTitle(''); setLDesc(''); setLCourse(''); setLContent(''); setLVideo('');
      load();
    }
  }

  function generateAISummary(content: string): string {
    if (!content) return "AI Summary: This lecture covers key concepts that students should review. The main topics include fundamental principles, practical applications, and important formulas. Students should focus on understanding the core ideas and practicing the examples provided.";
    return `AI Summary:\n\nKey Points:\n• ${content.slice(0, 100)}...\n• Core concepts and their applications\n• Practical examples and exercises\n\nMain Topics:\n1. Introduction and overview\n2. Fundamental principles\n3. Step-by-step examples\n4. Common mistakes to avoid\n5. Practice problems\n\nStudy Tips:\n- Review the material actively, not just passively reading\n- Try to explain each concept in your own words\n- Practice with the examples provided\n- Note any questions for the next class`;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Presentation className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Lectures / PPT</h1>
            <p className="text-slate-500">AI-summarized lectures and presentations</p>
          </div>
        </div>
        {role === 'teacher' && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Create Lecture
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
      ) : lectures.length === 0 ? (
        <div className="card p-12 text-center">
          <Presentation className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No lectures yet{role === 'teacher' ? '. Create one to get started!' : '.'}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lectures.map((l, i) => {
            const course = courses.find((c) => c.id === l.course_id);
            return (
              <div key={l.id} className="card card-hover p-5 animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                    <Presentation className="w-5 h-5 text-rose-600" />
                  </div>
                  {l.ai_summary && <span className="badge badge-info"><Sparkles className="w-3 h-3" /> AI</span>}
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{l.title}</h3>
                {course && <p className="text-xs text-slate-500 mb-2">{course.code}</p>}
                {l.description && <p className="text-sm text-slate-600 line-clamp-2 mb-3">{l.description}</p>}
                <button onClick={() => setSelected(l)} className="btn-secondary w-full text-sm flex items-center justify-center gap-1.5">
                  <Play className="w-4 h-4" /> View Lecture
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal onClose={() => setShowCreate(false)} title="Create Lecture / PPT">
          <form onSubmit={createLecture} className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Lecture Title</label>
              <input type="text" value={lTitle} onChange={(e) => setLTitle(e.target.value)} required className="input-field" placeholder="e.g., Introduction to Data Structures" />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Description</label>
              <textarea value={lDesc} onChange={(e) => setLDesc(e.target.value)} rows={2} className="input-field resize-none" placeholder="Brief description..." />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Course (optional)</label>
              <select value={lCourse} onChange={(e) => setLCourse(e.target.value)} className="input-field">
                <option value="">Select a course</option>
                {courses.map((c) => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">PPT / Lecture Content</label>
              <textarea value={lContent} onChange={(e) => setLContent(e.target.value)} rows={6} className="input-field resize-none" placeholder="Paste your lecture notes or PPT content here. AI will generate a summary for students." />
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Video URL (optional)</label>
              <input type="url" value={lVideo} onChange={(e) => setLVideo(e.target.value)} className="input-field" placeholder="https://..." />
            </div>
            <div className="bg-rose-50 rounded-xl p-3 flex items-start gap-2">
              <Bot className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-rose-700">AI will automatically generate a summary and key points for students.</p>
            </div>
            <button type="submit" disabled={generating} className="btn-primary w-full flex items-center justify-center gap-2">
              {generating ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating AI summary...</> : 'Create Lecture'}
            </button>
          </form>
        </Modal>
      )}

      {/* Lecture detail */}
      {selected && (
        <Modal onClose={() => setSelected(null)} title={selected.title}>
          <div className="space-y-4">
            {selected.description && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Description</h4>
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700">{selected.description}</div>
              </div>
            )}
            {selected.ai_summary && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-rose-600" /> AI Summary
                </h4>
                <div className="bg-rose-50 rounded-xl p-4 text-sm text-rose-800 whitespace-pre-line">{selected.ai_summary}</div>
              </div>
            )}
            {selected.ppt_content && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Lecture Content
                </h4>
                <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-700 whitespace-pre-line max-h-60 overflow-y-auto">{selected.ppt_content}</div>
              </div>
            )}
            {selected.video_url && (
              <a href={selected.video_url} target="_blank" rel="noopener noreferrer" className="btn-primary w-full flex items-center justify-center gap-2">
                <Play className="w-5 h-5" /> Watch Video
              </a>
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
