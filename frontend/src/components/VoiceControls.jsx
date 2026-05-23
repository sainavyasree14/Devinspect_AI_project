import React from 'react';
import { Volume2, Pause, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoice } from '@/hooks/useVoice';

const VoiceControls = ({ text }) => {
  const { speak, pause, resume, stop, speaking, paused } = useVoice();

  if (!window.speechSynthesis) return null;

  return (
    <div className="flex items-center gap-1.5">
      {!speaking ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => speak(text)}
          className="h-8 px-3 text-xs rounded-xl border-border/30 gap-1.5 hover:bg-primary/10 hover:text-primary"
          title="Explain with Voice"
        >
          <Volume2 className="w-3.5 h-3.5" />
          Explain
        </Button>
      ) : (
        <>
          <Button
            variant="outline"
            size="icon"
            onClick={paused ? resume : pause}
            className="h-8 w-8 rounded-xl border-border/30 hover:bg-primary/10"
            title={paused ? 'Resume' : 'Pause'}
          >
            {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={stop}
            className="h-8 w-8 rounded-xl border-border/30 hover:bg-destructive/10 hover:text-destructive"
            title="Stop"
          >
            <Square className="w-3.5 h-3.5" />
          </Button>
          <span className="text-xs text-primary animate-pulse font-medium">Speaking...</span>
        </>
      )}
    </div>
  );
};

export default VoiceControls;
