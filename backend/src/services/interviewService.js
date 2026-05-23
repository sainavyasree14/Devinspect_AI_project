import groqService from './groqService.js';

/* ─── JSON extractor ─────────────────────────────── */
const extractJSON = (text) => {
  if (!text) return null;
  try {
    let clean = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    const start = clean.indexOf('{');
    const end   = clean.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    return JSON.parse(clean.slice(start, end + 1));
  } catch {
    return null;
  }
};

/* ─── Company question bank (fallback when AI unavailable) ── */
const QUESTION_BANK = {
  easy: [
    {
      id: 'e1', company: 'TCS', category: 'Arrays',
      title: 'Find Maximum Element',
      description: 'Given an array of integers, find and return the maximum element. Do not use built-in max functions.',
      example: 'Input: [3, 1, 4, 1, 5, 9, 2, 6]\nOutput: 9',
      constraints: '1 ≤ arr.length ≤ 10^5\n-10^9 ≤ arr[i] ≤ 10^9',
      expectedComplexity: 'Time: O(n), Space: O(1)',
      hints: ['Iterate through the array keeping track of the largest value seen so far.'],
      testCases: [
        { input: '[1]', output: '1' },
        { input: '[-5, -3, -1]', output: '-1' },
        { input: '[100, 200, 150]', output: '200' },
      ],
    },
    {
      id: 'e2', company: 'Infosys', category: 'Strings',
      title: 'Reverse a String',
      description: 'Write a function to reverse a given string without using built-in reverse methods.',
      example: 'Input: "hello"\nOutput: "olleh"',
      constraints: '1 ≤ s.length ≤ 10^5\nString contains only printable ASCII characters',
      expectedComplexity: 'Time: O(n), Space: O(n)',
      hints: ['Use two pointers from both ends and swap characters.'],
      testCases: [
        { input: '"a"', output: '"a"' },
        { input: '"ab"', output: '"ba"' },
        { input: '"racecar"', output: '"racecar"' },
      ],
    },
    {
      id: 'e3', company: 'Wipro', category: 'Arrays',
      title: 'Two Sum',
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Each input has exactly one solution.',
      example: 'Input: nums = [2,7,11,15], target = 9\nOutput: [0,1]',
      constraints: '2 ≤ nums.length ≤ 10^4\n-10^9 ≤ nums[i] ≤ 10^9\nExactly one valid answer exists',
      expectedComplexity: 'Time: O(n), Space: O(n)',
      hints: ['Use a hash map to store complement values.'],
      testCases: [
        { input: 'nums=[3,2,4], target=6', output: '[1,2]' },
        { input: 'nums=[3,3], target=6', output: '[0,1]' },
      ],
    },
    {
      id: 'e4', company: 'Accenture', category: 'Strings',
      title: 'Check Palindrome',
      description: 'Given a string, determine if it is a palindrome (reads the same forwards and backwards). Ignore case and non-alphanumeric characters.',
      example: 'Input: "A man, a plan, a canal: Panama"\nOutput: true',
      constraints: '1 ≤ s.length ≤ 2 × 10^5',
      expectedComplexity: 'Time: O(n), Space: O(1)',
      hints: ['Use two pointers. Skip non-alphanumeric characters.'],
      testCases: [
        { input: '"race a car"', output: 'false' },
        { input: '" "', output: 'true' },
      ],
    },
  ],
  medium: [
    {
      id: 'm1', company: 'Amazon', category: 'Dynamic Programming',
      title: 'Longest Common Subsequence',
      description: 'Given two strings text1 and text2, return the length of their longest common subsequence. A subsequence is a sequence derived from another sequence by deleting some elements without changing the order.',
      example: 'Input: text1 = "abcde", text2 = "ace"\nOutput: 3 (The LCS is "ace")',
      constraints: '1 ≤ text1.length, text2.length ≤ 1000\nStrings consist of lowercase English characters',
      expectedComplexity: 'Time: O(m×n), Space: O(m×n)',
      hints: ['Use a 2D DP table. If characters match, dp[i][j] = dp[i-1][j-1] + 1.'],
      testCases: [
        { input: 'text1="abc", text2="abc"', output: '3' },
        { input: 'text1="abc", text2="def"', output: '0' },
      ],
    },
    {
      id: 'm2', company: 'Microsoft', category: 'Linked Lists',
      title: 'Reverse a Linked List',
      description: 'Given the head of a singly linked list, reverse the list and return the reversed list.',
      example: 'Input: 1 → 2 → 3 → 4 → 5\nOutput: 5 → 4 → 3 → 2 → 1',
      constraints: '0 ≤ number of nodes ≤ 5000\n-5000 ≤ Node.val ≤ 5000',
      expectedComplexity: 'Time: O(n), Space: O(1)',
      hints: ['Use three pointers: prev, curr, next. Iteratively reverse the links.'],
      testCases: [
        { input: '[1,2]', output: '[2,1]' },
        { input: '[]', output: '[]' },
      ],
    },
    {
      id: 'm3', company: 'Google', category: 'Arrays',
      title: 'Maximum Subarray (Kadane\'s Algorithm)',
      description: 'Given an integer array nums, find the contiguous subarray which has the largest sum and return its sum.',
      example: 'Input: [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6 (subarray [4,-1,2,1])',
      constraints: '1 ≤ nums.length ≤ 10^5\n-10^4 ≤ nums[i] ≤ 10^4',
      expectedComplexity: 'Time: O(n), Space: O(1)',
      hints: ['Track current sum and max sum. Reset current sum to 0 if it goes negative.'],
      testCases: [
        { input: '[1]', output: '1' },
        { input: '[5,4,-1,7,8]', output: '23' },
      ],
    },
    {
      id: 'm4', company: 'Flipkart', category: 'Trees',
      title: 'Binary Tree Level Order Traversal',
      description: 'Given the root of a binary tree, return the level order traversal of its nodes\' values (i.e., from left to right, level by level).',
      example: 'Input: root = [3,9,20,null,null,15,7]\nOutput: [[3],[9,20],[15,7]]',
      constraints: '0 ≤ number of nodes ≤ 2000\n-1000 ≤ Node.val ≤ 1000',
      expectedComplexity: 'Time: O(n), Space: O(n)',
      hints: ['Use a queue (BFS). Process nodes level by level.'],
      testCases: [
        { input: 'root=[1]', output: '[[1]]' },
        { input: 'root=[]', output: '[]' },
      ],
    },
    {
      id: 'm5', company: 'Zomato', category: 'JavaScript',
      title: 'Implement Promise.all',
      description: 'Implement a custom version of Promise.all that takes an array of promises and returns a single promise that resolves when all promises resolve, or rejects if any promise rejects.',
      example: 'Input: [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)]\nOutput: [1, 2, 3]',
      constraints: 'Handle empty arrays\nPreserve order of results\nReject immediately on first rejection',
      expectedComplexity: 'Time: O(n), Space: O(n)',
      hints: ['Use a counter to track resolved promises. Reject immediately on any failure.'],
      testCases: [
        { input: '[]', output: '[]' },
        { input: '[Promise.reject("error")]', output: 'Rejects with "error"' },
      ],
    },
  ],
  hard: [
    {
      id: 'h1', company: 'Google', category: 'Dynamic Programming',
      title: 'Edit Distance',
      description: 'Given two strings word1 and word2, return the minimum number of operations (insert, delete, replace) required to convert word1 to word2.',
      example: 'Input: word1 = "horse", word2 = "ros"\nOutput: 3',
      constraints: '0 ≤ word1.length, word2.length ≤ 500\nStrings consist of lowercase English letters',
      expectedComplexity: 'Time: O(m×n), Space: O(m×n)',
      hints: ['Use 2D DP. dp[i][j] = min operations to convert word1[0..i] to word2[0..j].'],
      testCases: [
        { input: 'word1="", word2="abc"', output: '3' },
        { input: 'word1="abc", word2="abc"', output: '0' },
      ],
    },
    {
      id: 'h2', company: 'Amazon', category: 'System Design',
      title: 'Design a Rate Limiter',
      description: 'Design and implement a rate limiter that allows at most N requests per second per user. Implement the Token Bucket or Sliding Window algorithm.',
      example: 'RateLimiter(5) // 5 requests per second\nlimiter.isAllowed("user1") // true (1st request)\n// ... after 5 requests in 1 second\nlimiter.isAllowed("user1") // false (rate limited)',
      constraints: 'Thread-safe implementation\nO(1) time per request check\nHandle multiple users independently',
      expectedComplexity: 'Time: O(1) per request, Space: O(users)',
      hints: ['Token Bucket: refill tokens at a fixed rate. Sliding Window: track timestamps in a queue.'],
      testCases: [
        { input: 'limit=2, requests=["u1","u1","u1"] within 1s', output: '[true, true, false]' },
      ],
    },
    {
      id: 'h3', company: 'Microsoft', category: 'Trees',
      title: 'Serialize and Deserialize Binary Tree',
      description: 'Design an algorithm to serialize and deserialize a binary tree. Serialization converts the tree to a string; deserialization reconstructs the tree from the string.',
      example: 'Input: root = [1,2,3,null,null,4,5]\nSerialize: "1,2,3,null,null,4,5"\nDeserialize: reconstructs original tree',
      constraints: 'The number of nodes is in range [0, 10^4]\n-1000 ≤ Node.val ≤ 1000',
      expectedComplexity: 'Time: O(n), Space: O(n)',
      hints: ['Use BFS or preorder DFS. Use a delimiter and null markers for missing nodes.'],
      testCases: [
        { input: 'root=[]', output: 'null' },
        { input: 'root=[1]', output: '"1"' },
      ],
    },
    {
      id: 'h4', company: 'Netflix', category: 'System Design',
      title: 'Design a URL Shortener',
      description: 'Design a URL shortening service like bit.ly. The system should generate a unique short URL for any given long URL and redirect users to the original URL.',
      example: 'shorten("https://www.example.com/very/long/url") → "https://short.ly/abc123"\nexpand("https://short.ly/abc123") → "https://www.example.com/very/long/url"',
      constraints: '100M URLs per day\nShort URL length: 6-8 characters\nRedirect latency < 10ms',
      expectedComplexity: 'Read: O(1), Write: O(1) with hashing',
      hints: ['Use Base62 encoding. Store mappings in a hash map or database with an index on short URL.'],
      testCases: [
        { input: 'Same long URL twice', output: 'Same short URL (idempotent)' },
        { input: 'Non-existent short URL', output: '404 error' },
      ],
    },
  ],
};

