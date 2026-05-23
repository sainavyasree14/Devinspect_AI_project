export const normalizeAiResult = (parsed, code) => ({
  correctedCode: String(parsed?.correctedCode ?? code ?? ""),
  explanation: String(parsed?.explanation ?? ""),
  modeOutput: String(parsed?.modeOutput ?? ""),
  errors: Array.isArray(parsed?.errors)
    ? parsed.errors.map((e) => String(e))
    : [],
});

export const parseAiText = (text, code) => {
  if (!text || typeof text !== "string") {
    throw new Error("Empty AI response");
  }

  const trimmed = text.trim();

  try {
    return normalizeAiResult(JSON.parse(trimmed), code);
  } catch {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return normalizeAiResult(JSON.parse(jsonMatch[0]), code);
    }
  }

  return {
    correctedCode: code,
    explanation: trimmed,
    modeOutput: trimmed,
    errors: [],
  };
};