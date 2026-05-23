import { API_ORIGIN, ANALYSIS_URL } from './apiConfig';

const STORAGE_KEY = "devinspect-history";

export const normalizeMode = (mode) => {
  const lower = String(mode || "developer").toLowerCase();
  if (lower.includes("student")) return "student";
  if (lower.includes("interview")) return "interviewer";
  if (lower.includes("interviewer")) return "interviewer";
  if (lower.includes("developer") || lower.includes("dev")) return "developer";
  return lower;
};

export const computeAiScore = (errors = []) => {
  const count = Array.isArray(errors) ? errors.length : 0;
  // Score calculation: start at 100, subtract based on severity
  let score = 100;
  errors.forEach(e => {
    const sev = String(e.severity || '').toLowerCase();
    if (sev.includes('critical')) score -= 25;
    else if (sev.includes('high')) score -= 15;
    else if (sev.includes('medium')) score -= 8;
    else score -= 3;
  });
  return Math.max(0, Math.min(100, score));
};

// Map backend Analysis document format to frontend review structure
export const mapServerReview = (srv) => {
  if (!srv) return null;
  const errors = Array.isArray(srv.result?.errors) ? srv.result.errors : [];
  return {
    id:           srv._id,
    timestamp:    srv.createdAt || new Date().toISOString(),
    language:     srv.language  || 'javascript',
    mode:         normalizeMode(srv.mode),
    input:        srv.inputText || '',
    correctedCode: srv.result?.correctedCode || '',
    explanation:  srv.result?.explanation   || '',
    modeOutput:   srv.result?.modeOutput    || '',
    errors,
    issues:       errors,
    suggestions:  Array.isArray(srv.result?.suggestions) ? srv.result.suggestions : [],
    questions:    Array.isArray(srv.result?.questions)   ? srv.result.questions   : [],
    mistakes:     Array.isArray(srv.result?.mistakes)    ? srv.result.mistakes    : [],
    steps:        Array.isArray(srv.result?.steps)       ? srv.result.steps       : [],
    tips:         Array.isArray(srv.result?.tips)        ? srv.result.tips        : [],
    aiScore:      computeAiScore(errors),
    isBookmarked: Boolean(srv.isBookmarked),
    degraded:     Boolean(srv.result?.degraded),
  };
};

export const getReviews = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error reading local reviews:', error);
    return [];
  }
};

export const getReviewsFromServer = async () => {
  try {
    const token = localStorage.getItem("devinspect-token");
    if (!token) return getReviews();

    const response = await fetch(`${API_ORIGIN}/api/analysis`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      }
    });

    if (response.ok) {
      const data = await response.json();
      const mapped = data.map(mapServerReview);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mapped));
      return mapped;
    }
    
    // If server request fails, fall back to local storage
    console.warn('Failed to fetch from server, using local storage');
  } catch (err) {
    console.error("Failed to fetch reviews from server:", err.message);
  }
  return getReviews();
};

export const saveReview = (review) => {
  try {
    const existing = getReviews();
    const errors = review.errors || [];
    const mode = normalizeMode(review.mode);

    const newReview = {
      id: review.id || Date.now(),
      timestamp: review.timestamp || new Date().toISOString(),
      language: review.language || "javascript",
      mode,
      input: review.input || "",
      prompt: review.prompt || "",
      correctedCode: review.correctedCode || "",
      explanation: review.explanation || "",
      modeOutput: review.modeOutput || "",
      errors,
      issues: errors,
      suggestions: review.suggestions || [],
      questions: review.questions || [],
      aiScore: computeAiScore(errors),
      isBookmarked: Boolean(review.isBookmarked),
      degraded: Boolean(review.degraded),
    };

    existing.unshift(newReview);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    return newReview;
  } catch (error) {
    console.error('Error saving review locally:', error);
    return null;
  }
};

export const saveReviewToServer = async (payload) => {
  try {
    const token = localStorage.getItem("devinspect-token");
    if (!token) return saveReview(payload);

    const response = await fetch(`${API_ORIGIN}/api/analysis`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        text: payload.input,
        mode: payload.mode,
        language: payload.language,
        workspaceId: payload.workspaceId,
      }),
    });

    if (response.ok) {
      const srvData = await response.json();
      const mapped = mapServerReview(srvData);
      saveReview(mapped);
      return mapped;
    }
  } catch (err) {
    console.error("Failed to save review to server:", err.message);
  }
  return saveReview(payload);
};

export const toggleBookmarkOnServer = async (id) => {
  try {
    const token = localStorage.getItem("devinspect-token");
    if (token) {
      const response = await fetch(`${API_ORIGIN}/api/analysis/${id}/bookmark`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const srvData = await response.json();
        // Sync local storage
        const existing = getReviews();
        const updated = existing.map(item => 
          item.id === id ? { ...item, isBookmarked: srvData.isBookmarked } : item
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return { ...srvData, id };
      }
    }
  } catch (e) {
    console.error("Failed to toggle bookmark on server:", e.message);
  }
  return null;
};

export const deleteReview = (id) => {
  try {
    const existing = getReviews();
    const filtered = existing.filter((item) => String(item.id) !== String(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting review locally:', error);
    return false;
  }
};

export const deleteReviewFromServer = async (id) => {
  try {
    const token = localStorage.getItem("devinspect-token");
    if (token) {
      await fetch(`${API_ORIGIN}/api/analysis/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
    }
  } catch (err) {
    console.error("Failed to delete review on server:", err.message);
  }
  return deleteReview(id);
};

export const clearAllReviews = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing local reviews:', error);
    return false;
  }
};

export const clearAllReviewsFromServer = async () => {
  try {
    const token = localStorage.getItem("devinspect-token");
    if (token) {
      const response = await fetch(`${API_ORIGIN}/api/analysis`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log(`Cleared ${data.deletedCount} reviews from server`);
      }
    }
  } catch (err) {
    console.error("Failed to clear reviews on server:", err.message);
  }
  return clearAllReviews();
};

export const getAnalytics = () => {
  const reviews = getReviews();
  const modeCounts = { student: 0, interviewer: 0, developer: 0 };

  reviews.forEach((review) => {
    const mode = normalizeMode(review.mode);
    if (modeCounts[mode] !== undefined) {
      modeCounts[mode] += 1;
    }
  });

  const totalIssues = reviews.reduce(
    (sum, review) => sum + (review.errors?.length || 0),
    0
  );

  const avgScore = reviews.length
    ? Math.round(
        reviews.reduce((sum, review) => sum + (review.aiScore || 0), 0) /
          reviews.length
      )
    : 0;

  const languageCounts = reviews.reduce((acc, review) => {
    const lang = (review.language || "unknown").toLowerCase();
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {});

  const topLanguage =
    Object.entries(languageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
    "—";

  return {
    totalAnalyses: reviews.length,
    modeCounts,
    recentActivity: reviews.slice(0, 6),
    totalIssues,
    avgScore,
    topLanguage,
  };
};