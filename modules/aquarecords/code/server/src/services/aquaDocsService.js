/**
 * aquaDocsService — AquaRecords client for the AquaDocs intelligence API.
 *
 * AquaRecords does not have its own document AI. Instead it calls AquaDocs,
 * which owns the Azure AI Search index (422K+ SAWS documents) and the
 * Azure OpenAI RAG pipeline. This is the shared intelligence layer pattern
 * across the AquaCore platform.
 *
 * In production (Azure): AquaRecords Container App calls AquaDocs Container
 * App over the private VNet using Managed Identity — no secrets, no API keys.
 *
 * Locally: calls http://localhost:3030 with SKIP_AUTH=true on both servers.
 *
 * Environment variables:
 *   AQUADOCS_API_URL  — base URL of the AquaDocs API (default: http://localhost:3030)
 *   AQUADOCS_API_KEY  — optional shared secret for service-to-service auth (post-PoC)
 */

const axios = require('axios');

const AQUADOCS_URL = process.env.AQUADOCS_API_URL || 'http://localhost:3030';
const AQUADOCS_KEY = process.env.AQUADOCS_API_KEY || null;

function buildHeaders(userToken) {
  const headers = { 'Content-Type': 'application/json' };
  // Forward the caller's AD token so AquaDocs authenticate middleware accepts it.
  // In local dev SKIP_AUTH=true bypasses this. In production this is the
  // X-MS-CLIENT-PRINCIPAL header passed through from the original SWA request.
  if (userToken) headers['X-MS-CLIENT-PRINCIPAL'] = userToken;
  if (AQUADOCS_KEY) headers['X-Service-Key'] = AQUADOCS_KEY;
  return headers;
}

/**
 * searchDocuments — Hybrid vector+keyword search across the SAWS document index.
 *
 * Used by AquaRecords to find documents relevant to a TPIA request.
 * Calls POST /api/internal/search on the AquaDocs API.
 *
 * @param {string} query        - Search query (request description or keyword)
 * @param {object} filters      - Optional: { doc_type, department, date_from, date_to }
 * @param {number} top          - Max results (default: 10)
 * @param {string} userToken    - Caller's X-MS-CLIENT-PRINCIPAL header value
 * @returns {Promise<{results: Array, count: number}>}
 */
async function searchDocuments(query, filters = {}, top = 10, userToken = null) {
  try {
    const response = await axios.post(
      `${AQUADOCS_URL}/api/internal/search`,
      { query, filters, top },
      { headers: buildHeaders(userToken), timeout: 15000 }
    );
    return response.data;
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.warn('[AquaDocsService] AquaDocs API not reachable at', AQUADOCS_URL);
      return {
        results: [],
        count: 0,
        message: 'AquaDocs service unavailable. Start the AquaDocs server on port 3030.',
      };
    }
    console.error('[AquaDocsService] searchDocuments failed:', err.message);
    throw err;
  }
}

/**
 * chatWithDocuments — RAG Q&A against the SAWS document index.
 *
 * Used by AquaRecords to:
 *  - Help staff draft responses to TPIA requests based on retrieved documents
 *  - Identify which documents are responsive to a request
 *  - Summarize relevant policy or procedural documents
 *
 * Calls POST /api/internal/chat on the AquaDocs API.
 *
 * @param {Array<{role: string, content: string}>} messages  - Chat message history
 * @param {string} userToken  - Caller's X-MS-CLIENT-PRINCIPAL header value
 * @returns {Promise<{answer: string, sources: Array}>}
 */
async function chatWithDocuments(messages, userToken = null) {
  try {
    const response = await axios.post(
      `${AQUADOCS_URL}/api/internal/chat`,
      { messages },
      { headers: buildHeaders(userToken), timeout: 30000 }
    );
    return response.data;
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      console.warn('[AquaDocsService] AquaDocs API not reachable at', AQUADOCS_URL);
      return {
        answer: 'AquaDocs service unavailable. Start the AquaDocs server on port 3030.',
        sources: [],
      };
    }
    console.error('[AquaDocsService] chatWithDocuments failed:', err.message);
    throw err;
  }
}

/**
 * getServiceHealth — Check AquaDocs API availability.
 * Used by AquaRecords health check to report dependency status.
 */
async function getServiceHealth() {
  try {
    const response = await axios.get(`${AQUADOCS_URL}/api/health`, { timeout: 3000 });
    return { status: 'ok', url: AQUADOCS_URL, ...response.data };
  } catch {
    return { status: 'unavailable', url: AQUADOCS_URL };
  }
}

module.exports = { searchDocuments, chatWithDocuments, getServiceHealth };
