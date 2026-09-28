import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { LibraryBook, BookRead } from '@/lib/supabase';
import {
  Library, Search, Loader2, BookOpen, X, Plus, Star, TrendingUp,
} from 'lucide-react';

export default function LibraryPage() {
  const { profile } = useAuth();
  const role = profile?.role || 'student';
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [reads, setReads] = useState<Record<string, BookRead>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState<LibraryBook | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const [bTitle, setBTitle] = useState('');
  const [bAuthor, setBAuthor] = useState('');
  const [bCategory, setBCategory] = useState('');
  const [bDesc, setBDesc] = useState('');
  const [bCover, setBCover] = useState('');
  const [bUrl, setBUrl] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('library_books').select('*').order('read_count', { ascending: false });
    setBooks(data || []);
    if (profile) {
      const { data: rData } = await supabase.from('book_reads').select('*').eq('student_id', profile.id);
      const map: Record<string, BookRead> = {};
      (rData || []).forEach((r) => { map[r.book_id] = r; });
      setReads(map);
    }
    setLoading(false);
  }

  async function readBook(book: LibraryBook) {
    if (!profile) return;
    setSelected(book);
    await supabase.from('library_books').update({ read_count: (book.read_count || 0) + 1 }).eq('id', book.id);
    const existing = reads[book.id];
    if (!existing) {
      const { data } = await supabase.from('book_reads').insert({
        book_id: book.id,
        student_id: profile.id,
        progress: 1,
      }).select().single();
      if (data) setReads((prev) => ({ ...prev, [book.id]: data }));
    } else {
      const newProgress = Math.min(100, existing.progress + 10);
      await supabase.from('book_reads').update({ progress: newProgress, last_read_at: new Date().toISOString() }).eq('id', existing.id);
      setReads((prev) => ({ ...prev, [book.id]: { ...existing, progress: newProgress } }));
    }
    load();
  }

  async function addBook(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from('library_books').insert({
      title: bTitle,
      author: bAuthor,
      category: bCategory,
      description: bDesc,
      cover_url: bCover,
      content_url: bUrl,
    });
    if (!error) {
      setShowCreate(false);
      setBTitle(''); setBAuthor(''); setBCategory(''); setBDesc(''); setBCover(''); setBUrl('');
      load();
    }
  }

  const categories: string[] = ['all', ...Array.from(new Set(books.map((b) => b.category).filter((c): c is string => Boolean(c))))];
  const filtered = books.filter((b) => {
    const matchSearch = b.title.toLowerCase().includes(search.toLowerCase()) || (b.author || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'all' || b.category === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Library className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">E-Library</h1>
            <p className="text-slate-500">Thousands of books at your fingertips</p>
          </div>
        </div>
        {role === 'teacher' && (
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add Book
          </button>
        )}
      </div>

      {/* Search & filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Search by title or author..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-11" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`badge cursor-pointer whitespace-nowrap ${category === c ? 'badge-info' : 'badge-neutral'}`}
            >
              {c === 'all' ? 'All' : c}
            </button>
          ))}
        </div>
      </div>

      {/* Books grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Library className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No books found</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((book, i) => {
            const read = reads[book.id];
            return (
              <button
                key={book.id}
                onClick={() => readBook(book)}
                className="card card-hover p-3 text-left animate-slide-up group"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gradient-to-br from-slate-200 to-slate-300 mb-3 flex items-center justify-center">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <BookOpen className="w-10 h-10 text-slate-400" />
                  )}
                </div>
                <h3 className="font-semibold text-sm text-slate-900 line-clamp-1">{book.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-1">{book.author}</p>
                {read && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${read.progress}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{read.progress}% read</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Book detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-48 bg-gradient-to-br from-amber-500 to-amber-700 rounded-t-2xl flex items-center justify-center">
              {selected.cover_url && <img src={selected.cover_url} alt={selected.title} className="absolute inset-0 w-full h-full object-cover rounded-t-2xl opacity-80" />}
              <button onClick={() => setSelected(null)} className="absolute top-3 right-3 p-2 rounded-lg bg-black/20 hover:bg-black/30">
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-1">{selected.title}</h2>
              <p className="text-slate-500 mb-3">by {selected.author}</p>
              {selected.category && <span className="badge badge-warning mb-3">{selected.category}</span>}
              {selected.description && <p className="text-sm text-slate-600 mb-4">{selected.description}</p>}
              <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4" /> {selected.read_count} reads</span>
                {reads[selected.id] && <span className="flex items-center gap-1"><Star className="w-4 h-4 text-amber-500" /> {reads[selected.id].progress}% complete</span>}
              </div>
              <button onClick={() => { setSelected(null); }} className="btn-primary w-full flex items-center justify-center gap-2">
                <BookOpen className="w-5 h-5" /> Start Reading
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add book modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="font-bold text-slate-900">Add Book</h2>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <form onSubmit={addBook} className="p-5 space-y-4">
              <input type="text" value={bTitle} onChange={(e) => setBTitle(e.target.value)} required className="input-field" placeholder="Book title" />
              <input type="text" value={bAuthor} onChange={(e) => setBAuthor(e.target.value)} className="input-field" placeholder="Author" />
              <input type="text" value={bCategory} onChange={(e) => setBCategory(e.target.value)} className="input-field" placeholder="Category (e.g. Physics)" />
              <textarea value={bDesc} onChange={(e) => setBDesc(e.target.value)} rows={3} className="input-field resize-none" placeholder="Description" />
              <input type="url" value={bCover} onChange={(e) => setBCover(e.target.value)} className="input-field" placeholder="Cover image URL" />
              <input type="url" value={bUrl} onChange={(e) => setBUrl(e.target.value)} className="input-field" placeholder="Content URL (PDF/link)" />
              <button type="submit" className="btn-primary w-full">Add Book</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
