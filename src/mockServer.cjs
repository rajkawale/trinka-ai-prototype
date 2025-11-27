/**
 * Simple mock AI API for trinka ai editor
 *
 * Endpoints (mocked):
 *  GET  /api/v1/health                 -> { ok: true }
 *  POST /api/v1/ai/respond             -> { reply: "..." }
 *  POST /rewrite                       -> { rewritten_text: "..." }
 *  POST /chat                          -> streaming-like text (single chunk)
 *  GET  /api/recommendations           -> { items: [...] }
 *  POST /api/recommendations/apply     -> { undoToken: "..." }
 *  POST /api/recommendations/undo      -> 200
 *  POST /api/recommendations/dismiss   -> 200
 *  GET  /api/user-settings             -> { settings: {...} }
 *  PATCH /api/user-settings            -> 204
 *  GET  /versions                      -> { snapshots: [...] }
 *  POST /versions                      -> { snapshot }
 *  GET  /versions/:id/restore          -> { delta: "..." }
 */

// CommonJS module so it runs cleanly even though the main app uses `"type": "module"`.
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// In-memory mock state (resets on server restart)
const recommendations = [
  {
    id: 'rec-clarity-1',
    title: 'This paragraph is overly complex.',
    summary: 'Break long sentences into two to improve readability for reviewers.',
    fullText:
      'This paragraph contains multiple nested clauses that make it hard to follow. Consider breaking it into two or three shorter sentences to guide the reader.',
    actionType: 'tighten',
    estimatedImpact: 'high',
  },
  {
    id: 'rec-tone-1',
    title: 'Try reducing passive voice.',
    summary: 'Passive constructions can obscure responsibility; use active voice where possible.',
    fullText:
      'Your paragraph uses several passive-voice constructions. Rewriting key sentences in active voice will make your contribution clearer.',
    actionType: 'rewrite',
    estimatedImpact: 'medium',
  },
  {
    id: 'rec-engagement-1',
    title: 'Sentence length exceeds recommended readability.',
    summary: 'Shorten long sentences or add signposting phrases to keep readers engaged.',
    fullText:
      'Very long sentences increase cognitive load. Splitting them into two with a clear connector phrase can keep readers oriented.',
    actionType: 'summarize',
    estimatedImpact: 'medium',
  },
];

const userSettings = {};
const versions = [];

app.get('/api/v1/health', (req, res) =>
  res.json({ ok: true, service: 'trinka ai mock', now: new Date().toISOString() }),
);

// Helper to detect broad user type from the message
function inferPersona(text) {
  if (!text) return 'writer';
  if (/thesis|dissertation|journal|manuscript|citation|peer review/i.test(text)) return 'researcher';
  if (/assignment|exam|class|professor|grade|university|college|coursework/i.test(text)) return 'student';
  return 'writer';
}

// Example conversation responder - gently tailored for writers, researchers, and students
app.post('/api/v1/ai/respond', (req, res) => {
  const { message, session } = req.body || {};
  const rawText = (message || '').toString();
  const text = rawText.toLowerCase();
  const persona = inferPersona(rawText);

  if (!text.trim()) {
    return res.json({
      reply:
        "Hi, I'm the trinka ai mock assistant. Paste a paragraph or a brief for your draft and I'll suggest how you could polish it.",
    });
  }

  if (text.includes('hello') || text.includes('hi')) {
    return res.json({
      reply:
        "Hello from the trinka ai mock! Tell me what you’re writing (research article, assignment, blog, etc.) and I’ll suggest how to tighten it.",
    });
  }

  if (text.includes('demo') || text.includes('prototype')) {
    return res.json({
      reply:
        "This is a demo of trinka ai. Send me a short user story or a messy paragraph and I’ll rewrite it in a reviewer‑friendly way for Piyush.",
    });
  }

  if (text.includes('help') || text.includes('improve') || text.includes('feedback')) {
    const personaHint =
      persona === 'researcher'
        ? ' I can help you sound more academic, trim repetition, and make your contribution clearer for reviewers.'
        : persona === 'student'
          ? ' I can help you clarify your argument, avoid informal tone, and make sure your answer stays focused on the question.'
          : ' I can help you sharpen your voice, cut fluff, and keep the narrative easy to scan.';

    return res.json({
      reply:
        "Here’s how I can help: (1) suggest clearer phrasing, (2) simplify long sentences, and (3) highlight where readers may get lost." +
        personaHint +
        " Send 3–5 sentences you’re unsure about and I’ll respond with a cleaner version.",
    });
  }

  if (persona === 'researcher') {
    return res.json({
      reply:
        `You sound like you're drafting research. In a real trinka ai session I would:\n` +
        `1) Flag hedging and vague claims,\n` +
        `2) Suggest a clearer topic sentence for your paragraph,\n` +
        `3) Align tense and voice with typical journal style.\n\n` +
        `For now, imagine I’ve highlighted your key finding and moved it to the first sentence, then simplified the rest for reviewers.`,
    });
  }

  if (persona === 'student') {
    return res.json({
      reply:
        `You’re writing like a student working on an assignment. A real trinka ai pass would:\n` +
        `- underline where your answer drifts away from the question,\n` +
        `- replace casual phrases with clearer, formal ones,\n` +
        `- suggest a short concluding line that shows your main point.\n\n` +
        `Try sending me the question and your current answer in 3–4 sentences.`,
    });
  }

  // Generic writer fallback: echo + a small coaching nudge
  return res.json({
    reply:
      `Here’s a mock echo of what you wrote:\n\n` +
      `“${rawText}”\n\n` +
      `In a full trinka ai experience I’d now: (a) remove filler, (b) suggest a stronger opening line, and (c) offer 2–3 alternative phrasings for key sentences.`,
  });
});

