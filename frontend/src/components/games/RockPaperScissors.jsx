import React, { useState } from 'react';

const CHOICES = ['✊', '📄', '✂️'];
const NAMES = ['Rock', 'Paper', 'Scissors'];

const result = (p, a) => {
  if (p === a) return 'draw';
  if ((p === 0 && a === 2) || (p === 1 && a === 0) || (p === 2 && a === 1)) return 'win';
  return 'lose';
};

export default function RockPaperScissors({ onScore }) {
  const [scores, setScores] = useState({ win: 0, lose: 0, draw: 0 });
  const [streak, setStreak] = useState(0);
  const [last, setLast] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  const play = (p) => {
    const a = Math.floor(Math.random() * 3);
    const r = result(p, a);
    setAnimKey(k => k + 1);
    setLast({ player: p, ai: a, result: r });
    setScores(s => ({ ...s, [r]: s[r] + 1 }));
    if (r === 'win') {
      setStreak(s => { const ns = s + 1; onScore?.(ns * 5); return ns; });
    } else {
      setStreak(0);
    }
  };

  const resultText = last
    ? last.result === 'win' ? '🎉 You Win!' : last.result === 'lose' ? '😅 AI Wins!' : "🤝 Draw!"
    : null;

  const resultColor = last
    ? last.result === 'win' ? 'text-green-500' : last.result === 'lose' ? 'text-destructive' : 'text-orange-500'
    : '';

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-3 text-xs font-bold">
        <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-500">Win: {scores.win}</span>
        <span className="px-2 py-1 rounded-lg bg-muted/40 text-muted-foreground">Draw: {scores.draw}</span>
        <span className="px-2 py-1 rounded-lg bg-destructive/20 text-destructive">Lose: {scores.lose}</span>
      </div>

      {streak >= 2 && (
        <div className="px-3 py-1 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-500 text-xs font-bold">
          🔥 {streak} Win Streak!
        </div>
      )}

      {last && (
        <div key={animKey} className="flex items-center gap-6 py-2 animate-in fade-in duration-300">
          <div className="text-center">
            <p className="text-3xl">{CHOICES[last.player]}</p>
            <p className="text-[10px] text-muted-foreground mt-1">You</p>
          </div>
          <p className={`text-sm font-black ${resultColor}`}>{resultText}</p>
          <div className="text-center">
            <p className="text-3xl">{CHOICES[last.ai]}</p>
            <p className="text-[10px] text-muted-foreground mt-1">AI</p>
          </div>
        </div>
      )}

      {!last && <p className="text-xs text-muted-foreground py-2">Choose your move!</p>}

      <div className="flex gap-3">
        {CHOICES.map((c, i) => (
          <button key={i} onClick={() => play(i)}
            className="w-16 h-16 rounded-2xl text-3xl bg-muted/30 border border-border/30 hover:bg-primary/20 hover:border-primary/40 hover:scale-110 transition-all duration-200 shadow-sm">
            {c}
          </button>
        ))}
      </div>
      <div className="flex gap-4 text-[10px] text-muted-foreground">
        {NAMES.map((n, i) => <span key={i}>{n}</span>)}
      </div>
    </div>
  );
}
