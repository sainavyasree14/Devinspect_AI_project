import { useCallback } from 'react';
import confetti from 'canvas-confetti';

export const useConfetti = () => {
  const celebrate = useCallback((score) => {
    if (score < 90) return;
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#f472b6', '#a78bfa', '#60a5fa', '#34d399', '#fbbf24'],
    });
  }, []);

  return { celebrate };
};
