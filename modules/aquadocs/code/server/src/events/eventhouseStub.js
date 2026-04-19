/**
 * Eventhouse Transport Stub
 *
 * Logs events to the console during development. Replace with a real
 * Azure Event Hub producer client when the Eventhouse pipeline is ready.
 */
class EventhouseTransport {
  async send(event) {
    console.log(`[EVENTHOUSE STUB] ${event.type}:`, JSON.stringify(event.data));
    // TODO: Replace with real Eventhouse/Event Hub client
    // const { EventHubProducerClient } = require('@azure/event-hubs');
    // const producer = new EventHubProducerClient(connectionString, eventHubName);
    // const batch = await producer.createBatch();
    // batch.tryAdd({ body: event });
    // await producer.sendBatch(batch);
    // await producer.close();
  }
}

module.exports = new EventhouseTransport();
