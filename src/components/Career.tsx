import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Internship } from '@/lib/supabase';
import {
  Briefcase, Loader2, ExternalLink, MapPin, Building2, Search,
  Clock, TrendingUp,
} from 'lucide-react';

export default function Career() {
  const [jobs, setJobs] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'internship' | 'job' | 'freelance'>('all');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('internships').select('*').order('posted_at', { ascending: false });
    setJobs(data || []);
    setLoading(false);
  }

  const filtered = jobs.filter((j) => {
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || j.type === filter;
    return matchSearch && matchFilter;
  });

  const typeColors: Record<string, string> = {
    internship: 'badge-info', job: 'badge-success', freelance: 'badge-warning',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <Briefcase className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Career & Internship</h1>
          <p className="text-slate-500">Direct links to internships and jobs via LinkedIn</p>
        </div>
      </div>

      {/* Hero banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 p-6 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl" />
        <div className="relative">
          <h2 className="text-xl font-bold mb-1">Launch Your Career</h2>
          <p className="text-sky-100 text-sm">Browse internships and job opportunities. Apply directly through LinkedIn or company websites.</p>
        </div>
      </div>

      {/* Search & filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Search positions or companies..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-11" />
        </div>
        <div className="flex gap-2">
          {(['all', 'internship', 'job', 'freelance'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`badge cursor-pointer capitalize ${filter === f ? 'badge-info' : 'badge-neutral'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs list */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No positions found</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((job, i) => (
            <div key={job.id} className="card card-hover p-5 animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-xl bg-sky-50 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-sky-600" />
                </div>
                <span className={`badge capitalize ${typeColors[job.type]}`}>{job.type}</span>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">{job.title}</h3>
              <p className="text-sm text-slate-500 mb-2">{job.company}</p>
              {job.description && <p className="text-sm text-slate-600 line-clamp-2 mb-3">{job.description}</p>}
              <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                {job.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>}
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(job.posted_at).toLocaleDateString()}</span>
              </div>
              {job.apply_url && job.apply_url !== '#' ? (
                <a href={job.apply_url} target="_blank" rel="noopener noreferrer" className="btn-primary w-full text-sm flex items-center justify-center gap-2">
                  <ExternalLink className="w-4 h-4" /> Apply Now
                </a>
              ) : (
                <button disabled className="btn-secondary w-full text-sm">Coming Soon</button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* LinkedIn CTA */}
      <div className="card p-6 bg-gradient-to-br from-sky-50 to-blue-50">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#0A66C2] flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900">Build Your LinkedIn Profile</h3>
            <p className="text-sm text-slate-600">Connect your LinkedIn account to apply for more opportunities and let recruiters find you.</p>
          </div>
          <a href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer" className="btn-primary text-sm flex items-center gap-2">
            <ExternalLink className="w-4 h-4" /> LinkedIn
          </a>
        </div>
      </div>
    </div>
  );
}
