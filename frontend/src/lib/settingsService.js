/**
 * Settings Service — handles all profile/preferences/rules API calls
 */
import { API_ORIGIN } from './apiConfig';

const getToken = () => localStorage.getItem('devinspect-token');

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

/**
 * Update user profile (name, githubUser, githubToken, generateApiKey)
 */
export const updateProfile = async (payload) => {
  const res = await fetch(`${API_ORIGIN}/api/user/profile`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update profile');

  // Sync localStorage
  const stored = localStorage.getItem('devinspect-user');
  if (stored) {
    try {
      const user = JSON.parse(stored);
      const updated = { ...user, ...data };
      localStorage.setItem('devinspect-user', JSON.stringify(updated));
    } catch { /* ignore */ }
  }
  return data;
};

/**
 * Save user preferences (theme, language, notifications, defaultLanguage)
 */
export const savePreferences = async (prefs) => {
  const res = await fetch(`${API_ORIGIN}/api/user/preferences`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(prefs),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to save preferences');

  // Persist locally
  localStorage.setItem('devinspect-preferences', JSON.stringify(prefs));
  return data;
};

/**
 * Save custom rules array to backend
 */
export const saveCustomRules = async (rules) => {
  const res = await fetch(`${API_ORIGIN}/api/user/rules`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ customRules: rules }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to save rules');

  // Persist locally
  localStorage.setItem('devinspect-rules', JSON.stringify(rules));
  return data;
};

/**
 * Load user settings (rules + preferences) from backend
 */
export const loadUserSettings = async () => {
  const res = await fetch(`${API_ORIGIN}/api/user/settings`, {
    headers: authHeaders(),
  });
  if (!res.ok) return null;
  return res.json();
};
