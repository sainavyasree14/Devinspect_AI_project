import React, { useEffect, useRef, useState, useCallback } from 'react';

const W = 320, H = 400, BIRD_X = 60, BIRD_R = 14;
const GRAVITY = 0.45, JUMP = -7.5, PIPE_W = 48, GAP = 130, PIPE_SPEED = 2.5;

export default function FlappyBird({ onScore }) {
  const canvasRef = useRef(null);
  const state = useRef({
    bird: { y: H / 2, vy: 0 },
    pipes: [],
    score: 0,
    frame: 0,
    running: false,
    dead: false,
  });
  const rafRef = useRef(null);
  const [display, setDisplay] = useState({ score: 0, running: false, dead: false });

  const spawnPipe = () => {
    const top = 60 + Math.random() * (H - GAP - 120);
    state.current.pipes.push({ x: W, top, scored: false });
  };

  const jump = useCallback(() => {
    const s = state.current;
    if (s.dead) { restart(); return; }
    if (!s.running) { s.running = true; setDisplay(d => ({ ...d, running: true })); }
    s.bird.vy = JUMP;
  }, []);

  const restart = () => {
    state.current = { bird: { y: H / 2, vy: 0 }, pipes: [], score: 0, frame: 0, running: true, dead: false };
    setDisplay({ score: 0, running: true, dead: false });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const s = state.current;
      ctx.clearRect(0, 0, W, H);

      // Background
      ctx.fillStyle = '#0f0f1a';
      ctx.fillRect(0, 0, W, H);

      // Ground
      ctx.fillStyle = '#1e1e2e';
      ctx.fillRect(0, H - 20, W, 20);

      if (s.running) {
        s.frame++;
        s.bird.vy += GRAVITY;
        s.bird.y += s.bird.vy;

        // Spawn pipes
        if (s.frame % 90 === 0) spawnPipe();

        // Move pipes
        s.pipes = s.pipes.filter(p => p.x > -PIPE_W);
        s.pipes.forEach(p => {
          p.x -= PIPE_SPEED;
          if (!p.scored && p.x + PIPE_W < BIRD_X) {
            p.scored = true;
            s.score++;
            onScore?.(s.score);
            setDisplay(d => ({ ...d, score: s.score }));
          }
          // Collision
          const bx = BIRD_X, by = s.bird.y;
          if (bx + BIRD_R > p.x && bx - BIRD_R < p.x + PIPE_W) {
            if (by - BIRD_R < p.top || by + BIRD_R > p.top + GAP) {
              s.dead = true; s.running = false;
              setDisplay(d => ({ ...d, dead: true, running: false }));
            }
          }
        });

        // Floor/ceiling
        if (s.bird.y + BIRD_R > H - 20 || s.bird.y - BIRD_R < 0) {
          s.dead = true; s.running = false;
          setDisplay(d => ({ ...d, dead: true, running: false }));
        }
      }

      // Draw pipes
      s.pipes.forEach(p => {
        const grad = ctx.createLinearGradient(p.x, 0, p.x + PIPE_W, 0);
        grad.addColorStop(0, '#22c55e');
        grad.addColorStop(1, '#16a34a');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.roundRect(p.x, 0, PIPE_W, p.top, [0, 0, 8, 8]); ctx.fill();
        ctx.beginPath(); ctx.roundRect(p.x, p.top + GAP, PIPE_W, H - p.top - GAP, [8, 8, 0, 0]); ctx.fill();
      });

      // Draw bird
      ctx.save();
      ctx.translate(BIRD_X, s.bird.y);
      ctx.rotate(Math.min(Math.max(s.bird.vy * 0.05, -0.5), 0.5));
      ctx.font = '24px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐤', 0, 0);
      ctx.restore();

      // Score
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.score, W / 2, 36);

      if (!s.running && !s.dead) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('Tap / Space to Start 🐤', W / 2, H / 2);
      }

      if (s.dead) {
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#f87171';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText('💀 Game Over!', W / 2, H / 2 - 20);
        ctx.fillStyle = '#fff';
        ctx.font = '14px sans-serif';
        ctx.fillText(`Score: ${s.score}`, W / 2, H / 2 + 10);
        ctx.fillText('Tap to Restart', W / 2, H / 2 + 36);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [onScore]);

  useEffect(() => {
    const onKey = (e) => { if (e.code === 'Space') { e.preventDefault(); jump(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [jump]);

  return (
    <div className="flex flex-col items-center gap-2">
      <canvas ref={canvasRef} width={W} height={H}
        onClick={jump}
        className="rounded-2xl border border-border/30 cursor-pointer"
        style={{ maxWidth: '100%' }}
      />
      <p className="text-[10px] text-muted-foreground">Tap or press Space to flap 🐤</p>
    </div>
  );
}
