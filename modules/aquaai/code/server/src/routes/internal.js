const router = require('express').Router();
const { body, validationResult } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const { getDb, sql } = require('../config/database');
const eventBus = require('../events/eventBus');
const EVENT_TYPES = require('../events/eventTypes');

// All internal routes require authentication
router.use(authenticate);

const isOpenAIConfigured = () => !!process.env.AZURE_OPENAI_ENDPOINT;

const STUB_RESPONSE = {
  stub: true,
  message: 'AquaAI Azure OpenAI not configured in PoC',
};

// Registered models (static registry for PoC)
const MODELS = [
  {
    id: 'gpt-4o',
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o',
    type: 'chat',
    description: 'GPT-4o — primary chat and reasoning model',
    maxTokens: 128000,
    status: isOpenAIConfigured() ? 'available' : 'not-configured',
    latencyP50Ms: null,
  },
  {
    id: 'text-embedding-3-large',
    deployment: 'text-embedding-3-large',
    type: 'embedding',
    description: 'text-embedding-3-large — 3072-dimension semantic embeddings',
    dimensions: 3072,
    status: isOpenAIConfigured() ? 'available' : 'not-configured',
    latencyP50Ms: null,
  },
];

/**
 * POST /api/internal/completions
 * Proxies to Azure OpenAI chat completions.
 * Stub mode: returns mock response when AZURE_OPENAI_ENDPOINT not set.
 */
