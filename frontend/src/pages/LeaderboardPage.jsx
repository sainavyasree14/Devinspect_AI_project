import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Trophy, Medal, Zap, Code2, TrendingUp, RefreshCw } from 'lucide-react';
import { API_ORIGIN } from '@/lib/apiConfig';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useGamification } from '@/contexts/GamificationContext.jsx';
import XPBar from '@/components/XPBar.jsx';
import BadgeShowcase from '@/components/BadgeShowcase.jsx';

const MEDAL = { 1: '🥇', 2: '🥈', 3: '🥉' };
const RANK_COLORS = {
  1: 'from-yellow-500/20 to-yellow-600/5 border-yellow-500/30',
  2: 'from-slate-400/20 to-slate-500/5 border-slate-400/30',
  3: 'from-orange-600/20 to-orange-700/5 border-orange-600/30',
};

const LeaderboardPage = () => {
  const { getAuthHeaders, currentUser } = useAuth();
  const { xp, levelInfo, earnedBadges, stats } = useGamification();
  const [board, setBoard]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('analyses');

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_ORIGIN}/api/gamification/leaderboard`, { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) setBoard(data.leaderboard);
    } catch {
      // fallback: empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaderboard(); }, []);

  const sorted = [...board].sort((a, b) => {
    if (tab === 'analyses') return b.totalAnalyses - a.totalAnalyses;
    if (tab === 'score')    return b.avgScore - a.avgScore;
    return b.xp - a.xp;
  }).map((e, i) => ({ ...e, rank: i + 1 }));

  return (
    <>
      <Helmet><title>Leaderboard | DevInspectAI</title></Helmet>
      <div className="w-full min-h-screen py-8 text-foreground bg-background">
        <div className="container mx-auto px-4 lg:px-8 max-w-6xl">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-gradient mb-2 flex items-center gap-3">
                <Trophy className="w-9 h-9 text-yellow-500" /> Leaderboard
              </h1>
              <p className="text-muted-foreground">Compete with developers worldwide. Earn XP, unlock badges, climb the ranks.</p>
            </div>
            <button onClick={fetchLeaderboard} className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left: My Stats */}
            <div className="lg:col-span-4 space-y-4">
              <div className="card-glass p-5 rounded-3xl space-y-4">
                <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Your Stats</h3>
                <XPBar />
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Analyses',  value: stats.totalAnalyses, icon: Code2,      color: 'text-primary' },
                    { label: 'Bugs Found',value: stats.bugCount,      icon: TrendingUp, color: 'text-orange-500' },
                    { label: 'XP Earned', value: xp,                  icon: Zap,        color: 'text-yellow-500' },
                    { label: 'Badges',    value: earnedBadges.length, icon: Medal,      color: 'text-purple-500' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="p-3 bg-muted/20 rounded-xl border border-border/20 text-center">
                      <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
                      <p className="text-lg font-black">{value}</p>
                      <p className="text-[10px] text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Badges */}
              <div className="card-glass p-5 rounded-3xl">
                <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">Your Badges</h3>
                {earnedBadges.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">Complete analyses to earn badges</p>
                ) : (
                  <BadgeShowcase compact />
                )}
              </div>
            </div>

            {/* Right: Leaderboard */}
            <div className="lg:col-span-8">
              <div className="card-glass rounded-3xl overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-border/30 bg-muted/20">
                  {[
                    { key: 'analyses', label: 'Most Analyses' },
                    { key: 'score',    label: 'Highest Score' },
                    { key: 'xp',       label: 'Top XP' },
                  ].map(t => (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={`flex-1 py-3 text-xs font-bold transition-all ${tab === t.key ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {/* Top 3 */}
                {!loading && sorted.length >= 3 && (
                  <div className="grid grid-cols-3 gap-3 p-4 border-b border-border/20">
                    {[sorted[1], sorted[0], sorted[2]].map((entry, i) => {
                      const actualRank = i === 1 ? 1 : i === 0 ? 2 : 3;
                      return (
                        <motion.div
                          key={entry.userId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: i === 1 ? -8 : 0 }}
                          className={`p-3 rounded-2xl border bg-gradient-to-br text-center ${RANK_COLORS[actualRank] || 'border-border/20 bg-muted/10'}`}
                        >
                          <p className="text-2xl mb-1">{MEDAL[actualRank] || '🏅'}</p>
                          <p className="text-xs font-bold truncate">{entry.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {tab === 'analyses' ? `${entry.totalAnalyses} analyses` :
                             tab === 'score'    ? `${entry.avgScore}% avg` :
                                                  `${entry.xp} XP`}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Full list */}
                <div className="divide-y divide-border/20">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-3 animate-pulse">
                        <div className="w-6 h-4 bg-muted/40 rounded" />
                        <div className="w-8 h-8 bg-muted/40 rounded-full" />
                        <div className="flex-1 h-4 bg-muted/40 rounded" />
                        <div className="w-16 h-4 bg-muted/40 rounded" />
                      </div>
                    ))
                  ) : sorted.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground text-sm">
                      No data yet. Complete analyses to appear on the leaderboard!
                    </div>
                  ) : (
                    sorted.map((entry, idx) => {
                      const isMe = String(entry.userId) === String(currentUser?.id);
                      return (
                        <motion.div
                          key={entry.userId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors ${isMe ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                        >
                          <span className="w-6 text-xs font-black text-muted-foreground text-center">
                            {MEDAL[entry.rank] || `#${entry.rank}`}
                          </span>
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-xs font-bold shrink-0">
                            {entry.avatar ? (
                              <img src={entry.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              entry.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">
                              {entry.name} {isMe && <span className="text-[10px] text-primary font-normal">(you)</span>}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{entry.xp} XP</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black">
                              {tab === 'analyses' ? entry.totalAnalyses :
                               tab === 'score'    ? `${entry.avgScore}%` :
                                                    entry.xp}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {tab === 'analyses' ? 'analyses' : tab === 'score' ? 'avg score' : 'XP'}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* All Badges */}
          <div className="mt-8 card-glass p-6 rounded-3xl">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Medal className="w-5 h-5 text-yellow-500" /> Achievement Badges
            </h3>
            <BadgeShowcase />
          </div>
        </div>
      </div>
    </>
  );
};

export default LeaderboardPage;
