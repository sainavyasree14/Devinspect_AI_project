import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Star } from 'lucide-react';
import { useStreak } from '@/contexts/StreakContext';

const StreakCard = () => {
  const { streak, xp, getEarnedBadges } = useStreak();
  const earnedBadges = getEarnedBadges();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-glass p-5 rounded-2xl border border-border/30 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Day Streak</p>
            <p className="text-2xl font-black text-gradient">{streak}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <Star className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">XP</p>
            <p className="text-2xl font-black text-gradient">{xp}</p>
          </div>
        </div>
      </div>

      {earnedBadges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/20">
          {earnedBadges.map(b => (
            <span key={b.id} className="text-xs px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-lg font-medium flex items-center gap-1">
              {b.icon} {b.label}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default StreakCard;
