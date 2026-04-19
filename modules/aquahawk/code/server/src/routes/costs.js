/**
 * AquaHawk — Cost Management Routes
 *
 * Production path:  Azure Cost Management REST API
 *   POST https://management.azure.com/subscriptions/{id}/providers/
 *        Microsoft.CostManagement/query?api-version=2023-11-01
 *   Auth: Service principal with "Cost Management Reader" role on the
 *         saws-aquacore-* resource groups.
 *   Required env vars:
 *     AZURE_SUBSCRIPTION_ID
 *     AZURE_TENANT_ID
 *     AZURE_COST_SP_CLIENT_ID
 *     AZURE_COST_SP_CLIENT_SECRET
 *     AQUACORE_COST_TAG_KEY   (default: "project")
 *     AQUACORE_COST_TAG_VALUE (default: "aquacore")
 *
 * PoC path: AZURE_SUBSCRIPTION_ID not set → returns realistic stub data
 *           so the UI is fully functional before Azure is provisioned.
 */

const router = require('express').Router();
const axios  = require('axios');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

const AZURE_SUB_ID = process.env.AZURE_SUBSCRIPTION_ID;

// ── Per-module budgets (USD / month) ────────────────────────────────────────
// Update these when SAWS sets official budgets.
// Migration modules have $0 budget because they run locally in the PoC.
const MODULE_BUDGETS = {
  // AquaCore — Azure-active in PoC
  aquadocs:              200,   // AI Search, OpenAI, Doc Intelligence, Container Apps, Speech
  aquarecords:           50,    // shares AquaDocs AI Search index; Container App + SQL
  aquahawk:              30,    // Container App + SQL only
  aquaai:                50,    // Container App; OpenAI via shared gateway
  platform:              100,   // shared: OpenAI gateway, SQL Server, Key Vault, Storage, Event Hub
  // ColdFusion Migration — local only in PoC ($0 Azure spend until cloud-lift)
  fhm:                   0,
  'flat-rate-sewer':     0,
  'utility-maps':        0,
  sitrep:                0,
  'take-home-vehicles':  0,
  locates:               0,
};

