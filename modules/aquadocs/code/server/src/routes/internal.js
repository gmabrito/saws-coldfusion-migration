const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const azureSearch = require('../services/azureSearchService');
const azureOpenAI = require('../services/azureOpenAIService');
const azureSpeech = require('../services/azureSpeechService');
const eventBus = require('../events/eventBus');
const EVENT_TYPES = require('../events/eventTypes');

// All internal routes require authentication
router.use(authenticate);

/**
 * POST /api/internal/search
 * Hybrid vector+keyword search with optional filters.
 */
router.post(
  '/search',
  [
    body('query').notEmpty().withMessage('query is required').trim(),
    body('top').optional().isInt({ min: 1, max: 50 }).toInt(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { query, filters = {}, top = 20 } = req.body;

    try {
      const results = await azureSearch.hybridSearch(query, filters, top);

      eventBus.publish(EVENT_TYPES.DOCUMENT_SEARCH, {
        query,
        filters,
        resultCount: results.count,
      }, req.user?.preferred_username).catch(() => {});

      res.json(results);
    } catch (err) {
      console.error('[internal/search]', err.message);
      res.status(500).json({ error: 'Search failed' });
    }
  }
);

/**
 * POST /api/internal/chat
 * RAG: embed query → search top chunks → GPT-4o with context → return answer + sources.
 */
router.post(
  '/chat',
  [
    body('messages').isArray({ min: 1 }).withMessage('messages array is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { messages } = req.body;
    const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user');
    if (!lastUserMessage) return res.status(400).json({ error: 'No user message found' });

    try {
      // 1. Search for relevant chunks using the last user message
      const searchResults = await azureSearch.hybridSearch(lastUserMessage.content, {}, 5);

      // 2. Build context string from retrieved chunks
      const context = searchResults.results
        .map((r, i) => `[${i + 1}] ${r.title}\n${r.content || r.excerpt || ''}`)
        .join('\n\n---\n\n');

      const sources = searchResults.results.map((r) => ({
        title: r.title,
        sourceFile: r.source_file,
        pageNumber: r.page_number,
      }));

      // 3. Generate answer with GPT-4o
      const { answer } = await azureOpenAI.chat(messages, context || 'No relevant documents found.');

      eventBus.publish(EVENT_TYPES.CHAT_QUERY, {
        query: lastUserMessage.content,
        chunkCount: searchResults.results.length,
      }, req.user?.preferred_username).catch(() => {});

      res.json({ answer, sources });
    } catch (err) {
      console.error('[internal/chat]', err.message);
      res.status(500).json({ error: 'Chat request failed' });
    }
  }
);

/**
 * GET /api/internal/speech/token
 * Returns a short-lived Azure Speech token for the client-side Speech SDK.
 */
router.get('/speech/token', async (req, res) => {
  try {
    const token = await azureSpeech.getSpeechToken();
    res.json(token);
  } catch (err) {
    console.error('[internal/speech/token]', err.message);
    res.status(500).json({ error: 'Failed to get speech token' });
  }
});

module.exports = router;