/* ─── Generate question using AI ─────────────────── */
export const generateInterviewQuestion = async (difficulty, company, category) => {
  if (!process.env.GROQ_API_KEY) {
    // Return from static bank
    const pool = QUESTION_BANK[difficulty] || QUESTION_BANK.medium;
    const filtered = company
      ? pool.filter(q => q.company.toLowerCase() === company.toLowerCase() || q.category.toLowerCase() === (category || '').toLowerCase())
      : pool;
    const source = filtered.length > 0 ? filtered : pool;
    return source[Math.floor(Math.random() * source.length)];
  }

  const prompt = `You are a technical interviewer at ${company || 'a top tech company'}.

Generate ONE realistic coding interview question for a ${difficulty} level candidate.
${category ? `Category: ${category}` : ''}
${company ? `Company style: ${company}` : ''}

Return ONLY this exact JSON (no markdown, no extra text):
{
  "id": "ai_${Date.now()}",
  "company": "${company || 'Tech Company'}",
  "category": "${category || 'DSA'}",
  "title": "<concise problem title>",
  "description": "<clear problem statement, 3-5 sentences>",
  "example": "Input: <example input>\\nOutput: <example output>\\nExplanation: <brief explanation>",
  "constraints": "<list constraints, one per line>",
  "expectedComplexity": "Time: O(?), Space: O(?)",
  "hints": ["<hint 1>", "<hint 2>"],
  "testCases": [
    { "input": "<test input 1>", "output": "<expected output 1>" },
    { "input": "<test input 2>", "output": "<expected output 2>" },
    { "input": "<edge case>", "output": "<edge case output>" }
  ]
}`;

  try {
    const raw = await groqService(prompt);
    const parsed = extractJSON(raw);
    if (parsed && parsed.title && parsed.description) return parsed;
  } catch (err) {
    console.error('[InterviewService] Question generation failed:', err.message);
  }

  // Fallback to static bank
  const pool = QUESTION_BANK[difficulty] || QUESTION_BANK.medium;
  return pool[Math.floor(Math.random() * pool.length)];
};

