import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Trash2,
  Download,
  Copy,
  FileCode,
  Upload,
  GitBranch,
  Check,
  CheckCircle,
  MessageSquare,
  HelpCircle,
  Code,
  FileText,
  AlertTriangle,
  FolderOpen,
  Wand2,
  Share2,
  Users,
  Gamepad2
} from 'lucide-react';

import {
  downloadTextFile,
  copyToClipboard,
  getCodeExtension,
} from '../lib/downloadFile';

import { useAuth } from '../contexts/AuthContext.jsx';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import VoiceControls from '../components/VoiceControls.jsx';
import AutoFixModal from '../components/AutoFixModal.jsx';
import CollaborationRoom from '../components/CollaborationRoom.jsx';
import ShareAnalysis from '../components/ShareAnalysis.jsx';
import TypewriterText from '../components/TypewriterText.jsx';
import MiniGame from '../components/MiniGame.jsx';
import { useConfetti } from '../hooks/useConfetti.js';
import { useStreak } from '../contexts/StreakContext.jsx';

import {
  saveReviewToServer,
  getReviewsFromServer,
  deleteReviewFromServer,
  clearAllReviewsFromServer,
  normalizeMode
} from '../lib/historyStorage';
import { API_ORIGIN, createAuthOptions } from '../lib/apiConfig';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

