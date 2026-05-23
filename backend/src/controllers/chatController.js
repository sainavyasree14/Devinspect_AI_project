import groqService from '../services/groqService.js';

/* ─── Build a rich context-aware system prompt ───── */
const buildSystemPrompt = (context) => {
  if (!context) {
    return `You are DevInspectAI, an expert code review assistant.
Answer coding questions clearly and in depth.
Always explain WHY something is a problem, not just WHAT the problem is.
Format your response in clear paragraphs. Never give one-line answers.`;
  }

  const errorSummary = Array.isArray(context.errors) && context.errors.length > 0
    ? context.errors.map((e, i) =>
        `  ${i + 1}. [${e.severity || 'unknown'} - ${e.category || 'issue'}] Line ${e.line || 'N/A'}: ${e.message}${e.why ? ` — Why: ${e.why}` : ''}`
      ).join('\n')
    : '  No errors flagged.';

  const questionSummary = Array.isArray(context.questions) && context.questions.length > 0
    ? `Interview questions were generated (${context.questions.length} questions).`
    : '';

  return `You are DevInspectAI, an expert AI code review assistant.

The user just received an AI code analysis. Here is the full context of that analysis:

--- ANALYSIS CONTEXT ---
Mode: ${context.mode || 'developer'}
Language: ${context.language || 'unknown'}
AI Score: ${context.aiScore || 'N/A'}/100

Explanation provided to user:
${context.explanation || 'No explanation available.'}

Errors/Issues found:
${errorSummary}

Corrected Code:
\`\`\`
${context.correctedCode || 'No corrected code provided.'}
\`\`\`

Suggestions: ${Array.isArray(context.suggestions) ? context.suggestions.join('; ') : 'None'}
${questionSummary}
--- END CONTEXT ---

RULES FOR YOUR RESPONSE:
- Always relate your answer directly to the code and analysis above
- If the user asks about an error, explain it deeply: what it is, why it happens, how to fix it with an example
- If the user asks about security, explain the vulnerability type, attack vector, and mitigation
- If the user asks about performance, explain the bottleneck and give a concrete optimized alternative
- If the user asks to explain the code, walk through it step by step
- Never give generic answers — always reference the specific code or errors from the context
- Format responses in clear paragraphs with line breaks for readability
- Minimum 3-4 sentences per response`;
};

/* ─── Groq call ──────────────────────────────────── */
const callGroq = async (systemPrompt, userMessage) => {
  const combined = `${systemPrompt}\n\nUser question: ${userMessage}`;
  const reply = await groqService(combined);
  return reply || null;
};

/* ─── Intelligent offline fallback ──────────────── */
const offlineFallback = (message, context) => {
  const lower = (message || '').toLowerCase();

  if (lower.includes('security') || lower.includes('vulnerab') || lower.includes('injection')) {
    return `This is a security vulnerability. ${
      context?.errors?.find(e => e.category === 'security')?.why ||
      'Unsanitized inputs or hardcoded credentials can be exploited by attackers through injection attacks, credential theft, or unauthorized access. Always validate and sanitize all user inputs, use environment variables for secrets, and apply the principle of least privilege.'
    }`;
  }

  if (lower.includes('performance') || lower.includes('slow') || lower.includes('optim')) {
    return `Regarding performance: ${
      context?.errors?.find(e => e.category === 'performance')?.why ||
      'The flagged code may cause unnecessary computation, memory leaks, or blocking operations. Consider using efficient data structures, avoiding nested loops where possible, and leveraging async/await patterns correctly to prevent blocking the event loop.'
    }`;
  }

  if (lower.includes('why') || lower.includes('explain') || lower.includes('what')) {
    return context?.explanation
      ? `Based on the analysis: ${context.explanation}`
      : 'The analysis identified issues in your code that affect reliability, security, or performance. Each flagged item includes a specific reason and suggested fix. Review the Diff Viewer tab for the corrected version.';
  }

  if (lower.includes('fix') || lower.includes('how') || lower.includes('correct')) {
    return context?.correctedCode
      ? `The corrected version of your code is available in the Diff Viewer tab. The key changes address: ${
          context.errors?.map(e => e.message).join(', ') || 'the flagged issues'
        }. Apply the fix using the "Apply Fix" button above.`
      : 'Review the corrected code in the Diff Viewer tab and apply the suggested changes. Focus on the flagged lines first.';
  }

  return `Based on your code analysis (Score: ${context?.aiScore || 'N/A'}/100): ${
    context?.explanation || 'The AI has reviewed your code and provided suggestions in the tabs above.'
  } Feel free to ask about any specific error, security concern, or optimization opportunity.`;
};

/* ─── POST /api/chat/followup ────────────────────── */
export const chatFollowup = async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.json({ reply: offlineFallback(message, context) });
    }

    const systemPrompt = buildSystemPrompt(context);
    const reply = await callGroq(systemPrompt, message);

    if (!reply) {
      return res.json({ reply: offlineFallback(message, context) });
    }

    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error.message);
    res.json({ reply: offlineFallback(req.body?.message, req.body?.context) });
  }
};