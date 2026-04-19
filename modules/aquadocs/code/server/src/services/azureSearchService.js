const config = require('../config');

let SearchClient = null;
let AzureKeyCredential = null;

// Lazy-load Azure SDK — gracefully skip if not installed
try {
  const sdk = require('@azure/search-documents');
  SearchClient = sdk.SearchClient;
  AzureKeyCredential = sdk.AzureKeyCredential;
} catch (e) {
  console.warn('[AzureSearch] @azure/search-documents not installed. Search will return stubs.');
}

let client = null;

function getClient() {
  if (!SearchClient || !AzureKeyCredential) return null;
  if (!config.azure.search.endpoint || !config.azure.search.key) return null;
  if (!client) {
    client = new SearchClient(
      config.azure.search.endpoint,
      config.azure.search.index,
      new AzureKeyCredential(config.azure.search.key)
    );
  }
  return client;
}

/**
 * Public keyword-only search — no vector, limited metadata returned.
 */
async function publicSearch(query, top = 10) {
  const c = getClient();
  if (!c) {
    return {
      results: [],
      count: 0,
      message: 'Azure AI Search not configured. Set AZURE_SEARCH_ENDPOINT and AZURE_SEARCH_KEY.',
    };
  }

  const results = [];
  for await (const r of c.search(query, {
    top,
    select: ['chunk_id', 'title', 'doc_type', 'department', 'source_file', 'content'],
  })) {
    results.push({
      id: r.document.chunk_id,
      title: r.document.title,
      docType: r.document.doc_type,
      department: r.document.department,
      score: r.score,
      excerpt: r.document.content ? r.document.content.substring(0, 200) : null,
    });
  }
  return { results, count: results.length };
}

/**
 * Internal hybrid (keyword) search with optional filters.
 * Full vector hybrid requires AzureKeyCredential + vector field — simplified here for initial build.
 */
async function hybridSearch(query, filters = {}, top = 5) {
  const c = getClient();
  if (!c) {
    return {
      results: [],
      message: 'Azure AI Search not configured.',
    };
  }

  // Build OData filter string
  const filterParts = [];
  if (filters.doc_type) filterParts.push(`doc_type eq '${filters.doc_type.replace(/'/g, "''")}'`);
  if (filters.department) filterParts.push(`department eq '${filters.department.replace(/'/g, "''")}'`);

  const searchOptions = {
    top,
    select: ['chunk_id', 'title', 'content', 'doc_type', 'department', 'source_file', 'page_number'],
  };
  if (filterParts.length > 0) {
    searchOptions.filter = filterParts.join(' and ');
  }

  const results = [];
  for await (const r of c.search(query, searchOptions)) {
    results.push({
      ...r.document,
      score: r.score,
      excerpt: r.document.content ? r.document.content.substring(0, 300) : null,
    });
  }
  return { results, count: results.length };
}

/**
 * Get total document count from index.
 */
async function getIndexHealth() {
  const c = getClient();
  if (!c) return { count: null, message: 'Azure AI Search not configured.' };

  try {
    const result = await c.search('*', { top: 0, includeTotalCount: true });
    return { count: result.count };
  } catch (e) {
    return { count: null, error: e.message };
  }
}

module.exports = { publicSearch, hybridSearch, getIndexHealth };
