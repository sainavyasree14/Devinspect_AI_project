import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

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
      // Decode JWT payload — backend already verified signature
      const payload = JSON.parse(atob(token.split('.')[1]));

      const mappedUser = {
        id:          payload.id          || '',
        email:       payload.email       || '',
        name:        payload.name        || '',
        role:        payload.role        || 'user',
        currentMode: payload.currentMode || 'developer',
        avatar:      payload.avatar      || '',
      };

      localStorage.setItem('devinspect-token', token);
      localStorage.setItem('devinspect-user',  JSON.stringify(mappedUser));
      localStorage.setItem('devinspect-mode',  mappedUser.currentMode);
    } catch {
      // Decode failed — store token only; AuthContext will handle the rest
      localStorage.setItem('devinspect-token', token);
    }

    // Full reload so AuthContext re-initializes from localStorage
    window.location.replace('/dashboard');
  }, []);

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