const AnalyzerPage = () => {
  const { currentMode, currentUser, getAuthHeaders } = useAuth();
  const { celebrate } = useConfetti();
  const { recordReview } = useStreak();

  // Multi-file state
  const [files, setFiles] = useState([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  // States
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('auto');
  const [analysisMode, setAnalysisMode] = useState('developer');
  const [selectedWorkspace, setSelectedWorkspace] = useState('personal');
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [viewTab, setViewTab] = useState('diff');
  
  // New feature states
  const [showAutoFixModal, setShowAutoFixModal] = useState(false);
  const [showCollabRoom, setShowCollabRoom] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMiniGame, setShowMiniGame] = useState(false);
  const [currentAnalysisId, setCurrentAnalysisId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // prevent duplicate submissions
  
  // Repo integration simulations
  const [showRepoModal, setShowRepoModal] = useState(false);
  const [githubRepos] = useState([
    { name: 'ai-review-bot-dashboard', files: [{ name: 'server.js', code: 'const express = require("express");\nconst app = express();\n\n// SECURITY ISSUE: Hardcoded secret!\nconst JWT_SECRET = "super_secret_key_12345";\n\napp.get("/", (req, res) => {\n  res.send("Dashboard running");\n});\napp.listen(3000);' }] },
    { name: 'ecommerce-platform', files: [{ name: 'db.py', code: 'import sqlite3\n\ndef get_user(user_id):\n    # BUG: SQL Injection vulnerability!\n    conn = sqlite3.connect("users.db")\n    cursor = conn.cursor()\n    cursor.execute("SELECT * FROM users WHERE id = " + user_id)\n    return cursor.fetchone()' }] }
  ]);

  // Chat/Follow-up context simulation
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  // Load history and workspaces
  useEffect(() => {
    const initPage = async () => {
      try {
        const historyData = await getReviewsFromServer();
        setHistory(historyData);

        // Fetch team workspaces from backend
        const token = localStorage.getItem('devinspect-token');
        if (token) {
          const resp = await fetch(`${API_ORIGIN}/api/workspace`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
          });
          if (resp.ok) {
            const data = await resp.json();
            setWorkspaces(data);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    initPage();
  }, []);

  useEffect(() => {
    if (currentMode) {
      setAnalysisMode(normalizeMode(currentMode));
    }
  }, [currentMode]);

  // Auto detect programming language
  const detectLanguage = (snippet) => {
    const raw = String(snippet).trim();
    if (raw.startsWith('import ') || raw.includes('const ') || raw.includes('let ') || raw.includes('console.log')) {
      return 'javascript';
    }
    if (raw.includes('def ') || raw.includes('import os') || raw.includes('print(')) {
      return 'python';
    }
    if (raw.includes('public class ') || raw.includes('System.out.print')) {
      return 'java';
    }
    if (raw.includes('#include ') || raw.includes('std::cout')) {
      return 'cpp';
    }
    return 'javascript'; // Fallback
  };

  // Sync editor with active multi-file content
  useEffect(() => {
    if (files.length > 0 && files[activeFileIndex]) {
      setCode(files[activeFileIndex].content);
    }
  }, [files, activeFileIndex]);

  // Sync active file content when editing code
  const handleCodeChange = (val) => {
    setCode(val);
    if (files.length > 0) {
      const updated = [...files];
      updated[activeFileIndex].content = val;
      setFiles(updated);
    }
  };

  // Run AI Analysis
  const handleRun = async () => {
    if (isSubmitting) return; // prevent duplicate
    const finalCode = files.length > 0 
      ? files.map(f => `// File: ${f.name}\n${f.content}`).join('\n\n')
      : code;

    if (!finalCode.trim()) {
      toast.error('Please enter or upload code.');
      return;
    }

    setIsSubmitting(true);
    setLoading(true);
    setResult(null);
    setChatMessages([]);

    try {
      const mode = normalizeMode(analysisMode);
      const detectedLang = language === 'auto' ? detectLanguage(finalCode) : language;

      // Inject custom rules from localStorage
      const storedRules = localStorage.getItem('devinspect-rules');
      let customRules = [];
      try { customRules = JSON.parse(storedRules || '[]').filter(r => r.enabled !== false).map(r => r.text || r); } catch { /* ignore */ }

      const token = localStorage.getItem('devinspect-token');
      const response = await fetch(`${API_ORIGIN}/api/analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          text: finalCode,
          mode,
          language: detectedLang,
          workspaceId: selectedWorkspace !== 'personal' ? selectedWorkspace : undefined,
          customRules: customRules.length > 0 ? customRules : undefined,
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Analysis failed.');
      }

      const srvData = await response.json();
      const r = srvData.result || {};

      const payload = {
        input:         finalCode,
        language:      detectedLang,
        mode,
        correctedCode: r.correctedCode || '',
        explanation:   r.explanation   || '',
        modeOutput:    r.modeOutput    || '',
        errors:        Array.isArray(r.errors)      ? r.errors      : [],
        suggestions:   Array.isArray(r.suggestions) ? r.suggestions : [],
        questions:     Array.isArray(r.questions)   ? r.questions   : [],
        mistakes:      Array.isArray(r.mistakes)    ? r.mistakes    : [],
        steps:         Array.isArray(r.steps)       ? r.steps       : [],
        tips:          Array.isArray(r.tips)        ? r.tips        : [],
        aiScore:       (() => {
          let score = 100;
          (Array.isArray(r.errors) ? r.errors : []).forEach(e => {
            const sev = String(e.severity || '').toLowerCase();
            if (sev.includes('critical'))    score -= 25;
            else if (sev.includes('high'))   score -= 15;
            else if (sev.includes('medium')) score -= 8;
            else                             score -= 3;
          });
          return Math.max(0, Math.min(100, score));
        })(),
        degraded:      Boolean(r.degraded),
        timestamp:     new Date().toISOString(),
        workspaceId:   selectedWorkspace,
        id:            srvData._id || srvData.id,
      };

      setResult(payload);
      setCurrentAnalysisId(payload.id);
      
      // Confetti for high scores
      celebrate(payload.aiScore);
      
      // Record streak
      recordReview(payload.aiScore);
      
      const freshHistory = await getReviewsFromServer();
      setHistory(freshHistory);

      const isOfflineMode = srvData.result?.degraded === true || 
        srvData.result?.errors?.[0]?.message?.toLowerCase().includes('configure') ||
        srvData.result?.explanation?.toLowerCase().includes('offline') ||
        srvData.result?.explanation?.toLowerCase().includes('simulation');
      
      if (isOfflineMode) {
        toast.warning('Running in offline mode. Configure AI API keys for full analysis.');
      } else {
        toast.success('Code analysis completed successfully!');
      }
    } catch (error) {
      console.error(error);
      toast.error(error?.message || 'AI analysis failed');
      setResult(null);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  // File upload handler
  const handleFileUpload = (e) => {
    const fileList = Array.from(e.target.files);
    fileList.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const fileContent = event.target.result;
        const newFile = { name: file.name, content: fileContent };
        setFiles(prev => {
          const updated = [...prev, newFile];
          setActiveFileIndex(updated.length - 1);
          return updated;
        });
        toast.success(`Uploaded ${file.name}`);
      };
      reader.readAsText(file);
    });
  };

  // Pull from GitHub simulation
  const handleImportGithubFile = (gitFile) => {
    const newFile = { name: gitFile.name, content: gitFile.code };
    setFiles(prev => {
      const updated = [...prev, newFile];
      setActiveFileIndex(updated.length - 1);
      return updated;
    });
    setShowRepoModal(false);
    toast.success(`Imported ${gitFile.name} from simulated Git repository`);
  };

  // Apply One-Click Fix
  const handleApplyFix = () => {
    if (!result?.correctedCode) return;
    handleCodeChange(result.correctedCode);
    toast.success('Suggested refactored code applied to editor!');
  };

  // Auto Fix All — opens confirmation modal
  const handleAutoFixAll = () => {
    if (!result?.correctedCode) return;
    setShowAutoFixModal(true);
  };

  // Apply fix from modal
  const handleConfirmFix = (correctedCode) => {
    handleCodeChange(correctedCode);
    toast.success('Fix applied to editor!');
  };

  // Real AI Chat - calls /api/chat/followup with analysis context
  const handleSendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg = { sender: 'user', text: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput('');

    // Optimistic loading indicator
    setChatMessages(prev => [...prev, { sender: 'ai', text: '...', loading: true }]);

    try {
      const token = localStorage.getItem('devinspect-token');
      const response = await fetch(`${API_ORIGIN}/api/chat/followup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: currentInput,
          context: result ? {
            mode:         result.mode,
            language:     result.language,
            aiScore:      result.aiScore,
            explanation:  result.explanation,
            correctedCode: result.correctedCode,
            errors:       result.errors,
            suggestions:  result.suggestions,
            questions:    result.questions,
          } : null,
        }),
      });

      const data = await response.json();
      const replyText = data.reply || 'No response from AI assistant.';

      // Replace loading indicator with real reply
      setChatMessages(prev => [
        ...prev.filter(m => !m.loading),
        { sender: 'ai', text: replyText },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setChatMessages(prev => [
        ...prev.filter(m => !m.loading),
        { sender: 'ai', text: 'Chat assistant is temporarily unavailable. Please try again.' },
      ]);
    }
  };

  const handleExportMarkdown = () => {
    if (!result) return;
    const md = `# DevInspect Code Review Report
**Date:** ${new Date(result.timestamp).toLocaleDateString()}
**Language:** ${result.language.toUpperCase()}
**Workspace Mode:** ${result.mode.toUpperCase()}
**AI Score:** ${result.aiScore}/100

## 📝 Summary Explanation
${result.explanation}

## 🔍 Findings & Suggestions
${result.errors.length === 0 ? '- No major issues identified.' : result.errors.map((e, idx) => `
### ${idx + 1}. [${e.severity}] ${e.category} (Line ${e.line})
* **Issue:** ${e.message}
`).join('')}

## 🚀 Refactored Code Suggestions
\`\`\`${result.language}
${result.correctedCode}
\`\`\`
`;
    downloadTextFile(md, 'code_review_report.md');
    toast.success('Markdown report downloaded.');
  };

  return (
    <>
      <Helmet>
        <title>Code Review Analyzer | DevInspectAI</title>
      </Helmet>

      <div className="w-full min-h-screen py-8 text-foreground bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          
          {/* Top Title */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-extrabold text-gradient mb-2">AI Code Review</h1>
              <p className="text-muted-foreground">Select files, paste snippets, or connect repositories to run deep reviews.</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Workspace select */}
              <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                <SelectTrigger className="w-[180px] h-10 input-premium">
                  <SelectValue placeholder="Select Workspace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">Personal Workspace</SelectItem>
                  {workspaces.map(w => (
                    <SelectItem key={w._id} value={w._id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Language select */}
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-[140px] h-10 input-premium">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-Detect</SelectItem>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Input Workspace - Column 7 */}
            <div className="lg:col-span-7 space-y-6">
              <div className="card-glass p-6 rounded-3xl relative">
                
                {/* Editor File Tabs */}
                <div className="flex justify-between items-center mb-4 border-b border-border/30 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {files.length === 0 ? (
                      <span className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5"><FileCode className="w-4 h-4" /> Snippet Editor</span>
                    ) : (
                      files.map((f, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveFileIndex(idx)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-2 border transition-all ${
                            activeFileIndex === idx 
                              ? 'bg-primary/20 text-primary border-primary/30' 
                              : 'bg-muted/50 border-border/20 text-muted-foreground'
                          }`}
                        >
                          {f.name}
                          <Trash2 className="w-3.5 h-3.5 text-destructive hover:scale-110" onClick={(e) => {
                            e.stopPropagation();
                            const filtered = files.filter((_, i) => i !== idx);
                            setFiles(filtered);
                            setActiveFileIndex(Math.max(0, filtered.length - 1));
                          }} />
                        </button>
                      ))
                    )}
                  </div>
                  
                  {/* File Input and Git Actions */}
                  <div className="flex items-center gap-2">
                    <label className="btn-secondary h-8 px-3 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer font-bold border border-border/50 bg-background/50 hover:bg-muted/50">
                      <Upload className="w-3.5 h-3.5" /> Upload File
                      <input type="file" onChange={handleFileUpload} className="hidden" multiple />
                    </label>
                    <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-bold border-border/50" onClick={() => setShowRepoModal(true)}>
                      <GitBranch className="w-3.5 h-3.5 mr-1" /> Git Repo
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs font-bold border-border/50" onClick={() => setShowCollabRoom(true)}>
                      <Users className="w-3.5 h-3.5 mr-1" /> Collab
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold" onClick={() => setShowMiniGame(true)} title="Play Mini Game">
                      <Gamepad2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Editor Textarea */}
                <Textarea
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="// Paste your raw code here, upload files, or import from GitHub..."
                  className="font-mono text-sm leading-relaxed min-h-[380px] bg-background/50 rounded-2xl border-border/30 resize-none p-4"
                />

                {/* Trigger Row */}
                <div className="flex justify-between items-center mt-6">
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => { setCode(''); setFiles([]); }} className="h-10 w-10 border border-border/30 hover:bg-destructive/10 hover:text-destructive rounded-xl" title="Clear Editor">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  <Button onClick={handleRun} disabled={loading} className="btn-primary px-8 h-11 rounded-xl font-bold shadow-lg shadow-primary/20">
                    {loading ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2 fill-current" /> Run AI Review
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* AI Review Result Sidebar - Column 5 */}
            <div className="lg:col-span-5 space-y-6">
              
              {!result && !loading ? (
                <div className="card-glass min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                  <Code className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Review Active</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">Run analysis on your code editor to populate findings, recommendations, and inline suggestion fixes.</p>
                </div>
              ) : loading ? (
                <div className="card-glass min-h-[500px] flex flex-col items-center justify-center text-center p-8">
                  <motion.div animate={{ scale: [1, 1.1, 1], rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }} className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                    <Code className="w-8 h-8 text-primary" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-2">AI Analyzing Code</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">Connecting to LLM, scanning for bugs, security vulnerability scanning, style guides, and optimization paths.</p>
                </div>
              ) : (
                <div className="card-glass p-6 rounded-3xl space-y-6 min-h-[520px] flex flex-col justify-between">
                  <div>
                    {/* Header Details */}
                    <div className="flex justify-between items-center mb-4 border-b border-border/30 pb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gradient">AI Review Results</h3>
                        <span className="text-xs text-muted-foreground capitalize">Mode: {result.mode} · Score: <strong className="text-foreground">{result.aiScore}/100</strong></span>
                      </div>
                      
                      <div className="flex gap-2 flex-wrap justify-end">
                        <VoiceControls text={result.explanation || result.modeOutput || 'No explanation available.'} />
                        <Button variant="outline" size="icon" onClick={handleExportMarkdown} className="h-9 w-9 border-border/30 rounded-xl" title="Export Report">
                          <Download className="w-4 h-4" />
                        </Button>
                        {currentAnalysisId && (
                          <Button variant="outline" size="icon" onClick={() => setShowShareModal(true)} className="h-9 w-9 border-border/30 rounded-xl" title="Share Analysis">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        )}
                        {result.correctedCode && (
                          <Button onClick={handleAutoFixAll} className="btn-secondary h-9 rounded-xl font-bold text-xs gap-1.5">
                            <Wand2 className="w-3.5 h-3.5" /> Auto Fix All
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* View Selection Tabs */}
                    <div className="grid grid-cols-3 gap-2 mb-4 bg-muted/40 p-1 rounded-xl">
                      <button onClick={() => setViewTab('diff')} className={`py-1.5 text-xs font-bold rounded-lg ${viewTab === 'diff' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>Diff Viewer</button>
                      <button onClick={() => setViewTab('explanation')} className={`py-1.5 text-xs font-bold rounded-lg ${viewTab === 'explanation' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>Summary</button>
                      <button onClick={() => setViewTab('raw')} className={`py-1.5 text-xs font-bold rounded-lg ${viewTab === 'raw' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>Prompt Output</button>
                    </div>

                    {/* Active tab content */}
                    {viewTab === 'diff' && (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-border/30 overflow-hidden font-mono text-xs max-h-[220px] overflow-y-auto bg-muted/20">
                          <div className="bg-muted/60 px-3 py-1 text-[10px] text-muted-foreground border-b border-border/30">Side-by-Side Suggested Refactor</div>
<pre className="p-3 text-green-500 overflow-x-auto whitespace-pre">
  {result.correctedCode ?? '// No corrected code output'}
</pre>                        </div>

                        {/* Inline Findings */}
                        <div className="space-y-2.5">
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Findings ({result.errors.length})</h4>
                          {result.errors.length === 0 ? (
                            <div className="text-xs text-muted-foreground p-3 bg-green-500/10 rounded-xl border border-green-500/20 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> No severe issues found.</div>
                          ) : (
                            result.errors.map((e, idx) => {
                              const sev = String(e.severity || '').toLowerCase();
                              const isHigh = sev === 'critical' || sev === 'high';
                              return (
                                <div key={idx} className="p-3 bg-muted/30 rounded-xl border border-border/30 text-xs">
                                  <div className="flex justify-between items-center mb-1.5">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                      isHigh ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                                    }`}>{e.severity} Severity</span>
                                    <span className="text-[10px] text-muted-foreground">{e.category} · Line {e.line || 'N/A'}</span>
                                  </div>
                                  <p className="text-foreground leading-relaxed">{e.message}</p>
                                  {e.why  && <p className="text-muted-foreground mt-1 leading-relaxed">Why: {e.why}</p>}
                                  {e.fix  && <p className="text-green-500 mt-1 leading-relaxed">Fix: {e.fix}</p>}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {viewTab === 'explanation' && (
                      <div className="space-y-3">
                        <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                          <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                            <TypewriterText text={result.explanation || 'No explanation available.'} speed={12} />
                          </p>
                        </div>

                        {/* Student mode extras */}
                        {result.steps?.length > 0 && (
                          <div className="p-3 bg-muted/30 rounded-xl border border-border/20">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Steps</h4>
                            <ol className="space-y-1">
                              {result.steps.map((s, i) => (
                                <li key={i} className="text-xs text-foreground/80 flex gap-2">
                                  <span className="text-primary font-bold shrink-0">{i + 1}.</span> {s}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {result.tips?.length > 0 && (
                          <div className="p-3 bg-muted/30 rounded-xl border border-border/20">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tips</h4>
                            <ul className="space-y-1">
                              {result.tips.map((t, i) => (
                                <li key={i} className="text-xs text-foreground/80 flex gap-2"><span className="text-primary">•</span> {t}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {result.mistakes?.length > 0 && (
                          <div className="p-3 bg-muted/30 rounded-xl border border-border/20">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Mistakes</h4>
                            <div className="space-y-2">
                              {result.mistakes.map((m, i) => (
                                <div key={i} className="text-xs">
                                  <p className="font-semibold text-destructive">{m.issue || m}</p>
                                  {m.whyItHappened && <p className="text-muted-foreground mt-0.5">Why: {m.whyItHappened}</p>}
                                  {m.fix && <p className="text-green-500 mt-0.5">Fix: {m.fix}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Interviewer mode: questions */}
                        {result.questions?.length > 0 && (
                          <div className="p-3 bg-muted/30 rounded-xl border border-border/20">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Interview Questions ({result.questions.length})</h4>
                            <div className="space-y-3">
                              {result.questions.map((q, i) => (
                                <div key={i} className="text-xs border-l-2 border-primary/40 pl-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      q.difficulty === 'hard'   ? 'bg-destructive/10 text-destructive' :
                                      q.difficulty === 'medium' ? 'bg-orange-500/10 text-orange-500' :
                                                                   'bg-green-500/10 text-green-500'
                                    }`}>{q.difficulty}</span>
                                    <p className="font-semibold text-foreground">{q.question}</p>
                                  </div>
                                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{q.answer}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Developer mode: suggestions */}
                        {result.suggestions?.length > 0 && (
                          <div className="p-3 bg-muted/30 rounded-xl border border-border/20">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Suggestions</h4>
                            <ul className="space-y-1">
                              {result.suggestions.map((s, i) => (
                                <li key={i} className="text-xs text-foreground/80 flex gap-2"><span className="text-primary">→</span> {s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {viewTab === 'raw' && (
                      <div className="rounded-xl border border-border/30 p-3 bg-muted/20 font-mono text-xs overflow-x-auto max-h-[300px] overflow-y-auto">
                        <pre className="whitespace-pre-wrap">
                          {result.modeOutput || 'No output details.'}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Follow Up Chat Interface */}
                  <div className="border-t border-border/30 pt-4 mt-6">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Review Chat Assistant</h4>
                    
                    <div className="space-y-2 max-h-[140px] overflow-y-auto mb-3 pr-1 text-xs">
                      {chatMessages.length === 0 ? (
                        <p className="text-muted-foreground italic text-center py-2">Ask a follow-up question about this AI analysis.</p>
                      ) : (
                        chatMessages.map((msg, i) => (
                          <div key={i} className={`p-2 rounded-xl max-w-[85%] ${msg.sender === 'user' ? 'bg-primary/20 ml-auto text-right' : 'bg-muted border border-border/30'}`}>
                            <p className="leading-relaxed">{msg.loading ? <span className="animate-pulse">AI is thinking...</span> : msg.text}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Why is this vulnerable?"
                        className="h-9 text-xs input-premium"
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                      />
                      <Button onClick={handleSendChatMessage} className="h-9 btn-primary text-xs px-3">Send</Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GitHub Repository Modal Simulation */}
      {showRepoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card-glass w-full max-w-lg p-6 rounded-3xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gradient">Simulated GitHub Repositories</h3>
              <button onClick={() => setShowRepoModal(false)} className="text-muted-foreground hover:text-foreground">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-muted-foreground">Select a repository and file to pull code into your dashboard reviewer:</p>

            <div className="space-y-4">
              {githubRepos.map((repo, idx) => (
                <div key={idx} className="p-4 bg-muted/40 rounded-2xl border border-border/20">
                  <div className="font-semibold text-sm mb-2 text-primary flex items-center gap-1.5"><GitBranch className="w-4 h-4" /> {repo.name}</div>
                  <div className="flex flex-col gap-1.5 pl-5">
                    {repo.files.map((file, fIdx) => (
                      <button
                        key={fIdx}
                        onClick={() => handleImportGithubFile(file)}
                        className="text-xs hover:text-primary transition-colors flex items-center gap-2 py-1 text-muted-foreground w-full text-left"
                      >
                        <FileCode className="w-3.5 h-3.5" /> {file.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Auto Fix Modal */}
      <AutoFixModal
        isOpen={showAutoFixModal}
        onClose={() => setShowAutoFixModal(false)}
        errors={result?.errors}
        correctedCode={result?.correctedCode}
        onApplyFix={handleConfirmFix}
      />

      {/* Collaboration Room */}
      <CollaborationRoom
        isOpen={showCollabRoom}
        onClose={() => setShowCollabRoom(false)}
        code={code}
        onCodeChange={handleCodeChange}
        userName={currentUser?.name || 'Developer'}
      />

      {/* Share Analysis */}
      <ShareAnalysis
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        analysisId={currentAnalysisId}
      />

      {/* Mini Game */}
      <MiniGame isOpen={showMiniGame} onClose={() => setShowMiniGame(false)} />
    </>
  );
};

export default AnalyzerPage;