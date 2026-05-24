import { useCallback } from 'react';
import confetti from 'canvas-confetti';

export const useConfetti = () => {
  // score: AI score 0-100, errors: array of found issues, degraded: fallback mode flag
  const celebrate = useCallback((score, errors = [], degraded = false) => {
    // Only fire confetti when code is genuinely clean:
    // score >= 90 AND no errors found AND not in degraded/fallback mode
    if (score < 90 || errors.length > 0 || degraded) return;
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#f472b6', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24'],
    });
  }, []);

  return { celebrate };
};
