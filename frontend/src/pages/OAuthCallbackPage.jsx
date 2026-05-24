import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Clear all user-scoped localStorage keys before writing a new user session
const clearAllUserData = () => {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (
      key.startsWith('devinspect-gamification-') ||
      key.startsWith('devinspect-streak-') ||
      key.startsWith('devinspect-history-') ||
      key.startsWith('devinspect-avatar-') ||
      key.startsWith('devinspect-rules-') ||
      key.startsWith('devinspect-preferences-')
    ) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
  // Legacy unscoped keys
  localStorage.removeItem('devinspect-gamification');
  localStorage.removeItem('devinspect-streak');
  localStorage.removeItem('devinspect-history');
  localStorage.removeItem('devinspect-preferences');
  localStorage.removeItem('devinspect-rules');
};

const OAuthCallbackPage = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      window.location.replace('/login?error=oauth_failed');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      const mappedUser = {
        id:          payload.id          || '',
        email:       payload.email       || '',
        name:        payload.name        || '',
        role:        payload.role        || 'user',
        currentMode: payload.currentMode || 'developer',
        avatar:      payload.avatar      || '',
      };

      // ⚠️ Clear previous user's data BEFORE writing new user
      clearAllUserData();

      localStorage.setItem('devinspect-token', token);
      localStorage.setItem('devinspect-user',  JSON.stringify(mappedUser));
      localStorage.setItem('devinspect-mode',  mappedUser.currentMode);
    } catch {
      // Decode failed — still clear old data and store token
      clearAllUserData();
      localStorage.setItem('devinspect-token', token);
    }

    window.location.replace('/welcome');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex items-center justify-center bg-animated">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Completing sign in...</p>
      </div>
    </div>
  );
};

export default OAuthCallbackPage;
