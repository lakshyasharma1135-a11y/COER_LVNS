import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/lib/supabase';
import {
  Bell, Loader2, CheckCircle2, AlertCircle, Info, Trash2,
  Check, Inbox,
} from 'lucide-react';

export default function Notifications() {
  const { profile } = useAuth();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    if (profile) {
      const { data } = await supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false });
      setNotifs(data || []);
    }
    setLoading(false);
  }

  async function markRead(n: Notification) {
    if (n.read) return;
    await supabase.from('notifications').update({ read: true }).eq('id', n.id);
    setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
  }

  async function markAllRead() {
    if (!profile) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', profile.id).eq('read', false);
    setNotifs((prev) => prev.map((x) => ({ ...x, read: true })));
  }

  async function deleteNotif(id: string) {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifs((prev) => prev.filter((x) => x.id !== id));
  }

  const filtered = filter === 'all' ? notifs : notifs.filter((n) => !n.read);
  const unreadCount = notifs.filter((n) => !n.read).length;

  function getIcon(type: string) {
    if (type === 'success') return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    if (type === 'warning') return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    if (type === 'error') return <AlertCircle className="w-5 h-5 text-red-500" />;
    return <Info className="w-5 h-5 text-blue-600" />;
  }

  function getBg(type: string) {
    if (type === 'success') return 'bg-green-50';
    if (type === 'warning') return 'bg-yellow-50';
    if (type === 'error') return 'bg-red-50';
    return 'bg-blue-50';
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bell className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
            <p className="text-slate-500">All your updates in one place</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary flex items-center gap-2 text-sm">
            <Check className="w-4 h-4" /> Mark all read
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        <button onClick={() => setFilter('all')} className={`badge cursor-pointer ${filter === 'all' ? 'badge-info' : 'badge-neutral'}`}>
          All ({notifs.length})
        </button>
        <button onClick={() => setFilter('unread')} className={`badge cursor-pointer ${filter === 'unread' ? 'badge-info' : 'badge-neutral'}`}>
          Unread ({unreadCount})
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((n, i) => (
            <div
              key={n.id}
              className={`card p-4 flex items-start gap-3 animate-slide-up cursor-pointer transition-all hover:shadow-md ${!n.read ? 'border-l-4 border-l-blue-500' : ''}`}
              style={{ animationDelay: `${i * 30}ms` }}
              onClick={() => markRead(n)}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${getBg(n.type)}`}>
                {getIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm ${n.read ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>{n.title}</p>
                  {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                </div>
                {n.message && <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>}
                <p className="text-xs text-slate-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
