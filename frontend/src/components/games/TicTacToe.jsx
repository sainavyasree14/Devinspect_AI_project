import React, { useState, useCallback } from 'react';

const WIN = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];

const checkWinner = (b) => {
  for (const [a,c,d] of WIN) if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  return b.every(Boolean) ? 'draw' : null;
};

const minimax = (b, isMax) => {
  const w = checkWinner(b);
  if (w === 'O') return 10;
  if (w === 'X') return -10;
  if (w === 'draw') return 0;
  const scores = b.map((v, i) => {
    if (v) return isMax ? -Infinity : Infinity;
    const nb = [...b]; nb[i] = isMax ? 'O' : 'X';
    return minimax(nb, !isMax);
  });
  return isMax ? Math.max(...scores) : Math.min(...scores);
};

const aiMove = (b) => {
  let best = -Infinity, idx = -1;
  b.forEach((v, i) => {
    if (v) return;
    const nb = [...b]; nb[i] = 'O';
    const s = minimax(nb, false);
    if (s > best) { best = s; idx = i; }
  });
  return idx;
};

export default function TicTacToe({ onScore }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xTurn, setXTurn] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0, draw: 0 });
  const winner = checkWinner(board);

  const reset = () => { setBoard(Array(9).fill(null)); setXTurn(true); };

  const click = useCallback((i) => {
    if (board[i] || winner || !xTurn) return;
    const nb = [...board]; nb[i] = 'X';
    const w1 = checkWinner(nb);
    if (w1) {
      setBoard(nb);
      setScores(s => { const ns = {...s, [w1]: (s[w1]||0)+1}; return ns; });
      if (w1 === 'X') onScore?.(10);
      return;
    }
    const ai = aiMove(nb);
    if (ai !== -1) { nb[ai] = 'O'; }
    const w2 = checkWinner(nb);
    if (w2) setScores(s => ({ ...s, [w2]: (s[w2]||0)+1 }));
    setBoard(nb);
  }, [board, winner, xTurn, onScore]);

  const label = winner === 'draw' ? "It's a Draw! 🤝" : winner ? `${winner === 'X' ? '🎉 You Win!' : '🤖 AI Wins!'}` : `${xTurn ? '👤 Your turn (X)' : '🤖 AI thinking...'}`;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-4 text-xs font-bold">
        <span className="px-2 py-1 rounded-lg bg-green-500/20 text-green-500">You (X): {scores.X}</span>
        <span className="px-2 py-1 rounded-lg bg-muted/40 text-muted-foreground">Draw: {scores.draw}</span>
        <span className="px-2 py-1 rounded-lg bg-destructive/20 text-destructive">AI (O): {scores.O}</span>
      </div>
      <p className="text-xs font-bold text-primary">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        {board.map((v, i) => (
          <button key={i} onClick={() => click(i)}
            className={`w-16 h-16 rounded-xl text-2xl font-black border transition-all duration-200
              ${v === 'X' ? 'bg-primary/20 text-primary border-primary/40 shadow-sm shadow-primary/30' :
                v === 'O' ? 'bg-destructive/20 text-destructive border-destructive/40' :
                'bg-muted/30 border-border/30 hover:bg-muted/50 hover:border-primary/30 hover:scale-105'}`}>
            {v}
          </button>
        ))}
      </div>
      <button onClick={reset} className="text-xs px-4 py-1.5 rounded-lg bg-primary/20 text-primary font-bold hover:bg-primary/30 transition-all">
        🔄 New Game
      </button>
    </div>
  );
}
