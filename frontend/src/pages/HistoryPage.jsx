import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Trash2,
  Bookmark,
  Calendar,
  Code,
  Sliders,
  ExternalLink,
  BookOpen,
  Filter,
  CheckCircle,
  X
} from 'lucide-react';
import {
  getReviewsFromServer,
  deleteReviewFromServer,
  clearAllReviewsFromServer,
  toggleBookmarkOnServer
} from '../lib/historyStorage';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

const HistoryPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);
  const [activeReview, setActiveReview] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await getReviewsFromServer();
      setReviews(data);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load review history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleToggleBookmark = async (id) => {
    try {
      await toggleBookmarkOnServer(id);
      // Sync list
      const updated = reviews.map(r => r.id === id ? { ...r, isBookmarked: !r.isBookmarked } : r);
      setReviews(updated);
      toast.success('Bookmark state updated');
    } catch {
      toast.error('Failed to update bookmark');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteReviewFromServer(id);
      setReviews(prev => prev.filter(r => r.id !== id));
      if (activeReview?.id === id) setActiveReview(null);
      toast.success('Review deleted');
    } catch {
      toast.error('Failed to delete review');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete all review history?')) return;
    try {
      await clearAllReviewsFromServer();
      setReviews([]);
      setActiveReview(null);
      toast.success('History cleared successfully!');
    } catch {
      toast.error('Failed to clear history');
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter(r => {
    const matchesSearch = 
      r.input.toLowerCase().includes(searchTerm.toLowerCase()) || 
      r.explanation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLang = selectedLanguage === 'all' || r.language.toLowerCase() === selectedLanguage.toLowerCase();
    const matchesBookmark = !showBookmarkedOnly || r.isBookmarked;

    return matchesSearch && matchesLang && matchesBookmark;
  });

  return (
    <>
      <Helmet>
        <title>Review History | DevInspectAI</title>
      </Helmet>

      <div className="w-full min-h-screen py-8 text-foreground bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gradient mb-2">Review History</h1>
              <p className="text-muted-foreground">Search and manage all past AI code review runs and reports.</p>
            </div>
            
            {reviews.length > 0 && (
              <Button onClick={handleClearAll} variant="outline" className="border-destructive/30 hover:bg-destructive/10 hover:text-destructive h-10 rounded-xl font-bold">
                <Trash2 className="w-4 h-4 mr-2" /> Clear All History
              </Button>
            )}
          </div>

          {/* Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8 bg-muted/20 p-4 rounded-2xl border border-border/30">
            <div className="md:col-span-6 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search history content or summary..."
                className="pl-10 h-11 text-sm bg-background border-border/30 rounded-xl"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full h-11 px-3 text-sm bg-background border border-border/30 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Languages</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>

            <div className="md:col-span-3 flex items-center justify-center">
              <button
                onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)}
                className={`w-full h-11 px-4 rounded-xl flex items-center justify-center gap-2 border text-sm font-semibold transition-all ${
                  showBookmarkedOnly 
                    ? 'bg-primary/10 border-primary/30 text-primary' 
                    : 'bg-background border-border/30 text-muted-foreground'
                }`}
              >
                <Bookmark className={`w-4 h-4 ${showBookmarkedOnly ? 'fill-current' : ''}`} /> Bookmarked Only
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center min-h-[300px]">
              <p className="text-muted-foreground animate-pulse">Loading saved reviews...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Reviews List - Column 6 */}
              <div className="lg:col-span-6 space-y-4 max-h-[600px] overflow-y-auto pr-1">
                {filteredReviews.length === 0 ? (
                  <div className="card-glass p-8 text-center text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No matching reviews found in database history.</p>
                  </div>
                ) : (
                  filteredReviews.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => setActiveReview(r)}
                      className={`card-glass p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center gap-4 ${
                        activeReview?.id === r.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border/30 hover:border-primary/50'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-0.5 rounded-md capitalize">{r.language}</span>
                          <span className="text-xs font-semibold text-muted-foreground capitalize">{r.mode} mode</span>
                        </div>
                        
                        <p className="text-sm font-semibold text-foreground/90 truncate mb-1">{r.explanation}</p>
                        
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(r.timestamp).toLocaleDateString()} at {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleToggleBookmark(r.id)} className="p-2 hover:bg-muted rounded-xl transition-all">
                          <Bookmark className={`w-4 h-4 ${r.isBookmarked ? 'text-primary fill-current' : 'text-muted-foreground'}`} />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="p-2 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-xl transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Selected Review Details Panel - Column 6 */}
              <div className="lg:col-span-6">
                {!activeReview ? (
                  <div className="card-glass p-8 text-center text-muted-foreground min-h-[300px] flex flex-col justify-center items-center">
                    <Code className="w-12 h-12 mb-3 opacity-30" />
                    <p>Select a history item from the list to display details, suggestions, and diff code.</p>
                  </div>
                ) : (
                  <div className="card-glass p-6 rounded-3xl space-y-6 animate-fade-in relative">
                    <button onClick={() => setActiveReview(null)} className="absolute right-4 top-4 text-muted-foreground hover:text-foreground">
                      <X className="w-5 h-5" />
                    </button>

                    <div className="border-b border-border/30 pb-4">
                      <h3 className="font-extrabold text-xl mb-1 capitalize text-gradient">{activeReview.language} Analysis</h3>
                      <p className="text-xs text-muted-foreground capitalize">Saved: {new Date(activeReview.timestamp).toLocaleString()} · Mode: {activeReview.mode}</p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Summary Explanation</h4>
                        <p className="text-sm bg-muted/40 p-4 rounded-xl border border-border/20 leading-relaxed">{activeReview.explanation}</p>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Refactored Suggestion</h4>
                        <div className="rounded-xl border border-border/30 overflow-hidden font-mono text-xs max-h-[220px] overflow-y-auto bg-muted/20">
                          <pre className="p-3 text-green-500 overflow-x-auto whitespace-pre">{activeReview.correctedCode || '// No corrected code suggestion'}</pre>
                        </div>
                      </div>

                      {activeReview.errors.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Issues ({activeReview.errors.length})</h4>
                          <div className="space-y-2">
                            {activeReview.errors.map((e, idx) => (
                              <div key={idx} className="p-3 bg-muted/40 rounded-xl border border-border/20 text-xs">
                                <div className="flex justify-between items-center mb-1">
                                  <strong className="text-destructive font-bold">{e.severity} Severity</strong>
                                  <span className="text-[10px] text-muted-foreground">Line {e.line || 'All'} · {e.category}</span>
                                </div>
                                <p className="text-foreground/90">{e.message}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HistoryPage;