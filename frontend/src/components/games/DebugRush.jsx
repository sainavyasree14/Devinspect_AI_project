import React, { useState, useEffect, useRef } from 'react';

const BUGS = [
  { code: `function sum(a, b) {\n  return a - b;\n}`, bug: 'Wrong operator: should be + not -', options: ['Wrong operator (- instead of +)', 'Missing return', 'Wrong variable name', 'No bug here'], answer: 0 },
  { code: `for (let i = 0; i <= arr.length; i++) {\n  console.log(arr[i]);\n}`, bug: 'Off-by-one: <= should be <', options: ['Off-by-one error (<= should be <)', 'Missing semicolon', 'Wrong variable', 'No bug here'], answer: 0 },
  { code: `const obj = { name: "Dev" };\nconsole.log(obj.Name);`, bug: 'Wrong case: Name vs name', options: ['Wrong property case (Name vs name)', 'Missing semicolon', 'Wrong quotes', 'No bug here'], answer: 0 },
  { code: `function factorial(n) {\n  if (n === 0) return 0;\n  return n * factorial(n-1);\n}`, bug: 'Base case should return 1 not 0', options: ['Base case returns 0 (should be 1)', 'Missing return', 'Infinite loop', 'No bug here'], answer: 0 },
  { code: `let x = 5;\nif (x = 10) {\n  console.log("ten");\n}`, bug: 'Assignment = instead of comparison ==', options: ['Assignment (=) instead of comparison (==)', 'Missing braces', 'Wrong variable', 'No bug here'], answer: 0 },
  { code: `async function getData() {\n  const res = fetch('/api/data');\n  return res.json();\n}`, bug: 'Missing await before fetch', options: ['Missing await before fetch', 'Wrong URL', 'Missing return', 'No bug here'], answer: 0 },
  { code: `const arr = [1, 2, 3];\narr.push[4];`, bug: 'push is a method, use () not []', options: ['push[] should be push()', 'Wrong array syntax', 'Missing semicolon', 'No bug here'], answer: 0 },
  { code: `function greet(name) {\n  console.log("Hello " + Name);\n}`, bug: 'Wrong case: Name should be name', options: ['Wrong case (Name should be name)', 'Missing quotes', 'Wrong function name', 'No bug here'], answer: 0 },
];

const TIME = 15;

export default function DebugRush({ onScore }) {
  const [idx, setIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);

  const q = BUGS[idx % BUGS.length];

  const start = () => { setIdx(0); setScore(0); setAnswered(null); setDone(false); setTimeLeft(TIME); setRunning(true); };

  useEffect(() => {
    if (!running || answered !== null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); setAnswered(-1); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [running, answered, idx]);

  const pick = (i) => {
    if (answered !== null) return;
    clearInterval(timerRef.current);
    setAnswered(i);
    if (i === q.answer) {
      const pts = score + Math.max(5, timeLeft);
      setScore(pts);
      onScore?.(pts);
    }
  };

  const next = () => {
    if (idx + 1 >= BUGS.length) { setDone(true); setRunning(false); return; }
    setIdx(i => i + 1);
    setAnswered(null);
    setTimeLeft(TIME);
  };

  const timerPct = (timeLeft / TIME) * 100;

  if (!running && !done) return (
    <div className="flex flex-col items-center gap-4 py-4">
      <p className="text-4xl">🐞</p>
      <p className="text-sm font-bold text-center">Find the bug before time runs out!</p>
      <p className="text-xs text-muted-foreground text-center">You get more points for faster answers</p>
      <button onClick={start} className="px-6 py-2 rounded-xl bg-primary/20 text-primary font-bold hover:bg-primary/30 transition-all">▶ Start Debug Rush</button>
    </div>
  );

  if (done) return (
    <div className="flex flex-col items-center gap-3 py-4">
      <p className="text-3xl">🎉</p>
      <p className="text-lg font-black text-primary">Debug Rush Complete!</p>
      <p className="text-sm text-muted-foreground">Final Score: <strong className="text-foreground">{score}</strong></p>
      <button onClick={start} className="px-6 py-2 rounded-xl bg-primary/20 text-primary font-bold hover:bg-primary/30 transition-all">🔄 Play Again</button>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex justify-between text-xs font-bold">
        <span className="text-muted-foreground">Q {idx + 1}/{BUGS.length}</span>
        <span className="text-primary">Score: {score}</span>
        <span className={timeLeft <= 5 ? 'text-destructive animate-pulse' : 'text-orange-500'}>⏱ {timeLeft}s</span>
      </div>
      <div className="w-full h-1.5 bg-muted/40 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${timerPct > 50 ? 'bg-green-500' : timerPct > 25 ? 'bg-orange-500' : 'bg-destructive'}`} style={{ width: `${timerPct}%` }} />
      </div>
      <pre className="text-xs font-mono bg-muted/30 border border-border/20 rounded-xl p-3 overflow-x-auto whitespace-pre text-foreground/90">{q.code}</pre>
      <p className="text-xs font-bold text-muted-foreground">🐞 What's the bug?</p>
      <div className="grid grid-cols-1 gap-2">
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => pick(i)}
            className={`text-xs text-left px-3 py-2 rounded-xl border font-medium transition-all
              ${answered === null ? 'bg-muted/30 border-border/30 hover:bg-primary/10 hover:border-primary/30' :
                i === q.answer ? 'bg-green-500/20 border-green-500/40 text-green-500' :
                answered === i ? 'bg-destructive/20 border-destructive/40 text-destructive' :
                'bg-muted/20 border-border/20 text-muted-foreground'}`}>
            {answered !== null && i === q.answer ? '✅ ' : answered === i && i !== q.answer ? '❌ ' : ''}{opt}
          </button>
        ))}
      </div>
      {answered !== null && (
        <button onClick={next} className="text-xs px-4 py-1.5 rounded-lg bg-primary/20 text-primary font-bold hover:bg-primary/30 transition-all self-center">
          {idx + 1 >= BUGS.length ? '🏁 Finish' : 'Next Bug →'}
        </button>
      )}
    </div>
  );
}
