import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import { useGamification } from '@/contexts/GamificationContext.jsx';

const TYPE_STYLES = {
  badge: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
  xp:    'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
  tip:   'bg-primary/10 border-primary/20 text-primary',
  info:  'bg-muted/40 border-border/30 text-muted-foreground',
};

const NotificationBell = () => {
  const { notifications, unreadCount, markAllRead, clearNotifications } = useGamification();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(v => !v);
    if (!open && unreadCount > 0) markAllRead();
  };

  const formatTime = (ts) => {
    const diff = Date.now() - new Date(ts).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleOpen}
        className="relative h-10 w-10 flex items-center justify-center rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-destructive text-white text-[10px] font-black rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 z-50 w-80 card-glass rounded-2xl border border-border/40 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                <span className="text-sm font-bold">Notifications</span>
                {notifications.length > 0 && (
                  <span className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded-full text-muted-foreground">{notifications.length}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {notifications.length > 0 && (
                  <button onClick={clearNotifications} className="p-1 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors" title="Clear all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-muted/50 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Bell className="w-8 h-8 text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">No notifications yet</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Complete analyses to earn badges & XP</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors ${!n.read ? 'bg-primary/5' : ''}`}
                  >
                    <span className="text-lg shrink-0 mt-0.5">{n.icon || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{n.title}</p>
                      <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-1">{formatTime(n.timestamp)}</p>
                    </div>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
