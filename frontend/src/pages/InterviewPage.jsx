import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import {
  Timer, Play, Send, RotateCcw, Trophy, Brain,
  ChevronDown, Lightbulb, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { INTERVIEW_QUESTION_URL, INTERVIEW_EVALUATE_URL } from '@/lib/apiConfig';
import { useTranslation } from 'react-i18next';

const COMPANIES = ['Any', 'Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix', 'TCS', 'Infosys', 'Wipro', 'Flipkart', 'Zomato'];
const CATEGORIES = ['Any', 'Arrays', 'Strings', 'Linked Lists', 'Trees', 'Dynamic Programming', 'SQL', 'React', 'JavaScript', 'Node.js', 'System Design', 'OOPs'];
const DURATIONS = { easy: 20, medium: 35, hard: 50 };

const LANG_MAP = {
  Arrays: 'javascript', Strings: 'javascript', 'Linked Lists': 'javascript',
  Trees: 'javascript', 'Dynamic Programming': 'javascript',
  SQL: 'sql', React: 'javascript', JavaScript: 'javascript',
  'Node.js': 'javascript', 'System Design': 'javascript', OOPs: 'java',
};

const DEFAULT_CODE = (title, lang) =>
  lang === 'sql'
    ? `-- ${title}\n-- Write your SQL query here\n\n`
    : `// ${title}\n// Write your solution here\n\nfunction solution() {\n  \n}\n`;

const ScoreBar = ({ label, value, max = 20 }) => {
  const pct = Math.round((value / max) * 100);
  const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-orange-500' : 'bg-destructive';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold">{value}/{max}</span>
      </div>
      <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
};

const InterviewPage = () => {
  const { t } = useTranslation();
  const [difficulty, setDifficulty] = useState('medium');
  const [company, setCompany]       = useState('Any');
  const [category, setCategory]     = useState('Any');
  const [question, setQuestion]     = useState(null);
  const [code, setCode]             = useState('');
  const [language, setLanguage]     = useState('javascript');
  const [started, setStarted]       = useState(false);
  const [finished, setFinished]     = useState(false);
  const [timeLeft, setTimeLeft]     = useState(0);
  const [timeSpent, setTimeSpent]   = useState(0);
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const [fetching, setFetching]     = useState(false);
  const [showHints, setShowHints]   = useState(false);
  const [codeError, setCodeError]   = useState('');
  const timerRef = useRef(null);

  const startInterview = useCallback(async () => {
    setFetching(true);
    setResult(null);
    setShowHints(false);
    setCodeError('');
    try {
      const params = new URLSearchParams({ difficulty });
      if (company !== 'Any') params.set('company', company);
      if (category !== 'Any') params.set('category', category);

      const res = await fetch(`${INTERVIEW_QUESTION_URL}?${params}`);
      const data = await res.json();

      if (!data.success || !data.question) throw new Error('Failed to load question');

      const q    = data.question;
      const lang = LANG_MAP[q.category] || 'javascript';
      setQuestion(q);
      setLanguage(lang);
      setCode(DEFAULT_CODE(q.title, lang));
      setTimeLeft(DURATIONS[difficulty] * 60);
      setTimeSpent(0);
      setStarted(true);
      setFinished(false);
    } catch (err) {
      toast.error('Failed to load question. Please try again.');
    } finally {
      setFetching(false);
    }
  }, [difficulty, company, category]);

  // Timer
  useEffect(() => {
    if (!started || finished) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setFinished(true);
          toast.warning("Time's up! Submitting your solution...");
          return 0;
        }
        return prev - 1;
      });
      setTimeSpent(s => s + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started, finished]);

  const submitSolution = async () => {
    // Frontend empty-answer guard
    const stripped = code.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
    if (!stripped || stripped.length < 10) {
      setCodeError('Please write your solution before submitting.');
      return;
    }
    setCodeError('');
    clearInterval(timerRef.current);
    setFinished(true);
    setLoading(true);

    try {
      const token = localStorage.getItem('devinspect-token');
      const res = await fetch(INTERVIEW_EVALUATE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ question, code, difficulty, timeSpent }),
      });
      const data = await res.json();
      if (data.success && data.result) {
        setResult(data.result);
      } else {
        toast.error('Evaluation failed. Please try again.');
        setFinished(false);
      }
    } catch {
      toast.error('Network error during evaluation.');
      setFinished(false);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const timePercent = question ? (timeLeft / (DURATIONS[difficulty] * 60)) * 100 : 100;
  const isLowTime   = timeLeft < 120 && started && !finished;

  const scoreColor = (s) => s >= 70 ? 'text-green-500' : s >= 40 ? 'text-orange-500' : 'text-destructive';

  return (
    <>
      <Helmet><title>Live Interview | DevInspectAI</title></Helmet>
      <div className="w-full min-h-screen py-8 text-foreground bg-background">
        <div className="container mx-auto px-4 lg:px-8 max-w-7xl">

          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-gradient mb-2">{t('interview.title')}</h1>
              <p className="text-muted-foreground">{t('interview.subtitle')}</p>
            </div>

            {started && !finished && (
              <div className={`flex items-center gap-2 font-mono font-bold text-2xl ${isLowTime ? 'text-destructive animate-pulse' : 'text-foreground'}`}>
                <Timer className="w-6 h-6" />
                {formatTime(timeLeft)}
              </div>
            )}
          </div>

          {/* Setup Panel */}
          {!started && (
            <div className="card-glass p-8 rounded-3xl mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Difficulty */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Difficulty</label>
                  <div className="flex rounded-xl overflow-hidden border border-border/30">
                    {['easy', 'medium', 'hard'].map(d => (
                      <button
                        key={d}
                        onClick={() => setDifficulty(d)}
                        className={`flex-1 py-2 text-sm font-bold capitalize transition-all ${
                          difficulty === d
                            ? d === 'easy' ? 'bg-green-500/20 text-green-500'
                            : d === 'medium' ? 'bg-orange-500/20 text-orange-500'
                            : 'bg-destructive/20 text-destructive'
                            : 'text-muted-foreground hover:bg-muted/50'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Company */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Company</label>
                  <div className="relative">
                    <select
                      value={company}
                      onChange={e => setCompany(e.target.value)}
                      className="w-full h-10 px-3 pr-8 rounded-xl bg-muted/30 border border-border/30 text-sm font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Category</label>
                  <div className="relative">
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full h-10 px-3 pr-8 rounded-xl bg-muted/30 border border-border/30 text-sm font-medium appearance-none focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>

                {/* Start */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Action</label>
                  <Button
                    onClick={startInterview}
                    disabled={fetching}
                    className="w-full h-10 btn-primary rounded-xl font-bold gap-2"
                  >
                    {fetching ? (
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <><Play className="w-4 h-4 fill-current" /> Start Interview</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Duration info */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                {Object.entries(DURATIONS).map(([d, mins]) => (
                  <div key={d} className={`p-3 rounded-xl border text-center transition-all ${difficulty === d ? 'border-primary/40 bg-primary/5' : 'border-border/20 bg-muted/20'}`}>
                    <p className="font-bold capitalize">{d}</p>
                    <p className="text-muted-foreground text-xs">{mins} min</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col items-center justify-center text-center">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center mb-4"
                >
                  <Brain className="w-8 h-8 text-primary" />
                </motion.div>
                <p className="text-muted-foreground max-w-md text-sm">
                  Select your preferences above and click <strong>Start Interview</strong>. AI will generate a realistic company-style question and evaluate your solution.
                </p>
              </div>
            </div>
          )}

          {/* Interview Panel */}
          {started && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Question + Results */}
              <div className="lg:col-span-5 space-y-4">
                <div className="card-glass p-6 rounded-3xl">
                  {/* Timer bar */}
                  <div className="w-full h-1.5 bg-muted/40 rounded-full mb-4 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full transition-all ${timePercent > 50 ? 'bg-green-500' : timePercent > 20 ? 'bg-orange-500' : 'bg-destructive'}`}
                      style={{ width: `${timePercent}%` }}
                    />
                  </div>

                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg capitalize ${
                      difficulty === 'easy' ? 'bg-green-500/10 text-green-500'
                      : difficulty === 'medium' ? 'bg-orange-500/10 text-orange-500'
                      : 'bg-destructive/10 text-destructive'
                    }`}>{difficulty}</span>
                    {question?.company && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary">{question.company}</span>
                    )}
                    {question?.category && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-secondary/10 text-secondary">{question.category}</span>
                    )}
                  </div>

                  <h2 className="text-xl font-bold mb-3">{question?.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">{question?.description}</p>

                  {question?.example && (
                    <div className="p-3 bg-muted/30 rounded-xl border border-border/20 mb-3">
                      <p className="text-xs font-bold text-muted-foreground mb-1.5">Example:</p>
                      <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap">{question.example}</pre>
                    </div>
                  )}

                  {question?.constraints && (
                    <div className="p-3 bg-muted/20 rounded-xl border border-border/20 mb-3">
                      <p className="text-xs font-bold text-muted-foreground mb-1.5">Constraints:</p>
                      <pre className="text-xs font-mono text-foreground/70 whitespace-pre-wrap">{question.constraints}</pre>
                    </div>
                  )}

                  {question?.expectedComplexity && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-bold">Expected:</span> {question.expectedComplexity}
                    </p>
                  )}

                  {/* Hints toggle */}
                  {question?.hints?.length > 0 && (
                    <button
                      onClick={() => setShowHints(h => !h)}
                      className="mt-3 flex items-center gap-1.5 text-xs font-bold text-primary hover:opacity-80 transition-opacity"
                    >
                      <Lightbulb className="w-3.5 h-3.5" />
                      {showHints ? 'Hide Hints' : 'Show Hints'}
                    </button>
                  )}
                  <AnimatePresence>
                    {showHints && (
                      <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 space-y-1 overflow-hidden"
                      >
                        {question.hints.map((h, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-2">
                            <span className="text-primary font-bold">{i + 1}.</span> {h}
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </div>

                {/* Results Panel */}
                <AnimatePresence>
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="card-glass p-6 rounded-3xl space-y-4"
                    >
                      {/* Score header */}
                      <div className="flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-yellow-500 shrink-0" />
                        <h3 className="font-bold text-lg">AI Evaluation</h3>
                        <span className={`ml-auto text-3xl font-black ${scoreColor(result.score)}`}>
                          {result.score}/100
                        </span>
                      </div>

                      <div className={`flex items-center gap-2 text-sm font-bold ${result.passed ? 'text-green-500' : 'text-destructive'}`}>
                        {result.passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {result.passed ? 'Passed' : 'Needs Improvement'}
                      </div>

                      {/* Score breakdown */}
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Score Breakdown</p>
                        <ScoreBar label="Correctness"    value={result.breakdown?.correctness    ?? 0} />
                        <ScoreBar label="Code Quality"   value={result.breakdown?.codeQuality    ?? 0} />
                        <ScoreBar label="Edge Cases"     value={result.breakdown?.edgeCases      ?? 0} />
                        <ScoreBar label="Optimization"   value={result.breakdown?.optimization   ?? 0} />
                        <ScoreBar label="Syntax Validity" value={result.breakdown?.syntaxValidity ?? 0} />
                      </div>

                      {/* Complexity */}
                      {(result.timeComplexity || result.spaceComplexity) && (
                        <div className="flex gap-3 text-xs">
                          <span className="px-2 py-1 rounded-lg bg-muted/30 border border-border/20">
                            <span className="font-bold">Time:</span> {result.timeComplexity}
                          </span>
                          <span className="px-2 py-1 rounded-lg bg-muted/30 border border-border/20">
                            <span className="font-bold">Space:</span> {result.spaceComplexity}
                          </span>
                        </div>
                      )}

                      {/* Feedback */}
                      {result.feedback && (
                        <p className="text-sm text-muted-foreground leading-relaxed">{result.feedback}</p>
                      )}

                      {/* Strengths */}
                      {result.strengths?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-green-500 mb-1">Strengths</p>
                          <ul className="space-y-0.5">
                            {result.strengths.map((s, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" /> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Weaknesses */}
                      {result.weaknesses?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-destructive mb-1">Weaknesses</p>
                          <ul className="space-y-0.5">
                            {result.weaknesses.map((w, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                                <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" /> {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Improvements */}
                      {result.improvements?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-primary mb-1">Improvements</p>
                          <ul className="space-y-0.5">
                            {result.improvements.map((imp, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                                <AlertCircle className="w-3 h-3 text-primary shrink-0 mt-0.5" /> {imp}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Expected solution */}
                      {result.expectedSolution && (
                        <div className="p-3 bg-muted/20 rounded-xl border border-border/20">
                          <p className="text-xs font-bold text-muted-foreground mb-1">Optimal Approach</p>
                          <p className="text-xs text-foreground/70">{result.expectedSolution}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right: Code Editor */}
              <div className="lg:col-span-7">
                <div className="card-glass p-6 rounded-3xl h-full flex flex-col">
                  <div className="flex justify-between items-center mb-4 border-b border-border/30 pb-3">
                    <span className="text-sm font-bold text-muted-foreground">
                      Solution Editor
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-muted/40 border border-border/20">{language}</span>
                    </span>
                    <div className="flex gap-2">
                      {!finished ? (
                        <Button
                          onClick={submitSolution}
                          disabled={loading}
                          className="btn-primary h-9 px-4 rounded-xl font-bold text-sm gap-2"
                        >
                          <Send className="w-3.5 h-3.5" /> {t('interview.submit')}
                        </Button>
                      ) : (
                        <Button
                          onClick={startInterview}
                          disabled={fetching}
                          variant="outline"
                          className="h-9 px-4 rounded-xl font-bold text-sm gap-2 border-border/30"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> New Question
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Empty answer error */}
                  <AnimatePresence>
                    {codeError && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="mb-3 p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2"
                      >
                        <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
                        <p className="text-sm text-destructive font-medium">{codeError}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex-1 min-h-[420px] rounded-2xl overflow-hidden border border-border/20">
                    <Editor
                      height="100%"
                      language={language}
                      value={code}
                      onChange={val => { setCode(val || ''); setCodeError(''); }}
                      theme="vs-dark"
                      options={{
                        fontSize: 14,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        readOnly: finished,
                        wordWrap: 'on',
                        padding: { top: 12, bottom: 12 },
                        lineNumbers: 'on',
                        renderLineHighlight: 'line',
                        automaticLayout: true,
                      }}
                    />
                  </div>

                  {loading && (
                    <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground animate-pulse">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                      AI is evaluating your solution...
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default InterviewPage;
