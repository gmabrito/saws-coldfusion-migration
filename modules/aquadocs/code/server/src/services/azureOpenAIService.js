const config = require('../config');

let AzureOpenAI = null;

// Lazy-load Azure SDK — gracefully skip if not installed
try {
  AzureOpenAI = require('@azure/openai').AzureOpenAI;
} catch (e) {
  console.warn('[AzureOpenAI] @azure/openai not installed. AI features will return stubs.');
}

function getClient() {
  if (!AzureOpenAI) return null;
  if (!config.azure.openai.endpoint || !config.azure.openai.key) return null;
  return new AzureOpenAI({
    endpoint: config.azure.openai.endpoint,
    apiKey: config.azure.openai.key,
    apiVersion: '2024-05-01-preview',
  });
}

/**
 * Embed a text string using text-embedding-3-large.
 * Returns null if Azure OpenAI is not configured.
 */
async function embed(text) {
  const c = getClient();
  if (!c) return null;

  const r = await c.embeddings.create({
    model: config.azure.openai.embeddingDeployment,
    input: text,
  });
  return r.data[0].embedding;
}

/**
 * Generate a RAG answer from retrieved document chunks.
 * Returns a stub answer if Azure OpenAI is not configured.
 *
 * @param {Array<{role:string, content:string}>} messages - Chat history
 * @param {string} context - Retrieved document chunks concatenated
 */
async function chat(messages, context) {
  const c = getClient();
  if (!c) {
    return {
      answer:
        'AI service not configured. Set AZURE_OPENAI_ENDPOINT and AZURE_OPENAI_KEY to enable AI-assisted answers.',
      sources: [],
    };
  }

  const systemPrompt =
    `You are AquaDocs, SAWS's document intelligence assistant. ` +
    `Answer questions based only on the provided SAWS documents. ` +
    `Cite sources by document title. ` +
    `If the answer is not in the provided documents, say so clearly.\n\n` +
    `Retrieved Documents:\n${context}`;

  const r = await c.chat.completions.create({
    model: config.azure.openai.deployment,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
    temperature: 0.1,
    max_tokens: 800,
  });

  return { answer: r.choices[0].message.content };
}

module.exports = { embed, chat };