/* ─── Evaluate interview solution ────────────────── */
export const evaluateInterviewSolution = async (question, userCode, difficulty, timeSpent) => {
  // Hard rule: empty or near-empty code = 0
  const trimmed = (userCode || '').trim();
  const codeWithoutComments = trimmed
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();

  if (!codeWithoutComments || codeWithoutComments.length < 20) {
    return {
      score: 0,
      passed: false,
      breakdown: {
        correctness: 0,
        codeQuality: 0,
        edgeCases: 0,
        optimization: 0,
        syntaxValidity: 0,
      },
      strengths: [],
      weaknesses: ['No solution provided', 'Empty or comment-only submission'],
      improvements: [
        'Write at least a brute-force solution before optimizing',
        'Start with the simplest approach that solves the problem',
        'Think through the algorithm before coding',
      ],
      feedback: 'No solution was submitted. Please write your code and try again.',
      timeComplexity: 'N/A',
      spaceComplexity: 'N/A',
      expectedSolution: question.expectedComplexity || 'See hints for guidance',
    };
  }

  if (!process.env.GROQ_API_KEY) {
    return generateOfflineEvaluation(userCode, difficulty);
  }

  const prompt = `You are a senior technical interviewer at ${question.company || 'a top tech company'} conducting a ${difficulty}-level coding interview.

PROBLEM: ${question.title}
CATEGORY: ${question.category || 'DSA'}
DESCRIPTION: ${question.description}
EXPECTED COMPLEXITY: ${question.expectedComplexity || 'Optimal'}
DIFFICULTY: ${difficulty}
TIME SPENT: ${timeSpent ? Math.floor(timeSpent / 60) + ' min ' + (timeSpent % 60) + ' sec' : 'Unknown'}

CANDIDATE CODE:
\`\`\`
${userCode}
\`\`\`

Evaluate STRICTLY. Rules:
- If code does not solve the problem, correctness = 0-5 max
- If syntax errors exist, syntaxValidity = 0-5 max
- If no edge cases handled, edgeCases = 0-5 max
- If brute force only (when optimal exists), optimization = 0-10 max
- Score = sum of all 5 criteria (max 100)
- passed = score >= 60
- Give 2-3 specific strengths (what candidate did well)
- Give 2-3 specific weaknesses (exact bugs or missing logic)
- Give 3 actionable improvements with code-level suggestions
- feedback must sound like a real interviewer speaking to the candidate
- timeComplexity/spaceComplexity = complexity of the SUBMITTED code (not expected)
- expectedSolution = describe the optimal algorithm in 1-2 sentences

Return ONLY valid JSON, no markdown:
{
  "score": <0-100>,
  "passed": <true|false>,
  "breakdown": {
    "correctness": <0-20>,
    "codeQuality": <0-20>,
    "edgeCases": <0-20>,
    "optimization": <0-20>,
    "syntaxValidity": <0-20>
  },
  "strengths": ["<specific strength>", "<specific strength>"],
  "weaknesses": ["<specific weakness with line/logic reference>", "<specific weakness>"],
  "improvements": ["<actionable fix 1>", "<actionable fix 2>", "<actionable fix 3>"],
  "feedback": "<2-3 sentences as a real interviewer>",
  "timeComplexity": "<O(?) of submitted code>",
  "spaceComplexity": "<O(?) of submitted code>",
  "expectedSolution": "<optimal algorithm description>"
}`;

  try {
    const raw = await groqService(prompt);
    const parsed = extractJSON(raw);

    if (parsed && typeof parsed.score === 'number') {
      // Enforce: if code is trivially short, cap score
      if (codeWithoutComments.length < 50) {
        parsed.score = Math.min(parsed.score, 30);
      }
      // Clamp score
      parsed.score = Math.max(0, Math.min(100, Math.round(parsed.score)));
      parsed.passed = parsed.score >= 60;
      return parsed;
    }
  } catch (err) {
    console.error('[InterviewService] Evaluation failed:', err.message);
  }

  return generateOfflineEvaluation(userCode, difficulty);
};

