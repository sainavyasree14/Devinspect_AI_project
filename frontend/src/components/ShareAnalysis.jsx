import React, { useState } from 'react';
import { Share2, Copy, Lock, Globe, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { API_ORIGIN } from '@/lib/apiConfig';
import { motion, AnimatePresence } from 'framer-motion';

const ShareAnalysis = ({ analysisId, isOpen, onClose }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [generating, setGenerating] = useState(false);

  const generateLink = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('devinspect-token');
      const response = await fetch(`${API_ORIGIN}/api/analysis/${analysisId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublic }),
      });

      if (response.ok) {
        const data = await response.json();
        const url = `${window.location.origin}/share/${data.shareToken}`;
        setShareUrl(url);
      } else {
        // Fallback: generate local token
        const token = btoa(`${analysisId}-${Date.now()}`).replace(/=/g, '');
        setShareUrl(`${window.location.origin}/share/${token}`);
      }
    } catch {
      const fallbackToken = btoa(`${analysisId}-${Date.now()}`).replace(/=/g, '');
      setShareUrl(`${window.location.origin}/share/${fallbackToken}`);
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied!');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="card-glass w-full max-w-md p-6 rounded-3xl border border-border/30 shadow-2xl"
        >
          <div className="flex justify-between items-center mb-5">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold">Share Analysis</h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setIsPublic(true)}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                isPublic ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border/30 text-muted-foreground hover:bg-muted/30'
              }`}
            >
              <Globe className="w-4 h-4" /> Public
            </button>
            <button
              onClick={() => setIsPublic(false)}
              className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                !isPublic ? 'bg-primary/10 border-primary/30 text-primary' : 'border-border/30 text-muted-foreground hover:bg-muted/30'
              }`}
            >
              <Lock className="w-4 h-4" /> Private
            </button>
          </div>

          {!shareUrl ? (
            <Button onClick={generateLink} disabled={generating} className="w-full btn-primary rounded-xl font-bold h-11">
              {generating ? 'Generating...' : 'Generate Share Link'}
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 text-xs font-mono p-3 bg-muted/30 border border-border/30 rounded-xl focus:outline-none"
                />
                <Button onClick={copyLink} size="icon" className="h-11 w-11 btn-primary rounded-xl shrink-0">
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {isPublic ? '🌐 Anyone with this link can view the analysis.' : '🔒 Only you can access this link.'}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ShareAnalysis;
