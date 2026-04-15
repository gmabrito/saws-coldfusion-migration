const express = require('express');
const eventBus = require('../events/eventBus');

const router = express.Router();

// Connected SSE clients
const clients = new Set();

/**
 * GET /api/events/stream
 * Server-Sent Events endpoint. Clients subscribe here to receive
 * real-time FRS events as they happen.
 *
 * No auth required for the prototype -- in production this would
 * validate a token or API key.
 */
router.get('/stream', (req, res) => {
  // SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Send initial connection event
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString(), message: 'FRS event stream connected' })}\n\n`);

  // Keep-alive ping every 30 seconds
  const keepAlive = setInterval(() => {
    res.write(`: ping\n\n`);
  }, 30000);

  // Add to connected clients
  clients.add(res);
  console.log(`[SSE] Client connected (${clients.size} total)`);

  // Remove on disconnect
  req.on('close', () => {
    clients.delete(res);
    clearInterval(keepAlive);
    console.log(`[SSE] Client disconnected (${clients.size} total)`);
  });
});

/**
 * GET /api/events/clients
 * Returns the number of connected SSE clients (for monitoring)
 */
router.get('/clients', (req, res) => {
  res.json({ connected: clients.size });
});

/**
 * Broadcast an event to all connected SSE clients.
 * Called by the event bus whenever an event is published.
 */
function broadcastToClients(event) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) {
    try {
      client.write(data);
    } catch {
      clients.delete(client);
    }
  }
}

// Subscribe to ALL events from the event bus and broadcast to SSE clients
eventBus.on('*', broadcastToClients);

// Also listen for any specific event type (EventEmitter doesn't support wildcard)
// So we override the eventBus.publish to also broadcast
const originalPublish = eventBus.publish.bind(eventBus);
eventBus.publish = async function (type, data, userId) {
  const event = await originalPublish(type, data, userId);
  broadcastToClients(event);
  return event;
};

module.exports = router;