/* ─── Offline evaluation (no AI key) ─────────────── */
const generateOfflineEvaluation = (code, difficulty) => {
  const lines = code.split('\n').filter(l => l.trim()).length;
  const hasFunction = /function|=>|def |public |void /.test(code);
  const hasReturn = /return /.test(code);
  const hasLoop = /for|while|forEach|map|reduce/.test(code);

  let score = 0;
  const strengths = [];
  const weaknesses = [];

  if (hasFunction) { score += 15; strengths.push('Code is structured in a function'); }
  else weaknesses.push('No function definition found');

  if (hasReturn) { score += 15; strengths.push('Function has a return statement'); }
  else weaknesses.push('Missing return statement');

  if (hasLoop) { score += 10; strengths.push('Uses iteration/loops'); }

  if (lines > 5) { score += 10; strengths.push('Solution has meaningful length'); }
  else weaknesses.push('Solution appears incomplete');

  // Difficulty penalty
  if (difficulty === 'hard') score = Math.floor(score * 0.7);
  else if (difficulty === 'medium') score = Math.floor(score * 0.85);

  score = Math.max(0, Math.min(100, score));

  return {
    score,
    passed: score >= 60,
    breakdown: {
      correctness: Math.floor(score * 0.4),
      codeQuality: Math.floor(score * 0.2),
      edgeCases: Math.floor(score * 0.15),
      optimization: Math.floor(score * 0.15),
      syntaxValidity: Math.floor(score * 0.1),
    },
    strengths,
    weaknesses: weaknesses.length > 0 ? weaknesses : ['Configure GROQ_API_KEY for detailed evaluation'],
    improvements: [
      'Add input validation for edge cases',
      'Consider time and space complexity',
      'Add comments explaining your approach',
    ],
    feedback: 'Basic evaluation completed. Configure GROQ_API_KEY for detailed AI-powered feedback.',
    timeComplexity: 'Unable to determine without AI',
    spaceComplexity: 'Unable to determine without AI',
    expectedSolution: 'Configure AI for expected solution details',
  };
};
