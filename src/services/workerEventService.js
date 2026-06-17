const { randomUUID } = require('crypto');
const {
  supabase,
  isSupabaseEnabled,
} = require('../data/supabase/supabaseClient');
const logger = require('../utils/logger');

const events = [];
let remoteEventsAvailable = true;

const mapEvent = (row) => ({
  id: row.id,
  conversationId: row.conversation_id,
  worker: row.worker,
  intent: row.intent,
  eventType: row.event_type,
  payload: row.payload || {},
  source: row.source || 'supabase',
  createdAt: row.created_at,
});

const recordEvent = async ({
  conversationId,
  worker,
  intent,
  eventType,
  payload = {},
  source,
}) => {
  const event = {
    id: `event-${randomUUID().slice(0, 12)}`,
    conversationId,
    worker,
    intent,
    eventType,
    payload,
    source: source || (isSupabaseEnabled() ? 'supabase' : 'memory'),
    createdAt: new Date().toISOString(),
  };

  if (isSupabaseEnabled() && remoteEventsAvailable) {
    const { data, error } = await supabase
      .from('worker_events')
      .insert({
        conversation_id: conversationId,
        worker,
        intent,
        event_type: eventType,
        payload,
        source: event.source,
      })
      .select()
      .single();
    if (!error) return mapEvent(data);
    remoteEventsAvailable = false;
    logger.warn('worker_events_fallback', {
      message: error.message,
      code: error.code,
    });
  }

  events.unshift(event);
  events.splice(500);
  logger.info('worker_event', {
    conversationId,
    worker,
    intent,
    eventType,
    source: event.source,
  });
  return { ...event };
};

const listWorkerEvents = async ({ limit = 100 } = {}) => {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 100, 500));
  if (isSupabaseEnabled() && remoteEventsAvailable) {
    const { data, error } = await supabase
      .from('worker_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(safeLimit);
    if (!error) return data.map(mapEvent);
    remoteEventsAvailable = false;
  }
  return events.slice(0, safeLimit).map((event) => ({ ...event }));
};

module.exports = {
  listWorkerEvents,
  recordEvent,
};