// ── Azure Cost Management query ──────────────────────────────────────────────
async function fetchAzureCosts(subscriptionId, tenantId, clientId, secret) {
  // 1. Get bearer token
  const tokenRes = await axios.post(
    `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
    new URLSearchParams({
      grant_type:    'client_credentials',
      client_id:     clientId,
      client_secret: secret,
      scope:         'https://management.azure.com/.default',
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  const token = tokenRes.data.access_token;

  // 2. Query cost by "module" tag, month-to-date
  const tagKey   = process.env.AQUACORE_COST_TAG_KEY   || 'project';
  const tagValue = process.env.AQUACORE_COST_TAG_VALUE || 'aquacore';

  const queryRes = await axios.post(
    `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.CostManagement/query?api-version=2023-11-01`,
    {
      type: 'ActualCost',
      dataSet: {
        granularity: 'None',
        aggregation:  { totalCost: { name: 'Cost', function: 'Sum' } },
        grouping: [
          { type: 'TagKey', name: 'module' },
          { type: 'Dimension', name: 'ServiceName' },
        ],
        filter: {
          tags: { name: tagKey, operator: 'In', values: [tagValue] },
        },
      },
      timeframe: 'MonthToDate',
    },
    { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
  );

  return queryRes.data;
}

// ── GET /api/internal/costs ──────────────────────────────────────────────────
router.get('/', async (req, res) => {
  // If Azure credentials are configured, query the real API
  if (
    AZURE_SUB_ID &&
    process.env.AZURE_TENANT_ID &&
    process.env.AZURE_COST_SP_CLIENT_ID &&
    process.env.AZURE_COST_SP_CLIENT_SECRET
  ) {
    try {
      const raw = await fetchAzureCosts(
        AZURE_SUB_ID,
        process.env.AZURE_TENANT_ID,
        process.env.AZURE_COST_SP_CLIENT_ID,
        process.env.AZURE_COST_SP_CLIENT_SECRET
      );
      return res.json(transformAzureResponse(raw));
    } catch (err) {
      console.error('[costs] Azure Cost Management API error:', err.message);
      // Fall through to stub so the page doesn't break
    }
  }

  // ── Stub data (realistic PoC estimates) ─────────────────────────────────
  const today      = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const elapsed    = dayOfMonth / daysInMonth;   // fraction of month elapsed

  res.json(buildStubResponse(elapsed, daysInMonth - dayOfMonth));
});

// ── GET /api/internal/costs/tags ────────────────────────────────────────────
router.get('/tags', async (req, res) => {
  // In production this would call Azure Resource Graph to check tag compliance.
  // For the PoC, return the tagging spec so teams know what to apply.
  res.json({
    strategy: {
      requiredTags: [
        { key: 'project',     example: 'aquacore',       purpose: 'Top-level cost envelope — all AquaCore Azure resources' },
        { key: 'module',      example: 'aquadocs',        purpose: 'Per-module cost allocation (matches MODULE_BUDGETS keys)' },
        { key: 'environment', example: 'poc',             purpose: 'poc | dev | qa | staging | prod' },
        { key: 'component',   example: 'api',             purpose: 'api | pipeline | search | storage | db | speech | web' },
        { key: 'cost-center', example: 'IS-DIGITAL',      purpose: 'SAWS cost center code for internal chargebacks' },
      ],
      sharedResources: {
        module:    'platform',
        resources: ['Azure OpenAI', 'Azure AI Search (shared tiers)', 'Azure SQL Server', 'Azure Key Vault', 'Container Apps Environment', 'ADLS Gen2'],
        allocation: 'Shared platform cost is shown separately; per-module split not required in PoC.',
      },
      bicepExample: `// In every Bicep module, pass tags down to all resources:
var tags = {
  project:     'aquacore'
  module:      moduleName       // param from bicepparam
  environment: environment      // param from bicepparam
  component:   componentName    // 'api', 'pipeline', 'search', etc.
  cost-center: 'IS-DIGITAL'
}`,
    },
    compliance: {
      _stub: true,
      _message: 'Tag compliance requires Azure Resource Graph — connect AZURE_SUBSCRIPTION_ID to enable live data.',
      summary: { tagged: 0, untagged: 0, total: 0 },
    },
  });
});

// ── Transform Azure Cost Management response ─────────────────────────────────
function transformAzureResponse(raw) {
  // Azure returns rows like: [cost, currency, module-tag, service-name]
  const rows = raw.properties?.rows || [];
  const byModule  = {};
  const byService = {};

  for (const row of rows) {
    const cost    = parseFloat(row[0]) || 0;
    const module  = row[2] || 'platform';
    const service = row[3] || 'Unknown';

    byModule[module]   = (byModule[module]   || 0) + cost;
    byService[service] = (byService[service] || 0) + cost;
  }

  const total = Object.values(byModule).reduce((s, c) => s + c, 0);
  return buildResponse({ byModule, byService, total, _stub: false });
}

// ── Stub builder ─────────────────────────────────────────────────────────────
function buildStubResponse(elapsed, daysRemaining) {
  // Only AquaDocs has Azure resources in the PoC. Everything else runs locally.
  const byModule = {
    aquadocs:  parseFloat((142.50 * elapsed * (daysRemaining > 0 ? 1 : 1)).toFixed(2)),
    platform:  parseFloat((38.20  * elapsed).toFixed(2)),
  };
  Object.keys(MODULE_BUDGETS).forEach((m) => {
    if (!byModule[m]) byModule[m] = 0;
  });

  const total = Object.values(byModule).reduce((s, c) => s + c, 0);

  // Project rest-of-month at same daily burn rate
  const dailyBurn   = elapsed > 0 ? total / (elapsed * 30) : 0;
  const projectedEOM = parseFloat((total + dailyBurn * daysRemaining).toFixed(2));

  const byService = [
    { service: 'Azure AI Search',           cost: parseFloat((75.00 * elapsed).toFixed(2)), category: 'Intelligence',  sku: 'Basic' },
    { service: 'Azure OpenAI (GPT-4o)',      cost: parseFloat((28.50 * elapsed).toFixed(2)), category: 'Intelligence',  sku: 'S0 consumption' },
    { service: 'Azure OpenAI (Embeddings)',  cost: parseFloat((3.20  * elapsed).toFixed(2)), category: 'Intelligence',  sku: 'text-embedding-3-large' },
    { service: 'Azure Container Apps',       cost: parseFloat((15.30 * elapsed).toFixed(2)), category: 'Compute',       sku: 'Consumption' },
    { service: 'AI Document Intelligence',   cost: parseFloat((9.80  * elapsed).toFixed(2)), category: 'AI Processing', sku: 'S0' },
    { service: 'Azure Speech Services',      cost: parseFloat((4.80  * elapsed).toFixed(2)), category: 'AI Processing', sku: 'S0' },
    { service: 'Azure SQL Database',         cost: parseFloat((6.10  * elapsed).toFixed(2)), category: 'Database',      sku: 'Basic' },
    { service: 'Azure Blob Storage',         cost: parseFloat((4.20  * elapsed).toFixed(2)), category: 'Storage',       sku: 'LRS' },
    { service: 'Azure Key Vault',            cost: parseFloat((1.20  * elapsed).toFixed(2)), category: 'Security',      sku: 'Standard' },
    { service: 'Azure Static Web Apps',      cost: 0,                                         category: 'Hosting',       sku: 'Free tier' },
  ];

  return {
    period:    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    currency:  'USD',
    mtd: {
      total:   parseFloat(total.toFixed(2)),
      budget:  Object.values(MODULE_BUDGETS).reduce((s, v) => s + v, 0),
    },
    forecast: {
      projectedMonthEnd: projectedEOM,
      dailyBurn:         parseFloat(dailyBurn.toFixed(2)),
      daysRemaining,
    },
    lastMonth: { total: 168.20 },
    ytd:       { total: parseFloat((892.50 + total).toFixed(2)) },
    byModule:  Object.entries(byModule).map(([id, cost]) => ({
      id,
      name:    id === 'platform' ? 'Platform (Shared)' : id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      cost:    parseFloat(cost.toFixed(2)),
      budget:  MODULE_BUDGETS[id] ?? 0,
      percent: MODULE_BUDGETS[id] > 0 ? Math.round((cost / MODULE_BUDGETS[id]) * 100) : null,
      hasAzure: cost > 0,
    })).sort((a, b) => b.cost - a.cost),
    byService,
    _stub:    true,
    _message: 'Showing estimated PoC costs — connect AZURE_SUBSCRIPTION_ID + Cost SP to pull live Azure billing data.',
  };
}

function buildResponse({ byModule, byService, total, _stub }) {
  return {
    period:   `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
    currency: 'USD',
    mtd: {
      total:  parseFloat(total.toFixed(2)),
      budget: Object.values(MODULE_BUDGETS).reduce((s, v) => s + v, 0),
    },
    byModule: Object.entries(byModule).map(([id, cost]) => ({
      id, cost: parseFloat(cost.toFixed(2)),
      budget:  MODULE_BUDGETS[id] ?? 0,
      percent: MODULE_BUDGETS[id] > 0 ? Math.round((cost / MODULE_BUDGETS[id]) * 100) : null,
      hasAzure: cost > 0,
    })).sort((a, b) => b.cost - a.cost),
    byService: Array.isArray(byService)
      ? byService
      : Object.entries(byService).map(([service, cost]) => ({ service, cost: parseFloat(cost.toFixed(2)) }))
           .sort((a, b) => b.cost - a.cost),
    _stub,
  };
}

module.exports = router;
