import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Skill, SkillEnrollment } from '@/lib/supabase';
import {
  Rocket, Plus, Loader2, X, Code, Globe, Database, Brain,
  Smartphone, Cloud, Shield, Palette, Award, TrendingUp, CheckCircle2,
} from 'lucide-react';

const iconMap: Record<string, typeof Code> = {
  code: Code, globe: Globe, database: Database, brain: Brain,
  smartphone: Smartphone, cloud: Cloud, shield: Shield, palette: Palette,
};

export default function Skills() {
  const { profile } = useAuth();
  const role = profile?.role || 'student';
  const [skills, setSkills] = useState<Skill[]>([]);
  const [enrollments, setEnrollments] = useState<Record<string, SkillEnrollment>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Skill | null>(null);

  const [sName, setSName] = useState('');
  const [sCategory, setSCategory] = useState('');
  const [sDesc, setSDesc] = useState('');
  const [sIcon, setSIcon] = useState('code');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('skills').select('*').order('name');
    setSkills(data || []);
    if (profile && role === 'student') {
      const { data: eData } = await supabase.from('skill_enrollments').select('*').eq('student_id', profile.id);
      const map: Record<string, SkillEnrollment> = {};
      (eData || []).forEach((e) => { map[e.skill_id] = e; });
      setEnrollments(map);
    }
    setLoading(false);
  }

  async function enroll(skill: Skill) {
    if (!profile) return;
    const { data } = await supabase.from('skill_enrollments').insert({
      skill_id: skill.id,
      student_id: profile.id,
    }).select().single();
    if (data) {
      setEnrollments((prev) => ({ ...prev, [skill.id]: data }));
    }
  }

  async function updateProgress(skill: Skill, progress: number) {
    const enr = enrollments[skill.id];
    if (!enr) return;
    const completed = progress >= 100;
    await supabase.from('skill_enrollments').update({ progress, completed }).eq('id', enr.id);
    setEnrollments((prev) => ({ ...prev, [skill.id]: { ...enr, progress, completed } }));
  }

  async function createSkill(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('skills').insert({
      name: sName, category: sCategory, description: sDesc, icon: sIcon,
    });
    if (!error) {
      setShowCreate(false);
      setSName(''); setSCategory(''); setSDesc(''); setSIcon('code');
      load();
    }
  }

  const enrolled = Object.values(enrollments);
  const completed = enrolled.filter((e) => e.completed).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Projects & Skills</h1>
            <p className="text-slate-500">Learn new skills, build projects, earn diplomas</p>
          </div>
        </div>
        {role === 'teacher' && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add Skill Track
          </button>
        )}
      </div>

      {role === 'student' && enrolled.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center mb-2"><Rocket className="w-5 h-5 text-indigo-600" /></div>
            <p className="text-2xl font-bold text-slate-900">{enrolled.length}</p>
            <p className="text-sm text-slate-500">Learning</p>
          </div>
          <div className="card p-5">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-2"><CheckCircle2 className="w-5 h-5 text-green-600" /></div>
            <p className="text-2xl font-bold text-slate-900">{completed}</p>
            <p className="text-sm text-slate-500">Completed</p>
          </div>
          <div className="card p-5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-2"><Award className="w-5 h-5 text-amber-600" /></div>
            <p className="text-2xl font-bold text-slate-900">{completed}</p>
            <p className="text-sm text-slate-500">Diplomas</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map((skill, i) => {
            const Icon = iconMap[skill.icon || ''] || Code;
            const enr = enrollments[skill.id];
            return (
              <div key={skill.id} className="card card-hover p-5 animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  {enr?.completed && <span className="badge badge-success"><Award className="w-3.5 h-3.5" /> Diploma</span>}
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{skill.name}</h3>
                {skill.category && <p className="text-xs text-slate-500 mb-2">{skill.category}</p>}
                {skill.description && <p className="text-sm text-slate-600 line-clamp-2 mb-3">{skill.description}</p>}
                {enr && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                      <span>Progress</span><span>{enr.progress}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${enr.progress}%` }} />
                    </div>
                  </div>
                )}
                {role === 'student' && !enr && (
                  <button onClick={() => enroll(skill)} className="btn-primary w-full text-sm">Enroll</button>
                )}
                {role === 'student' && enr && !enr.completed && (
                  <button onClick={() => setSelected(skill)} className="btn-secondary w-full text-sm">Continue Learning</button>
                )}
                {role === 'student' && enr?.completed && (
                  <div className="text-center text-sm text-green-600 font-semibold flex items-center justify-center gap-1.5">
                    <Award className="w-4 h-4" /> Completed
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Skill detail / progress */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="font-bold text-slate-900">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600">{selected.description}</p>
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-2 block">Update Progress: {enrollments[selected.id]?.progress || 0}%</label>
                <input
                  type="range"
                  min="0" max="100" step="10"
                  value={enrollments[selected.id]?.progress || 0}
                  onChange={(e) => updateProgress(selected, parseInt(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
              {enrollments[selected.id]?.completed && (
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <Award className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <p className="font-semibold text-green-700">Diploma Earned!</p>
                  <p className="text-sm text-green-600">You've completed {selected.name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create skill modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="font-bold text-slate-900">Add Skill Track</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <form onSubmit={createSkill} className="p-5 space-y-4">
              <input type="text" value={sName} onChange={(e) => setSName(e.target.value)} required className="input-field" placeholder="Skill name (e.g. Python)" />
              <input type="text" value={sCategory} onChange={(e) => setSCategory(e.target.value)} className="input-field" placeholder="Category (e.g. Programming)" />
              <textarea value={sDesc} onChange={(e) => setSDesc(e.target.value)} rows={3} className="input-field resize-none" placeholder="Description" />
              <div>
                <label className="text-sm font-semibold text-slate-700 mb-1.5 block">Icon</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(iconMap).map(([key, Icon]) => (
                    <button key={key} type="button" onClick={() => setSIcon(key)} className={`p-3 rounded-xl border-2 transition-all ${sIcon === key ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
                      <Icon className={`w-5 h-5 mx-auto ${sIcon === key ? 'text-indigo-600' : 'text-slate-400'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn-primary w-full">Add Skill Track</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
