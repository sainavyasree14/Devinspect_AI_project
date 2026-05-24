import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import {
  Timer, Play, Send, RotateCcw, Trophy, Brain,
  ChevronDown, Lightbulb, CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { INTERVIEW_START_URL, INTERVIEW_EVAL_ANSWER_URL } from '@/lib/apiConfig';
import { useGamification } from '@/contexts/GamificationContext.jsx';
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
  const { recordInterviewResult } = useGamification();

  // ── Setup state ──────────────────────────────────────────
  const [difficulty, setDifficulty] = useState('medium');
  const [company,    setCompany]    = useState('Any');
  const [category,   setCategory]   = useState('Any');

  // ── Session state ─────────────────────────────────────────
  const [questions,    setQuestions]    = useState([]);   // full question list
  const [currentIdx,   setCurrentIdx]   = useState(0);    // active question index
  const [answers,      setAnswers]      = useState({});   // { [idx]: { code, result, skipped } }
  const [question,     setQuestion]     = useState(null); // current question object
  const [code,         setCode]         = useState('');
  const [language,     setLanguage]     = useState('javascript');
  const [started,      setStarted]      = useState(false);
  const [finished,     setFinished]     = useState(false);
  const [sessionDone,  setSessionDone]  = useState(false);

  // ── Timer state ───────────────────────────────────────────
  const [timeLeft,  setTimeLeft]  = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);

  // ── UI state ──────────────────────────────────────────────
  const [result,     setResult]     = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [fetching,   setFetching]   = useState(false);
  const [showHints,  setShowHints]  = useState(false);
  const [codeError,  setCodeError]  = useState('');
  const [showReveal, setShowReveal] = useState(false);

  // ── Refs ──────────────────────────────────────────────────
  const timerRef      = useRef(null);
  const submittingRef = useRef(false); // debounce guard — prevents duplicate API calls
  const fetchingRef   = useRef(false); // debounce guard — prevents duplicate fetch calls

  // ── Helpers ───────────────────────────────────────────────
  const safeQuestion = useCallback((idx, qs) => {
    const list = Array.isArray(qs) ? qs : questions;
    if (!list.length) return null;
    const safeIdx = Math.max(0, Math.min(idx, list.length - 1));
    return list[safeIdx] ?? null;
  }, [questions]);

  const buildSafeResult = useCallback((raw, submittedCode) => {
    const rawScore = typeof raw?.score === 'number' && !isNaN(raw.score) ? raw.score : 50;
    const score    = Math.max(0, Math.min(100, Math.round(rawScore)));

    const correctCode =
      raw?.correctCode    ||
      raw?.betterAnswer   ||
      raw?.expectedSolution ||
      question?.solution  ||
      question?.fixedCode ||
      question?.sampleAnswer ||
      'Not available';

    const mistakes =
      (Array.isArray(raw?.mistakes)   && raw.mistakes.length   > 0) ? raw.mistakes
    : (Array.isArray(raw?.weaknesses) && raw.weaknesses.length > 0) ? raw.weaknesses
    : ['Unable to fully analyze'];

    const breakdown = raw?.breakdown && typeof raw.breakdown === 'object'
      ? {
          correctness:  Math.max(0, Math.min(40, Number(raw.breakdown?.correctness)  || 0)),
          quality:      Math.max(0, Math.min(30, Number(raw.breakdown?.quality)       || 0)),
          completeness: Math.max(0, Math.min(30, Number(raw.breakdown?.completeness)  || 0)),
        }
      : {
          correctness:  Math.round(score * 0.4),
          quality:      Math.round(score * 0.3),
          completeness: Math.round(score * 0.3),
        };

    return {
      userCode:        submittedCode || '',
      correctCode,
      score,
      passed:          score >= 60,
      correct:         raw?.correct ?? score >= 60,
      mistakes,
      deductions:      Array.isArray(raw?.deductions) ? raw.deductions : [],
      feedback:        raw?.feedback?.trim() || 'Partial evaluation due to missing response',
      strengths:       Array.isArray(raw?.strengths) ? raw.strengths : [],
      breakdown,
      timeComplexity:  raw?.timeComplexity  || 'N/A',
      spaceComplexity: raw?.spaceComplexity || 'N/A',
      explanation:     raw?.explanation     || '',
    };
  }, [question]);

  // ── Memoized computed values ──────────────────────────────
  const totalQuestions  = useMemo(() => questions.length || 1, [questions]);
  const answeredCount   = useMemo(() => Object.values(answers).filter(a => a?.code && !a?.skipped).length, [answers]);
  const skippedCount    = useMemo(() => Object.values(answers).filter(a => a?.skipped).length, [answers]);
  const timePercent     = useMemo(() => question ? (timeLeft / (DURATIONS[difficulty] * 60)) * 100 : 100, [question, timeLeft, difficulty]);
  const isLowTime       = useMemo(() => timeLeft < 120 && started && !finished, [timeLeft, started, finished]);
  const scoreColor      = useCallback((s) => s >= 70 ? 'text-green-500' : s >= 40 ? 'text-orange-500' : 'text-destructive', []);
  const scoreEmoji      = useCallback((s) => s >= 85 ? '🎉' : s >= 70 ? '✅' : s >= 50 ? '⚡' : '❌', []);
  const gradeLetter     = useCallback((s) => s >= 90 ? 'A+' : s >= 80 ? 'A' : s >= 70 ? 'B' : s >= 60 ? 'C' : s >= 40 ? 'D' : 'F', []);

  // ── Load question at index ────────────────────────────────
  const loadQuestionAt = useCallback((idx, qs) => {
    const list = Array.isArray(qs) ? qs : questions;
    if (!list.length) return;
    const safeIdx = Math.max(0, Math.min(idx, list.length - 1));
    const q       = list[safeIdx];
    if (!q) return;
    const lang = LANG_MAP[q.category] || 'javascript';
    const saved = answers[safeIdx];
    setCurrentIdx(safeIdx);
    setQuestion(q);
    setLanguage(lang);
    setCode(saved?.code ?? DEFAULT_CODE(q.title ?? '', lang));
    setResult(saved?.result ?? null);
    setShowHints(false);
    setShowReveal(false);
    setCodeError('');
    setFinished(!!saved?.result);
  }, [questions, answers]);

  // ── handleEndSession — declared BEFORE handleNext ─────────
  const handleEndSession = useCallback(() => {
    clearInterval(timerRef.current);
    setSessionDone(true);
    setStarted(false);
    setFinished(true);
    const scores = Object.values(answers).map(a => a?.result?.score ?? 0);
    const avg    = scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : 0;
    recordInterviewResult(avg);
  }, [answers, recordInterviewResult]);

  // ── handleNext — crash-safe, uses handleEndSession ────────
  const handleNext = useCallback(() => {
    if (!questions.length) return;                          // no questions guard
    const nextIdx = currentIdx + 1;
    if (nextIdx >= questions.length) {
      handleEndSession();                                   // last question → end
      return;
    }
    loadQuestionAt(nextIdx, questions);
  }, [questions, currentIdx, handleEndSession, loadQuestionAt]);

  // ── handlePrev ────────────────────────────────────────────
  const handlePrev = useCallback(() => {
    if (!questions.length || currentIdx <= 0) return;
    loadQuestionAt(currentIdx - 1, questions);
  }, [questions, currentIdx, loadQuestionAt]);

  // ── handleSkip ────────────────────────────────────────────
  const handleSkip = useCallback(() => {
    if (!questions.length) return;
    setAnswers(prev => ({
      ...prev,
      [currentIdx]: { ...(prev[currentIdx] ?? {}), skipped: true, code: code || '' },
    }));
    handleNext();
  }, [questions, currentIdx, code, handleNext]);

  // ── startInterview ────────────────────────────────────────
  const startInterview = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setFetching(true);
    setResult(null);
    setShowHints(false);
    setShowReveal(false);
    setCodeError('');
    setAnswers({});
    setCurrentIdx(0);
    setQuestions([]);
    setSessionDone(false);
    setStarted(false);
    setFinished(false);

    try {
      const token = localStorage.getItem('devinspect-token');
      const res  = await fetch(INTERVIEW_START_URL, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          role:       'Software Engineer',
          domain:     category !== 'Any' ? category : '',
          language:   'JavaScript',
          difficulty,
          count:      8,
        }),
      });
      const data = await res.json();

      if (!data?.success || !Array.isArray(data?.questions) || data.questions.length === 0)
        throw new Error('Failed to load questions');

      const qs   = data.questions;
      const q    = qs[0];
      const lang = LANG_MAP[q?.category] || 'javascript';

      setQuestions(qs);
      setQuestion(q);
      setLanguage(lang);
      setCode(DEFAULT_CODE(q?.title ?? '', lang));
      setTimeLeft(DURATIONS[difficulty] * 60);
      setTimeSpent(0);
      setStarted(true);
      setFinished(false);
      toast.success(`🎉 Interview started! ${qs.length} questions loaded.`);
    } catch {
      toast.error('Failed to load questions. Please try again.');
    } finally {
      setFetching(false);
      fetchingRef.current = false;
    }
  }, [difficulty, category]);

  // ── Timer ─────────────────────────────────────────────────
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

  // ── submitSolution — debounce-guarded ─────────────────────
  const submitSolution = useCallback(async () => {
    if (submittingRef.current || loading) return;

    const stripped = (code || '').replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();
    if (!stripped || stripped.length < 10) {
      setCodeError('✏️ Please write your solution before submitting.');
      return;
    }

    submittingRef.current = true;
    setCodeError('');
    clearInterval(timerRef.current);
    setFinished(true);
    setLoading(true);

    const fallback = buildSafeResult({
      score:       50,
      feedback:    'Partial evaluation due to system limitation.',
      mistakes:    ['Unable to analyze'],
      correctCode: question?.solution || question?.fixedCode || 'Not available',
    }, code);

    try {
      const token = localStorage.getItem('devinspect-token');
      const res   = await fetch(INTERVIEW_EVAL_ANSWER_URL, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ question, answer: code, timeSpent }),
      });
      const data = await res.json();
      const safe = data?.success && data?.evaluation
        ? buildSafeResult(data.evaluation, code)
        : fallback;

      setResult(safe);
      setAnswers(prev => ({ ...prev, [currentIdx]: { code, result: safe, skipped: false } }));
      recordInterviewResult(safe.score ?? 0);

      // cute toast feedback
      if (safe.score >= 70) {
        toast.success('Hurray 🎉✨ Great answer!');
      } else if (safe.score >= 50) {
        toast.info('⚡ Decent attempt! Check the feedback.');
      } else {
        toast.error('Oops 😅 Try again — review the correct solution.');
      }
    } catch {
      toast.error('🌐 Network error during evaluation.');
      setResult(fallback);
      setAnswers(prev => ({ ...prev, [currentIdx]: { code, result: fallback, skipped: false } }));
    } finally {
      setLoading(false);
      setTimeout(() => { submittingRef.current = false; }, 500);
    }
  }, [code, question, difficulty, timeSpent, currentIdx, loading, buildSafeResult, recordInterviewResult]);

  // ── Editor onChange — stable callback ─────────────────────
  const handleCodeChange = useCallback((val) => {
    setCode(val || '');
    setCodeError('');
  }, []);

  // ── formatTime ────────────────────────────────────────────
  const formatTime = useCallback((secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, []);

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
              <motion.div
                animate={isLowTime ? { scale: [1, 1.08, 1] } : {}}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className={`flex items-center gap-2 font-mono font-bold text-2xl ${isLowTime ? 'text-destructive' : 'text-foreground'}`}
              >
                <Timer className="w-6 h-6" />
                {isLowTime && <span>⏰</span>}
                {formatTime(timeLeft)}
              </motion.div>
            )}
          </div>

          {/* Setup Panel */}
          {!started && !sessionDone && (
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
                  🎯 Select your preferences above and click <strong>Start Interview</strong>. AI will generate a realistic question and evaluate your solution.
                </p>
              </div>
            </div>
          )}

          {/* ── FINAL SUMMARY SCREEN ─────────────────────── */}
          {sessionDone && (() => {
            const allScores   = questions.map((_, i) => answers[i]?.result?.score ?? 0);
            const totalScore  = allScores.reduce((s, v) => s + v, 0);
            const maxScore    = questions.length * 100;
            const percentage  = questions.length ? Math.round((totalScore / maxScore) * 100) : 0;
            const correctCount= questions.filter((_, i) => (answers[i]?.result?.score ?? 0) >= 60 && !answers[i]?.skipped).length;
            const skippedCount= questions.filter((_, i) => answers[i]?.skipped).length;
            const wrongCount  = questions.filter((_, i) => !answers[i]?.skipped && (answers[i]?.result?.score ?? 0) < 60).length;
            const grade       = gradeLetter(percentage);
            const gradeColor  = percentage >= 70 ? 'text-green-500' : percentage >= 50 ? 'text-orange-500' : 'text-destructive';

            return (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="space-y-6"
              >
                {/* Score card */}
                <div className="card-glass p-8 rounded-3xl text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                  >
                    <Trophy className="w-14 h-14 text-yellow-500 mx-auto mb-2" />
                  </motion.div>
                  <h2 className="text-3xl font-extrabold">🎉 Interview Complete!</h2>
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 250, damping: 18, delay: 0.25 }}
                    className={`text-7xl font-black ${gradeColor}`}
                  >
                    {scoreEmoji(percentage)} {percentage}%
                  </motion.div>
                  <p className={`text-2xl font-bold ${gradeColor}`}>Grade: {grade}</p>
                  <p className="text-muted-foreground text-sm">
                    Total Score: <strong>{totalScore}</strong> / {maxScore}
                  </p>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 mt-4">
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                      <p className="text-2xl font-black text-green-500">{correctCount}</p>
                      <p className="text-xs text-muted-foreground">✅ Correct</p>
                    </div>
                    <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                      <p className="text-2xl font-black text-destructive">{wrongCount}</p>
                      <p className="text-xs text-muted-foreground">❌ Wrong</p>
                    </div>
                    <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                      <p className="text-2xl font-black text-orange-500">{skippedCount}</p>
                      <p className="text-xs text-muted-foreground">⏭️ Skipped</p>
                    </div>
                  </div>

                  <Button
                    onClick={startInterview}
                    disabled={fetching}
                    className="btn-primary h-10 px-8 rounded-xl font-bold gap-2 mt-2"
                  >
                    {fetching
                      ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      : <><RotateCcw className="w-4 h-4" /> Try Again</>}
                  </Button>
                </div>

                {/* Per-question solutions */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold">📚 Solutions & Review</h3>
                  {questions.map((q, i) => {
                    const ans      = answers[i];
                    const qScore   = ans?.result?.score ?? 0;
                    const skipped  = ans?.skipped;
                    const correct  = !skipped && qScore >= 60;
                    const solution = ans?.result?.correctCode || q?.solution || q?.fixedCode || q?.sampleAnswer || 'Not available';
                    const explanation = ans?.result?.explanation || q?.explanation || '';
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.07 }}
                        className="card-glass p-5 rounded-2xl space-y-3"
                      >
                        {/* Question header */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center border ${
                              skipped
                                ? 'bg-orange-500/20 text-orange-500 border-orange-500/40'
                                : correct
                                ? 'bg-green-500/20 text-green-500 border-green-500/40'
                                : 'bg-destructive/20 text-destructive border-destructive/40'
                            }`}>{i + 1}</span>
                            <p className="text-sm font-bold">{q?.title ?? `Question ${i + 1}`}</p>
                          </div>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                            skipped
                              ? 'bg-orange-500/10 text-orange-500'
                              : correct
                              ? 'bg-green-500/10 text-green-500'
                              : 'bg-destructive/10 text-destructive'
                          }`}>
                            {skipped ? '⏭️ Skipped' : correct ? `✅ ${qScore}/100` : `❌ ${qScore}/100`}
                          </span>
                        </div>

                        {/* Your answer */}
                        {!skipped && ans?.code && (
                          <div>
                            <p className="text-xs font-bold text-muted-foreground mb-1">📝 Your Answer</p>
                            <pre className="text-xs font-mono bg-muted/30 border border-border/20 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap max-h-36">{ans.code}</pre>
                          </div>
                        )}

                        {/* Correct solution */}
                        <div>
                          <p className="text-xs font-bold text-primary mb-1">✅ Correct Solution</p>
                          <pre className="text-xs font-mono bg-muted/30 border border-primary/20 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap max-h-48">{solution}</pre>
                        </div>

                        {/* Explanation */}
                        {explanation && (
                          <div className="p-3 bg-muted/20 rounded-xl border border-border/20">
                            <p className="text-xs font-bold text-muted-foreground mb-1">📖 Explanation</p>
                            <p className="text-xs text-foreground/70 leading-relaxed">{explanation}</p>
                          </div>
                        )}

                        {/* Feedback */}
                        {ans?.result?.feedback && (
                          <p className="text-xs text-muted-foreground">🧠 {ans.result.feedback}</p>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })()}
          {started && !sessionDone && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Question Navigator strip */}
              <div className="lg:col-span-12">
                <div className="card-glass px-4 py-3 rounded-2xl flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-muted-foreground mr-1">📍 Questions:</span>
                  {questions.map((_, i) => {
                    const ans = answers[i];
                    const isSkipped  = ans?.skipped;
                    const isAnswered = ans?.result && !isSkipped;
                    const isCurrent  = i === currentIdx;
                    return (
                      <button
                        key={i}
                        onClick={() => loadQuestionAt(i, questions)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all border ${
                          isCurrent
                            ? 'bg-primary text-primary-foreground border-primary scale-110'
                            : isAnswered
                            ? 'bg-green-500/20 text-green-500 border-green-500/40'
                            : isSkipped
                            ? 'bg-orange-500/20 text-orange-500 border-orange-500/40'
                            : 'bg-muted/30 text-muted-foreground border-border/30 hover:bg-muted/50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                  <span className="ml-auto text-xs text-muted-foreground">
                    ✅ {Object.values(answers).filter(a => a?.result && !a?.skipped).length} answered
                    &nbsp;· ⏭️ {Object.values(answers).filter(a => a?.skipped).length} skipped
                  </span>
                </div>
              </div>
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
                    }`}>
                      {difficulty === 'easy' ? '🟢' : difficulty === 'medium' ? '🟡' : '🔴'} {difficulty}
                    </span>
                    {question?.company && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary/10 text-primary">{question.company}</span>
                    )}
                    {question?.category && (
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-secondary/10 text-secondary">🎯 {question.category}</span>
                    )}
                  </div>

                  <h2 className="text-xl font-bold mb-3">🎯 {question?.title}</h2>
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
                      {showHints ? '🙈 Hide Hints' : '💡 Show Hints'}
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
                      initial={{ opacity: 0, y: 20, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className="card-glass p-6 rounded-3xl space-y-4"
                    >
                      {/* Score header */}
                      <div className="flex items-center gap-3">
                        <Trophy className="w-5 h-5 text-yellow-500 shrink-0" />
                        <h3 className="font-bold text-lg">📊 AI Evaluation</h3>
                        <motion.span
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.15 }}
                          className={`ml-auto text-3xl font-black ${scoreColor(result.score)}`}
                        >
                          {scoreEmoji(result.score)} {result.score}/100
                        </motion.span>
                      </div>

                      <motion.div
                        initial={result.passed ? { scale: 0.8, opacity: 0 } : { x: [-6, 6, -4, 4, 0], opacity: 0 }}
                        animate={result.passed ? { scale: 1, opacity: 1 } : { x: 0, opacity: 1 }}
                        transition={result.passed
                          ? { type: 'spring', stiffness: 260, damping: 16, delay: 0.2 }
                          : { duration: 0.4, delay: 0.2 }}
                        className={`flex items-center gap-2 text-sm font-bold ${result.passed ? 'text-green-500' : 'text-destructive'}`}
                      >
                        {result.passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {result.passed
                          ? `Hurray 🎉✨  Passed — Grade ${gradeLetter(result.score)}`
                          : `Oops 😅  Needs Improvement — Grade ${gradeLetter(result.score)}`}
                      </motion.div>

                      {/* Score breakdown */}
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">⚡ Score Breakdown</p>
                        <ScoreBar label="Correctness"   value={result.breakdown?.correctness  ?? 0} max={40} />
                        <ScoreBar label="Code Quality"  value={result.breakdown?.quality       ?? 0} max={30} />
                        <ScoreBar label="Completeness"  value={result.breakdown?.completeness  ?? 0} max={30} />
                      </div>

                      {/* Deductions */}
                      {result.deductions?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-orange-500 mb-1">⚠️ Deductions</p>
                          <ul className="space-y-0.5">
                            {result.deductions.map((d, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                                <AlertCircle className="w-3 h-3 text-orange-500 shrink-0 mt-0.5" /> {d}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Complexity */}
                      {(result.timeComplexity !== 'N/A' || result.spaceComplexity !== 'N/A') && (
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
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="text-sm text-muted-foreground leading-relaxed"
                        >
                          🧠 {result.feedback}
                        </motion.p>
                      )}

                      {/* Strengths */}
                      {result.strengths?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-green-500 mb-1">✅ Strengths</p>
                          <ul className="space-y-0.5">
                            {result.strengths.map((s, i) => (
                              <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className="text-xs text-muted-foreground flex gap-1.5"
                              >
                                <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0 mt-0.5" /> {s}
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Mistakes */}
                      {result.mistakes?.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-destructive mb-1">❌ Mistakes</p>
                          <ul className="space-y-0.5">
                            {result.mistakes.map((m, i) => (
                              <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 * i }}
                                className="text-xs text-muted-foreground flex gap-1.5"
                              >
                                <XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" /> {m}
                              </motion.li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Reveal Answer toggle */}
                      <button
                        onClick={() => setShowReveal(v => !v)}
                        className="flex items-center gap-1.5 text-xs font-bold text-primary hover:opacity-80 transition-opacity"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        {showReveal ? '🙈 Hide Answer' : '💡 Reveal Answer'}
                      </button>

                      <AnimatePresence>
                        {showReveal && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 overflow-hidden"
                          >
                            {/* Explanation */}
                            {result.explanation && (
                              <div className="p-3 bg-muted/20 rounded-xl border border-border/20">
                                <p className="text-xs font-bold text-muted-foreground mb-1">📖 Explanation</p>
                                <p className="text-xs text-foreground/70 leading-relaxed">{result.explanation}</p>
                              </div>
                            )}

                            {/* Side-by-side comparison */}
                            <div className="grid grid-cols-1 gap-3">
                              {/* Your code */}
                              <div>
                                <p className="text-xs font-bold text-muted-foreground mb-1">📝 Your Submission</p>
                                <pre className="text-xs font-mono bg-muted/30 border border-border/20 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap max-h-48">
                                  {result.userCode || '(empty)'}
                                </pre>
                              </div>

                              {/* Correct code */}
                              <div>
                                <p className="text-xs font-bold text-primary mb-1">✅ Correct Solution</p>
                                <pre className="text-xs font-mono bg-muted/30 border border-primary/20 rounded-xl p-3 overflow-x-auto whitespace-pre-wrap max-h-48">
                                  {result.correctCode && result.correctCode !== 'Not available'
                                    ? result.correctCode
                                    : question?.solution || question?.fixedCode || question?.sampleAnswer || 'Not available'}
                                </pre>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right: Code Editor */}
              <div className="lg:col-span-7">
                <div className="card-glass p-6 rounded-3xl h-full flex flex-col">
                  <div className="flex justify-between items-center mb-4 border-b border-border/30 pb-3">
                    <span className="text-sm font-bold text-muted-foreground">
                      💻 Solution Editor
                      <span className="ml-2 text-xs px-2 py-0.5 rounded bg-muted/40 border border-border/20">{language}</span>
                    </span>

                    {/* Question counter */}
                    <span className="text-xs font-bold text-muted-foreground px-2 py-1 rounded-lg bg-muted/30 border border-border/20">
                      🎯 Q {currentIdx + 1} / {totalQuestions}
                    </span>
                  </div>

                  {/* Navigation + Action bar */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {/* Prev — always show if not first question */}
                    {currentIdx > 0 && (
                      <Button
                        onClick={handlePrev}
                        disabled={fetching || loading}
                        variant="outline"
                        className="h-8 px-3 rounded-xl font-bold text-xs gap-1 border-border/30"
                      >
                        ← Prev
                      </Button>
                    )}

                    {/* Skip — only when not yet answered */}
                    {!finished && (
                      <Button
                        onClick={handleSkip}
                        disabled={fetching || loading}
                        variant="outline"
                        className="h-8 px-3 rounded-xl font-bold text-xs gap-1 border-border/30 text-orange-500 border-orange-500/30"
                      >
                        ⏭️ Skip
                      </Button>
                    )}

                    {/* Submit — only when not yet answered */}
                    {!finished && (
                      <Button
                        onClick={submitSolution}
                        disabled={loading || fetching}
                        className="btn-primary h-8 px-3 rounded-xl font-bold text-xs gap-1"
                      >
                        <Send className="w-3 h-3" /> Submit
                      </Button>
                    )}

                    {/* Next — after submitting or skipping, if more questions remain */}
                    {finished && currentIdx < totalQuestions - 1 && (
                      <Button
                        onClick={handleNext}
                        disabled={fetching}
                        className="btn-primary h-8 px-3 rounded-xl font-bold text-xs gap-1"
                      >
                        Next →
                      </Button>
                    )}

                    {/* Finish — after submitting last question */}
                    {finished && currentIdx >= totalQuestions - 1 && (
                      <Button
                        onClick={handleEndSession}
                        disabled={fetching}
                        className="btn-primary h-8 px-3 rounded-xl font-bold text-xs gap-1"
                      >
                        🏁 Finish
                      </Button>
                    )}

                    {/* New Interview — always available after finishing */}
                    {finished && (
                      <Button
                        onClick={startInterview}
                        disabled={fetching}
                        variant="outline"
                        className="h-8 px-3 rounded-xl font-bold text-xs gap-1 border-border/30 ml-auto"
                      >
                        <RotateCcw className="w-3 h-3" /> New
                      </Button>
                    )}
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
                      onChange={handleCodeChange}
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
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 mt-3 text-sm text-muted-foreground"
                    >
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                      🧠 Analyzing your solution...
                    </motion.div>
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
