module.exports = {
  port: parseInt(process.env.PORT, 10) || 3030,
  db: {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE || 'SAWSMigration',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT, 10) || 1433,
  },
  azure: {
    search: {
      endpoint: process.env.AZURE_SEARCH_ENDPOINT,
      key: process.env.AZURE_SEARCH_KEY,
      index: process.env.AZURE_SEARCH_INDEX || 'aquadocs-chunks',
    },
    openai: {
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      key: process.env.AZURE_OPENAI_KEY,
      deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o',
      embeddingDeployment: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-large',
    },
    speech: {
      key: process.env.AZURE_SPEECH_KEY,
      region: process.env.AZURE_SPEECH_REGION || 'southcentralus',
    },
  },
};
