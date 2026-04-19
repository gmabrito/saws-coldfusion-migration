const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');
const eventhouse = require('./eventhouseStub');

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.eventRepository = null; // Set after DB is ready
  }

  setRepository(repo) {
    this.eventRepository = repo;
  }

  async publish(type, data, userId = null) {
    const event = {
      type,
      data,
      userId,
      timestamp: new Date().toISOString(),
      id: uuidv4(),
    };

    // 1. Write to SQL event log
    if (this.eventRepository) {
      try {
        await this.eventRepository.logEvent(event);
      } catch (err) {
        console.warn('[EventBus] Event log failed:', err.message);
      }
    }

    // 2. Send to Eventhouse stub
    try {
      await eventhouse.send(event);
    } catch (err) {
      console.warn('[EventBus] Eventhouse send failed:', err.message);
    }

    // 3. Emit locally for any listeners
    this.emit(type, event);

    return event;
  }
}

module.exports = new EventBus();
