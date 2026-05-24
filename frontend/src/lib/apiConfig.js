/**
 * API Configuration for DevInspectAI
 */
const trimSlash = (value) => String(value || "").replace(/\/+$/, "");

// API Origin - configurable via environment variable
export const API_ORIGIN = trimSlash(
  import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5000"
);

// Authentication Endpoints
export const AUTH_LOGIN_URL    = `${API_ORIGIN}/api/auth/login`;
export const AUTH_REGISTER_URL = `${API_ORIGIN}/api/auth/register`;
export const AUTH_GOOGLE_URL   = `${API_ORIGIN}/api/auth/google`;
export const AUTH_GITHUB_URL   = `${API_ORIGIN}/api/auth/github`;

// User Endpoints
export const USER_PROFILE_URL     = `${API_ORIGIN}/api/user/profile`;
export const USER_PREFERENCES_URL = `${API_ORIGIN}/api/user/preferences`;
export const USER_RULES_URL       = `${API_ORIGIN}/api/user/rules`;
export const USER_SETTINGS_URL    = `${API_ORIGIN}/api/user/settings`;

// Analysis Endpoints
export const ANALYZE_CODE_URL = `${API_ORIGIN}/api/review/analyze`;
export const AI_ANALYZE_URL   = `${API_ORIGIN}/api/ai/analyze`;

// AI Service Endpoints
export const AI_HEALTH_URL = `${API_ORIGIN}/api/ai/health`;

// Workspace Endpoints
export const WORKSPACE_URL = `${API_ORIGIN}/api/workspace`;

// Analysis History Endpoints
export const ANALYSIS_URL = `${API_ORIGIN}/api/analysis`;

// Chat Endpoints
export const CHAT_URL = `${API_ORIGIN}/api/chat/followup`;

// Interview Endpoints
export const INTERVIEW_QUESTION_URL      = `${API_ORIGIN}/api/interview/question`;
export const INTERVIEW_SESSION_URL       = `${API_ORIGIN}/api/interview/session`;
export const INTERVIEW_EVALUATE_URL      = `${API_ORIGIN}/api/interview/evaluate`;
export const INTERVIEW_START_URL         = `${API_ORIGIN}/api/interview/start`;
export const INTERVIEW_EVAL_ANSWER_URL   = `${API_ORIGIN}/api/interview/evaluate-answer`;
export const INTERVIEW_FINISH_URL        = `${API_ORIGIN}/api/interview/finish`;
export const INTERVIEW_HISTORY_URL       = `${API_ORIGIN}/api/interview/history`;

// Upload Endpoint
export const UPLOAD_URL = `${API_ORIGIN}/api/upload`;

/**
 * Create fetch options with auth headers
 */
export const createAuthOptions = (method = 'GET', body = null) => {
  const token = localStorage.getItem('devinspect-token');
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }

  return options;
};