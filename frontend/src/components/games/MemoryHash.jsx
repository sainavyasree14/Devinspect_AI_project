import React, { useState, useEffect, useCallback } from 'react';

const ICONS = ['⚛️','🐍','☕','🦀','🐘','💎','🔷','🟩'];
const makeCards = () => {
  const pairs = [...ICONS, ...ICONS].map((icon, i) => ({ id: i, icon, flipped: false, matched: false }));
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }
  return pairs;
};

export default function MemoryHash({ onScore }) {
  const [cards, setCards] = useState(makeCards);
  const [selected, setSelected] = useState([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [won, setWon] = useState(false);

  const reset = () => { setCards(makeCards()); setSelected([]); setMoves(0); setLocked(false); setWon(false); };

  const flip = useCallback((id) => {
    if (locked) return;
    setCards(prev => {
      const c = prev.find(c => c.id === id);
      if (!c || c.flipped || c.matched) return prev;
      return prev.map(c => c.id === id ? { ...c, flipped: true } : c);
    });
    setSelected(prev => [...prev, id]);
  }, [locked]);

  useEffect(() => {
    if (selected.length !== 2) return;
    setLocked(true);
    setMoves(m => m + 1);
    const [a, b] = selected;
    const ca = cards.find(c => c.id === a);
    const cb = cards.find(c => c.id === b);
    if (ca?.icon === cb?.icon) {
      setCards(prev => prev.map(c => c.id === a || c.id === b ? { ...c, matched: true } : c));
      setSelected([]);
      setLocked(false);
    } else {
      setTimeout(() => {
        setCards(prev => prev.map(c => c.id === a || c.id === b ? { ...c, flipped: false } : c));
        setSelected([]);
        setLocked(false);
      }, 900);
    }
  }, [selected, cards]);

  useEffect(() => {
    if (cards.length > 0 && cards.every(c => c.matched)) {
      setWon(true);
      const pts = Math.max(10, 100 - moves * 3);
      onScore?.(pts);
    }
  }, [cards, moves, onScore]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full px-1">
        <span className="text-xs font-bold text-muted-foreground">Moves: <span className="text-primary">{moves}</span></span>
        <button onClick={reset} className="text-xs px-3 py-1 rounded-lg bg-primary/20 text-primary font-bold hover:bg-primary/30 transition-all">🔄 Reset</button>
      </div>
      {won && (
        <div className="text-center py-1">
          <p className="text-sm font-black text-green-500">🎉 You matched all pairs!</p>
          <p className="text-xs text-muted-foreground">Completed in {moves} moves</p>
        </div>
      )}
      <div className="grid grid-cols-4 gap-2">
        {cards.map(c => (
          <button key={c.id} onClick={() => flip(c.id)}
            className={`w-14 h-14 rounded-xl text-2xl border transition-all duration-300 font-bold
              ${c.matched ? 'bg-green-500/20 border-green-500/30 scale-95' :
                c.flipped ? 'bg-primary/20 border-primary/40 shadow-sm shadow-primary/30' :
                'bg-muted/40 border-border/30 hover:bg-muted/60 hover:scale-105'}`}>
            {c.flipped || c.matched ? c.icon : '❓'}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">Match coding language icons 🧠</p>
    </div>
  );
}