router.post(
  '/completions',
  [
    body('messages').isArray({ min: 1 }).withMessage('messages array is required'),
    body('model').optional().isString(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { messages, model = 'gpt-4o', callingModule = 'unknown', max_tokens = 1000 } = req.body;

    if (!isOpenAIConfigured()) {
      eventBus.publish(EVENT_TYPES.COMPLETION_REQUESTED, { model, callingModule, stub: true }, req.user?.preferred_username).catch(() => {});
      return res.json({
        ...STUB_RESPONSE,
        model,
        callingModule,
        choices: [{ message: { role: 'assistant', content: '[AquaAI PoC stub] Azure OpenAI not configured. This is a placeholder response.' }, finish_reason: 'stop' }],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      });
    }

    // Post-PoC: real Azure OpenAI call goes here
    try {
      const axios = require('axios');
      const start = Date.now();
      const resp = await axios.post(
        `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o'}/chat/completions?api-version=2024-02-01`,
        { messages, max_tokens },
        { headers: { 'api-key': process.env.AZURE_OPENAI_KEY, 'Content-Type': 'application/json' }, timeout: 30000 }
      );
      const duration = Date.now() - start;

      // Log to usage_log
      try {
        const pool = await getDb();
        await pool.request()
          .input('modelName', sql.NVarChar(100), model)
          .input('callingModule', sql.NVarChar(50), callingModule)
          .input('promptTokens', sql.Int, resp.data.usage?.prompt_tokens || 0)
          .input('completionTokens', sql.Int, resp.data.usage?.completion_tokens || 0)
          .input('durationMs', sql.Int, duration)
          .query(`INSERT INTO aquaai.usage_log (model_name, calling_module, prompt_tokens, completion_tokens, duration_ms, created_at)
                  VALUES (@modelName, @callingModule, @promptTokens, @completionTokens, @durationMs, GETDATE())`);
      } catch (dbErr) {
        console.warn('[completions] DB log failed:', dbErr.message);
      }

      eventBus.publish(EVENT_TYPES.COMPLETION_RETURNED, { model, callingModule, tokens: resp.data.usage?.total_tokens }, req.user?.preferred_username).catch(() => {});
      res.json(resp.data);
    } catch (err) {
      console.error('[completions]', err.message);
      res.status(502).json({ error: 'Azure OpenAI request failed', details: err.message });
    }
  }
);

/**
 * POST /api/internal/embeddings
 * Proxies to Azure OpenAI embeddings.
 * Stub mode: returns mock response when AZURE_OPENAI_ENDPOINT not set.
 */
router.post(
  '/embeddings',
  [body('input').notEmpty().withMessage('input is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { input, model = 'text-embedding-3-large', callingModule = 'unknown' } = req.body;

    if (!isOpenAIConfigured()) {
      eventBus.publish(EVENT_TYPES.EMBEDDING_REQUESTED, { model, callingModule, stub: true }, req.user?.preferred_username).catch(() => {});
      return res.json({
        ...STUB_RESPONSE,
        model,
        callingModule,
        data: [{ index: 0, embedding: Array(3072).fill(0), object: 'embedding' }],
        usage: { prompt_tokens: 0, total_tokens: 0 },
      });
    }

    // Post-PoC: real Azure OpenAI embedding call
    try {
      const axios = require('axios');
      const resp = await axios.post(
        `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/text-embedding-3-large/embeddings?api-version=2024-02-01`,
        { input },
        { headers: { 'api-key': process.env.AZURE_OPENAI_KEY, 'Content-Type': 'application/json' }, timeout: 15000 }
      );
      eventBus.publish(EVENT_TYPES.EMBEDDING_REQUESTED, { model, callingModule, tokens: resp.data.usage?.total_tokens }, req.user?.preferred_username).catch(() => {});
      res.json(resp.data);
    } catch (err) {
      console.error('[embeddings]', err.message);
      res.status(502).json({ error: 'Azure OpenAI embeddings request failed', details: err.message });
    }
  }
);

/**
 * GET /api/internal/usage
 * AI usage stats: requests/day, tokens/day, by module (reads aquaai.usage_log).
 */
router.get('/usage', async (req, res) => {
  try {
    const pool = await getDb();
    const result = await pool.request().query(
      `SELECT
         CAST(created_at AS DATE) AS usage_date,
         COUNT(*)                 AS request_count,
         SUM(prompt_tokens)       AS total_prompt_tokens,
         SUM(completion_tokens)   AS total_completion_tokens,
         SUM(prompt_tokens + completion_tokens) AS total_tokens,
         AVG(duration_ms)         AS avg_duration_ms
       FROM aquaai.usage_log
       WHERE created_at >= DATEADD(DAY, -30, GETDATE())
       GROUP BY CAST(created_at AS DATE)
       ORDER BY usage_date DESC`
    );

    eventBus.publish(EVENT_TYPES.USAGE_QUERIED, {}, req.user?.preferred_username).catch(() => {});
    res.json({ usage: result.recordset, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[usage]', err.message);
    res.json({
      usage: getMockUsage(),
      generatedAt: new Date().toISOString(),
      _stub: true,
      _message: 'DB not reachable — showing mock data',
    });
  }
});

/**
 * GET /api/internal/usage/by-module
 * Usage breakdown by calling module (last 30d).
 */
router.get('/usage/by-module', async (req, res) => {
  try {
    const pool = await getDb();
    const result = await pool.request().query(
      `SELECT
         calling_module,
         COUNT(*)  AS request_count,
         SUM(prompt_tokens + completion_tokens) AS total_tokens,
         AVG(duration_ms) AS avg_duration_ms
       FROM aquaai.usage_log
       WHERE created_at >= DATEADD(DAY, -30, GETDATE())
       GROUP BY calling_module
       ORDER BY request_count DESC`
    );
    res.json({ byModule: result.recordset, generatedAt: new Date().toISOString() });
  } catch (err) {
    console.error('[usage/by-module]', err.message);
    res.json({
      byModule: [
        { calling_module: 'aquadocs',     request_count: 247, total_tokens: 892400, avg_duration_ms: 1240 },
        { calling_module: 'aquarecords',  request_count: 12,  total_tokens: 38400,  avg_duration_ms: 890  },
        { calling_module: 'unknown',      request_count: 3,   total_tokens: 8200,   avg_duration_ms: 1100 },
      ],
      generatedAt: new Date().toISOString(),
      _stub: true,
    });
  }
});

/**
 * GET /api/internal/models
 * Registered models and their config.
 */
router.get('/models', async (req, res) => {
  eventBus.publish(EVENT_TYPES.MODELS_LISTED, { count: MODELS.length }, req.user?.preferred_username).catch(() => {});
  res.json({
    models: MODELS.map((m) => ({ ...m, status: isOpenAIConfigured() ? 'available' : 'not-configured' })),
    azureConfigured: isOpenAIConfigured(),
  });
});

// ---- Mock data helpers ----
function getMockUsage() {
  const rows = [];
  for (let d = 0; d < 14; d++) {
    const date = new Date(Date.now() - d * 86400000);
    rows.push({
      usage_date: date.toISOString().slice(0, 10),
      request_count: 0,
      total_prompt_tokens: 0,
      total_completion_tokens: 0,
      total_tokens: 0,
      avg_duration_ms: null,
    });
  }
  return rows;
}

module.exports = router;
