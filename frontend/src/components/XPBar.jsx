import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useGamification } from '@/contexts/GamificationContext.jsx';

const XPBar = ({ compact = false }) => {
  const { xp, levelInfo } = useGamification();

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Zap className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
        <div className="flex-1">
          <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelInfo.pct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
            />
          </div>
        </div>
        <span className="text-[10px] font-bold text-yellow-500 shrink-0">Lv.{levelInfo.level}</span>
      </div>
    );
  }

  return (
    <div className="card-glass p-4 rounded-2xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-yellow-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Level {levelInfo.level} — {levelInfo.label}</p>
            <p className="text-[10px] text-muted-foreground">{xp} XP total</p>
          </div>
        </div>
        <span className="text-xs font-bold text-yellow-500">{levelInfo.pct}%</span>
      </div>

      <div className="space-y-1">
        <div className="h-2 bg-muted/40 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${levelInfo.pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
          />
        </div>
        {levelInfo.next && (
          <p className="text-[10px] text-muted-foreground text-right">
            {levelInfo.next.minXp - xp} XP to {levelInfo.next.label}
          </p>
        )}
      </div>
    </div>
  );
};

export default XPBar;
