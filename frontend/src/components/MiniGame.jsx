import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gamepad2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CODE_SNIPPETS = [
  'const sum = (a, b) => a + b;',
  'function greet(name) { return `Hello, ${name}!`; }',
  'const arr = [1, 2, 3].map(x => x * 2);',
  'async function fetchData(url) { const res = await fetch(url); return res.json(); }',
  'const obj = { name: "dev", role: "engineer" };',
];

const MiniGame = ({ isOpen, onClose }) => {
  const [snippet] = useState(() => CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)]);
  const [input, setInput] = useState('');
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const inputRef = useRef(null);

  const reset = useCallback(() => {
    setInput('');
    setStarted(false);
    setFinished(false);
    setStartTime(null);
    setWpm(0);
    setAccuracy(100);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 200);
  }, [isOpen]);

  const handleInput = (e) => {
    const val = e.target.value;
    if (!started && val.length === 1) {
      setStarted(true);
      setStartTime(Date.now());
    }
    setInput(val);

    // Calculate accuracy
    let correct = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] === snippet[i]) correct++;
    }
    setAccuracy(val.length > 0 ? Math.round((correct / val.length) * 100) : 100);

    // Check completion
    if (val === snippet) {
      const elapsed = (Date.now() - startTime) / 1000 / 60;
      const words = snippet.split(' ').length;
      setWpm(Math.round(words / elapsed));
      setFinished(true);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="card-glass w-full max-w-lg p-6 rounded-3xl border border-border/30 shadow-2xl"
        >
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold">Typing Speed Test</h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          {!finished ? (
            <>
              <div className="font-mono text-sm p-4 bg-muted/30 rounded-xl border border-border/20 mb-4 leading-relaxed select-none">
                {snippet.split('').map((char, i) => {
                  let color = 'text-muted-foreground';
                  if (i < input.length) {
                    color = input[i] === char ? 'text-green-500' : 'text-destructive bg-destructive/10';
                  } else if (i === input.length) {
                    color = 'text-foreground border-b-2 border-primary';
                  }
                  return <span key={i} className={color}>{char}</span>;
                })}
              </div>

              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInput}
                className="w-full font-mono text-sm p-3 bg-background border border-border/30 rounded-xl resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Start typing here..."
                spellCheck={false}
              />

              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Accuracy: <strong className="text-foreground">{accuracy}%</strong></span>
                <span>{input.length}/{snippet.length} chars</span>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <div className="text-5xl mb-3">🎉</div>
              <h4 className="text-xl font-bold mb-4 text-gradient">Nice work!</h4>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-muted/30 rounded-xl border border-border/20">
                  <p className="text-xs text-muted-foreground mb-1">WPM</p>
                  <p className="text-3xl font-black text-gradient">{wpm}</p>
                </div>
                <div className="p-4 bg-muted/30 rounded-xl border border-border/20">
                  <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
                  <p className="text-3xl font-black text-gradient">{accuracy}%</p>
                </div>
              </div>
              <Button onClick={reset} className="btn-primary rounded-xl font-bold gap-2">
                <RotateCcw className="w-4 h-4" /> Play Again
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default MiniGame;
