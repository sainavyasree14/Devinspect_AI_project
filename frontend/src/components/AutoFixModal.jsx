import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wand2, X, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AutoFixModal = ({ isOpen, onClose, errors, correctedCode, onApplyFix }) => {
  const [selectedFixes, setSelectedFixes] = useState(() =>
    errors?.map((_, i) => i) || []
  );

  if (!isOpen) return null;

  const toggleFix = (idx) => {
    setSelectedFixes(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleApply = () => {
    onApplyFix(correctedCode, selectedFixes);
    onClose();
  };

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
              <Wand2 className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold">Auto Fix All Issues</h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Select which fixes to apply. The AI-corrected code will replace your current editor content.
          </p>

          <div className="space-y-2 max-h-[240px] overflow-y-auto mb-5">
            {errors?.length > 0 ? errors.map((e, idx) => (
              <button
                key={idx}
                onClick={() => toggleFix(idx)}
                className="w-full flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border/20 text-left hover:bg-muted/50 transition-colors"
              >
                {selectedFixes.includes(idx)
                  ? <CheckSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  : <Square className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                }
                <div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mr-2 ${
                    String(e.severity).toLowerCase().includes('critical') || String(e.severity).toLowerCase().includes('high')
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-orange-500/10 text-orange-500'
                  }`}>{e.severity}</span>
                  <span className="text-xs text-foreground">{e.message}</span>
                  {e.fix && <p className="text-xs text-green-500 mt-0.5">→ {e.fix}</p>}
                </div>
              </button>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-4">Apply AI-corrected code to editor.</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl border-border/30">
              Cancel
            </Button>
            <Button onClick={handleApply} className="flex-1 btn-primary rounded-xl font-bold">
              <Wand2 className="w-4 h-4 mr-2" />
              Apply {selectedFixes.length > 0 ? `${selectedFixes.length} Fix${selectedFixes.length > 1 ? 'es' : ''}` : 'Fix'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AutoFixModal;
