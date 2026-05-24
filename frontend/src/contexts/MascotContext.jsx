import React, { createContext, useContext, useCallback } from 'react';

const MascotContext = createContext(null);

// No-op provider — mascot/chibi UI has been removed
export const MascotProvider = ({ children }) => {
  const triggerMascot = useCallback(() => {}, []);
  const dismiss = useCallback(() => {}, []);
  return (
    <MascotContext.Provider value={{ current: null, triggerMascot, dismiss }}>
      {children}
    </MascotContext.Provider>
  );
};

export const useMascot = () => {
  const ctx = useContext(MascotContext);
  if (!ctx) return { current: null, triggerMascot: () => {}, dismiss: () => {} };
  return ctx;
};

export const MASCOT_EVENTS = {};
