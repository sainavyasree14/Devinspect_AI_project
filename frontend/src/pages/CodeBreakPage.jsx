import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import SnakeGame from '@/components/games/SnakeGame.jsx';
import TicTacToe from '@/components/games/TicTacToe.jsx';
import DebugRush from '@/components/games/DebugRush.jsx';
import MemoryHash from '@/components/games/MemoryHash.jsx';
import RockPaperScissors from '@/components/games/RockPaperScissors.jsx';
import FlappyBird from '@/components/games/FlappyBird.jsx';

const GAMES = [
  { id: 'snake',   label: 'Snake',              emoji: '🐍', desc: 'Classic snake — eat & grow!',          color: 'green' },
  { id: 'ttt',     label: 'Tic Tac Toe',         emoji: '⭕', desc: 'Beat the AI in 3-in-a-row',           color: 'blue' },
  { id: 'debug',   label: 'Debug Rush',           emoji: '🐞', desc: 'Find bugs before time runs out!',     color: 'red' },
  { id: 'memory',  label: 'Memory Hash',          emoji: '🧠', desc: 'Match coding language icons',         color: 'purple' },
  { id: 'rps',     label: 'Rock Paper Scissors',  emoji: '✊', desc: 'Beat the AI — build your streak!',   color: 'orange' },
  { id: 'flappy',  label: 'Flappy Bird',          emoji: '🐤', desc: 'Tap to fly through pipes!',          color: 'yellow' },
];

const COLOR_MAP = {
  green:  { card: 'border-green-500/30 hover:border-green-500/60 hover:shadow-green-500/20',  badge: 'bg-green-500/20 text-green-500' },
  blue:   { card: 'border-blue-500/30 hover:border-blue-500/60 hover:shadow-blue-500/20',    badge: 'bg-blue-500/20 text-blue-500' },
  red:    { card: 'border-red-500/30 hover:border-red-500/60 hover:shadow-red-500/20',       badge: 'bg-red-500/20 text-red-500' },
  purple: { card: 'border-purple-500/30 hover:border-purple-500/60 hover:shadow-purple-500/20', badge: 'bg-purple-500/20 text-purple-500' },
  orange: { card: 'border-orange-500/30 hover:border-orange-500/60 hover:shadow-orange-500/20', badge: 'bg-orange-500/20 text-orange-500' },
  yellow: { card: 'border-yellow-500/30 hover:border-yellow-500/60 hover:shadow-yellow-500/20', badge: 'bg-yellow-500/20 text-yellow-500' },
};

const LS_KEY = 'devinspect-codebreak-scores';

const loadScores = () => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
};

const saveScore = (gameId, score) => {
  const all = loadScores();
  if (!all[gameId] || score > all[gameId]) {
    all[gameId] = score;
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  }
};

export default function CodeBreakPage() {
  const [active, setActive] = useState(null);
  const [bestScores, setBestScores] = useState(loadScores);
  const [celebrate, setCelebrate] = useState(false);

  const handleScore = useCallback((gameId, score) => {
    saveScore(gameId, score);
    setBestScores(loadScores());
    if (score > 0 && score % 50 === 0) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 2000);
    }
  }, []);

  const activeGame = GAMES.find(g => g.id === active);

  const renderGame = () => {
    const props = { onScore: (s) => handleScore(active, s) };
    switch (active) {
      case 'snake':  return <SnakeGame {...props} />;
      case 'ttt':    return <TicTacToe {...props} />;
      case 'debug':  return <DebugRush {...props} />;
      case 'memory': return <MemoryHash {...props} />;
      case 'rps':    return <RockPaperScissors {...props} />;
      case 'flappy': return <FlappyBird {...props} />;
      default:       return null;
    }
  };

  return (
    <>
      <Helmet><title>Code Break 🎮 | DevInspectAI</title></Helmet>
      <div className="w-full min-h-screen py-8 text-foreground bg-background">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">

          {/* Header */}
          <div className="mb-8 text-center">
            <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <h1 className="text-4xl font-extrabold text-gradient mb-2">🎮 Code Break</h1>
              <p className="text-muted-foreground text-sm">Take a quick coding break — play, relax, and recharge! 🎮✨</p>
            </motion.div>
          </div>

          {/* Celebration overlay */}
          <AnimatePresence>
            {celebrate && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-primary/90 text-white font-black text-lg shadow-2xl shadow-primary/40"
              >
                🎉 New High Score!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Best Scores strip */}
          {Object.keys(bestScores).length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-glass p-4 rounded-2xl mb-6">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">🏆 Your Best Scores</p>
              <div className="flex flex-wrap gap-2">
                {GAMES.map(g => bestScores[g.id] ? (
                  <div key={g.id} className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${COLOR_MAP[g.color].badge} border-current/20`}>
                    {g.emoji} {g.label}: <span className="font-black">{bestScores[g.id]}</span>
                  </div>
                ) : null)}
              </div>
            </motion.div>
          )}

          {/* Game grid */}
          {!active && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {GAMES.map((g, i) => (
                <motion.button
                  key={g.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => setActive(g.id)}
                  className={`card-glass p-5 rounded-2xl border text-left transition-all duration-300 hover:scale-105 hover:shadow-lg group ${COLOR_MAP[g.color].card}`}
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-200">{g.emoji}</div>
                  <p className="font-bold text-sm mb-1">{g.label}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{g.desc}</p>
                  {bestScores[g.id] && (
                    <div className={`mt-2 text-[10px] font-bold px-2 py-0.5 rounded-lg inline-block ${COLOR_MAP[g.color].badge}`}>
                      Best: {bestScores[g.id]}
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          )}

          {/* Active game panel */}
          <AnimatePresence mode="wait">
            {active && (
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.3 }}
                className="card-glass p-6 rounded-3xl"
              >
                <div className="flex items-center justify-between mb-5 border-b border-border/30 pb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{activeGame?.emoji}</span>
                    <div>
                      <h2 className="font-bold text-lg">{activeGame?.label}</h2>
                      {bestScores[active] && (
                        <p className="text-xs text-muted-foreground">Best: <span className="text-primary font-bold">{bestScores[active]}</span></p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setActive(null)}
                    className="text-xs px-3 py-1.5 rounded-xl bg-muted/40 text-muted-foreground hover:bg-muted/60 font-bold transition-all"
                  >
                    ← All Games
                  </button>
                </div>
                <div className="flex justify-center">
                  {renderGame()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer tip */}
          {!active && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="text-center text-xs text-muted-foreground mt-4">
              💡 Taking short breaks improves focus and productivity. Enjoy! 🎮
            </motion.p>
          )}
        </div>
      </div>
    </>
  );
}
