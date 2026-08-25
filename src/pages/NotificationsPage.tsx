import { useState, useEffect } from 'react';
import { Bell, BellOff, Package, Tag, Info, CheckCheck, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { notificationService, Notification } from '../services/notificationService';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function NotifIcon({ type }: { type: Notification['type'] }) {
  const cls = 'w-9 h-9 rounded-tr-lg rounded-bl-lg flex items-center justify-center flex-shrink-0';
  if (type === 'ORDER') return <div className={`${cls} bg-[#34150F]/10`}><Package size={18} className="text-[#34150F]" /></div>;
  if (type === 'PROMO') return <div className={`${cls} bg-[#D39858]/20`}><Tag size={18} className="text-[#D39858]" /></div>;
  return <div className={`${cls} bg-[#85431E]/10`}><Bell size={18} className="text-[#85431E]" /></div>;
}

type Filter = 'all' | 'unread' | 'ORDER' | 'PROMO';

export function NotificationsPage() {
  const { isAuthenticated, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [marking, setMarking] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) { openAuthModal('login'); navigate('/', { replace: true }); return; }
    load();
  }, [isAuthenticated]);

  const load = async () => {
    setLoading(true);
    const res = await notificationService.getAll({ limit: 50 });
    if (res.success && res.data) setNotifications(res.data.notifications ?? []);
    setLoading(false);
  };

  const handleMarkRead = async (id: string) => {
    setMarking(id);
    await notificationService.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setMarking(null);
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'ORDER') return n.type === 'ORDER';
    if (filter === 'PROMO') return n.type === 'PROMO';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: `Unread (${unreadCount})` },
    { key: 'ORDER', label: 'Orders' },
    { key: 'PROMO', label: 'Promotions' },
  ];

  return (
    <div className="min-h-screen bg-[#EACEAA] px-3 sm:px-4 py-4 sm:py-8 pb-20 sm:pb-12 md:px-8 lg:px-16" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#34150F]" style={{ fontFamily: "'Gilda Display', serif" }}>Notifications</h1>
            {unreadCount > 0 && <p className="text-xs sm:text-sm text-[#85431E] mt-0.5">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#34150F] bg-[#f5e8d4] hover:bg-[#D39858] hover:text-[#34150F] px-3 py-1.5 sm:px-4 sm:py-2 rounded-tr-xl rounded-bl-xl transition-all border border-[rgba(52,21,15,0.1)] shadow-2xs">
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto no-scrollbar touch-pan-x pb-1">
          {filters.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={`whitespace-nowrap px-3 py-1.5 sm:px-4 sm:py-2 rounded-tr-xl rounded-bl-xl text-xs sm:text-sm font-semibold transition-all border shrink-0 ${
              filter === f.key
                ? 'bg-[#34150F] text-[#EACEAA] border-transparent shadow-xs'
                : 'bg-[#f5e8d4] text-[#85431E] border-[rgba(52,21,15,0.1)] hover:border-[#D39858] hover:text-[#34150F]'
            }`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-[#f5e8d4] rounded-tr-2xl rounded-bl-2xl p-4 flex gap-3 animate-pulse">
                <div className="w-9 h-9 rounded-tr-lg rounded-bl-lg bg-[#34150F]/10 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-[#34150F]/10 rounded w-3/4" />
                  <div className="h-3 bg-[#34150F]/10 rounded w-full" />
                  <div className="h-3 bg-[#34150F]/10 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-[#f5e8d4] rounded-tr-3xl rounded-bl-3xl flex items-center justify-center mx-auto mb-4">
              <BellOff size={36} className="text-[#85431E]/50" />
            </div>
            <h3 className="text-lg font-bold text-[#34150F] mb-1" style={{ fontFamily: "'Gilda Display', serif" }}>All caught up!</h3>
            <p className="text-[#85431E] text-sm">No {filter !== 'all' ? filter.toLowerCase() + ' ' : ''}notifications right now.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(notif => (
              <div key={notif.id} className={`flex gap-3 p-4 rounded-tr-2xl rounded-bl-2xl border transition-all ${
                notif.isRead
                  ? 'bg-[#f5e8d4] border-[rgba(52,21,15,0.08)]'
                  : 'bg-white/60 border-l-4 border-l-[#D39858] border-[rgba(52,21,15,0.08)] shadow-sm'
              }`}>
                <NotifIcon type={notif.type} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-bold text-[#34150F] leading-snug ${!notif.isRead ? 'font-extrabold' : ''}`}>{notif.title}</p>
                    {!notif.isRead && (
                      <button onClick={() => handleMarkRead(notif.id)} disabled={marking === notif.id} className="flex-shrink-0 text-[#85431E] hover:text-[#D39858] transition-colors" title="Mark as read">
                        <Check size={15} />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-[#85431E] mt-0.5 leading-relaxed">{notif.message}</p>
                  <span className="text-[10px] text-[#85431E]/60 mt-1 block">{timeAgo(notif.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