// Simple rewrite endpoint used by the editor rewrite panel
app.post('/rewrite', (req, res) => {
  const { text = '', tone = 'neutral', mode = 'rewrite' } = req.body || {};
  const trimmed = text.toString().trim();
  if (!trimmed) {
    return res.json({ rewritten_text: '' });
  }

  let prefix = '';
  if (mode === 'summarize') prefix = 'In summary, ';
  if (mode === 'expand') prefix = 'In more detail, ';

  const softened =
    tone === 'academic'
      ? trimmed.replace(/\bAI\b/g, 'AI systems').replace(/\bcan\b/g, 'can often')
      : trimmed;

  const rewritten = `${prefix}${softened}`.replace(/\s+/g, ' ').trim();
  res.json({ rewritten_text: rewritten });
});

// Chat endpoint used by Copilot sidebar
app.post('/chat', (req, res) => {
  const { message = '', intent = 'rewrite', tone = 'academic' } = req.body || {};
  const persona = inferPersona(message);

  let reply =
    "I'm a mock Trinka AI assistant. Paste a short passage and tell me whether you want to rewrite, expand, or summarize it.";

  if (intent === 'rewrite') {
    reply =
      'Here is how I would rewrite that passage with clearer structure and more formal tone. In a full version, I would show you 2–3 options side by side.';
  } else if (intent === 'summarize') {
    reply =
      'Below is a concise summary suitable for an abstract or assignment answer. In production this would be grounded in your latest text selection.';
  } else if (intent === 'expand') {
    reply =
      'I would expand this by adding one sentence that explains the implication and another that connects back to your research question.';
  }

  if (persona === 'researcher') {
    reply += ' Since you sound like a researcher, I prioritised precision and hedging over informality.';
  } else if (persona === 'student') {
    reply += ' Since you sound like a student, I kept the language straightforward and exam-friendly.';
  }

  res.setHeader('Content-Type', 'text/plain');
  res.send(reply);
});

// Recommendations API used by Copilot and popovers
app.get('/api/recommendations', (req, res) => {
  const limit = Number(req.query.limit || recommendations.length);
  res.json({ items: recommendations.slice(0, limit) });
});

app.post('/api/recommendations/apply', (req, res) => {
  const { recommendationId } = req.body || {};
  // In-memory no-op; just return an undo token
  res.json({ ok: true, recommendationId, undoToken: `undo-${recommendationId || 'mock'}` });
});

app.post('/api/recommendations/undo', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/recommendations/dismiss', (req, res) => {
  res.json({ ok: true });
});

// User settings for recommendations visibility
app.get('/api/user-settings', (req, res) => {
  const { userId = 'default', docId = 'default' } = req.query || {};
  const key = `${userId}:${docId}`;
  res.json({ settings: userSettings[key] || { recommendationsVisible: true } });
});

app.patch('/api/user-settings', (req, res) => {
  const { userId = 'default', docId = 'default', settings = {} } = req.body || {};
  const key = `${userId}:${docId}`;
  userSettings[key] = { ...(userSettings[key] || {}), ...settings };
  res.status(204).end();
});

// Simple versions API for history sidebar
app.get('/versions', (req, res) => {
  const limit = Number(req.query.limit || 5);
  res.json({ snapshots: versions.slice(0, limit) });
});

app.post('/versions', (req, res) => {
  const { summary = '', word_count = 0, action = '', delta = '' } = req.body || {};
  const snapshot = {
    id: `v-${Date.now()}`,
    summary,
    word_count,
    action,
    delta,
    timestamp: new Date().toISOString(),
  };
  versions.unshift(snapshot);
  res.json(snapshot);
});

app.get('/versions/:id/restore', (req, res) => {
  const snapshot = versions.find((v) => v.id === req.params.id);
  res.json({ delta: snapshot?.delta || null });
});

const PORT = process.env.MOCK_API_PORT || 5005;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`trinka ai mock API running on port ${PORT}`);
});



