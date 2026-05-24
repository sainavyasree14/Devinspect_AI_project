import React, { useState, useEffect, useRef, useCallback } from 'react';

const GRID = 20;
const CELL = 18;
const rand = () => ({ x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) });

export default function SnakeGame({ onScore }) {
  const [snake, setSnake] = useState([{ x: 10, y: 10 }]);
  const [food, setFood] = useState({ x: 15, y: 10 });
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [dead, setDead] = useState(false);
  const dirRef = useRef({ x: 1, y: 0 });
  const foodRef = useRef({ x: 15, y: 10 });
  const loopRef = useRef(null);

  const reset = () => {
    const f = rand();
    setSnake([{ x: 10, y: 10 }]);
    setFood(f); foodRef.current = f;
    dirRef.current = { x: 1, y: 0 };
    setScore(0); setDead(false); setRunning(true);
  };

  const tick = useCallback(() => {
    setSnake(prev => {
      const d = dirRef.current;
      const head = { x: prev[0].x + d.x, y: prev[0].y + d.y };
      if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID ||
          prev.some(s => s.x === head.x && s.y === head.y)) {
        setDead(true); setRunning(false); return prev;
      }
      const ate = head.x === foodRef.current.x && head.y === foodRef.current.y;
      if (ate) {
        const nf = rand(); setFood(nf); foodRef.current = nf;
        setScore(s => { const ns = s + 10; onScore?.(ns); return ns; });
      }
      const next = [head, ...prev];
      if (!ate) next.pop();
      return next;
    });
  }, [onScore]);

  useEffect(() => {
    if (running) loopRef.current = setInterval(tick, 140);
    else clearInterval(loopRef.current);
    return () => clearInterval(loopRef.current);
  }, [running, tick]);

  useEffect(() => {
    const onKey = (e) => {
      const map = { ArrowUp:{x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0} };
      const d = map[e.key];
      if (!d) return;
      e.preventDefault();
      if (d.x === -dirRef.current.x && d.y === -dirRef.current.y) return;
      dirRef.current = d;
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const size = GRID * CELL;
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-full px-1">
        <span className="text-xs font-bold text-muted-foreground">Score: <span className="text-primary">{score}</span></span>
        <button onClick={reset} className="text-xs px-3 py-1 rounded-lg bg-primary/20 text-primary font-bold hover:bg-primary/30 transition-all">
          {dead ? '🔄 Restart' : running ? '🔄 Reset' : '▶ Start'}
        </button>
      </div>
      <div className="relative border border-border/30 rounded-xl overflow-hidden bg-muted/20" style={{ width: size, height: size }}>
        <div className="absolute text-[14px]" style={{ left: food.x * CELL, top: food.y * CELL, width: CELL, height: CELL, lineHeight: CELL + 'px', textAlign: 'center' }}>🍎</div>
        {snake.map((s, i) => (
          <div key={i} className={`absolute rounded-sm ${i === 0 ? 'bg-green-400 shadow-sm shadow-green-400/60' : 'bg-green-600'}`}
            style={{ left: s.x * CELL + 1, top: s.y * CELL + 1, width: CELL - 2, height: CELL - 2 }} />
        ))}
        {!running && !dead && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <p className="text-sm font-bold text-primary">Press ▶ Start</p>
          </div>
        )}
        {dead && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm gap-1">
            <p className="text-lg font-black text-destructive">💀 Game Over!</p>
            <p className="text-xs text-muted-foreground">Score: {score}</p>
          </div>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground">Use arrow keys to move 🐍</p>
    </div>
  );
}
