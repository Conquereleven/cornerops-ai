const { randomUUID } = require('crypto');
const {
  supabase,
  isSupabaseEnabled,
} = require('../supabase/supabaseClient');
const {
  clampLimit,
  compact,
  throwSupabaseError,
  trySupabase,
} = require('./repositoryUtils');

const workerRuns = [];

const mapWorkerRun = (row) => ({
  id: row.id,
  conversationId: row.conversation_id,
  userId: row.user_id,
  worker: row.worker,
  intent: row.intent,
  input: row.input,
  output: row.output,
  metadata: row.metadata || {},
  success: Boolean(row.success),
  errorMessage: row.error_message,
  latencyMs: row.latency_ms,
  createdAt: row.created_at,
});

const createWorkerRun = async ({
  conversationId,
  userId,
  worker,
  intent,
  input,
  output,
  metadata = {},
  success = true,
  errorMessage,
  latencyMs,
}) => {
  if (isSupabaseEnabled()) {
    const result = await trySupabase('create worker run', async () => {
      const { data, error } = await supabase
        .from('ai_worker_runs')
        .insert(compact({
          conversation_id: conversationId,
          user_id: userId,
          worker,
          intent,
          input,
          output,
          metadata,
          success,
          error_message: errorMessage,
          latency_ms: latencyMs,
        }))
        .select()
        .single();
      throwSupabaseError(error, 'create worker run');
      return mapWorkerRun(data);
    });
    if (result.ok) return result.value;
  }

  const run = {
    id: `run-${randomUUID().slice(0, 12)}`,
    conversationId,
    userId,
    worker,
    intent,
    input,
    output,
    metadata,
    success,
    errorMessage: errorMessage || null,
    latencyMs,
    createdAt: new Date().toISOString(),
  };
  workerRuns.unshift(run);
  return { ...run };
};

const listWorkerRuns = async ({ limit = 100, worker, intent } = {}) => {
  const safeLimit = clampLimit(limit);
  if (isSupabaseEnabled()) {
    const result = await trySupabase('list worker runs', async () => {
      let query = supabase
        .from('ai_worker_runs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(safeLimit);
      if (worker) query = query.eq('worker', worker);
      if (intent) query = query.eq('intent', intent);
      const { data, error } = await query;
      throwSupabaseError(error, 'list worker runs');
      return data.map(mapWorkerRun);
    });
    if (result.ok) return result.value;
  }
  return workerRuns
    .filter((run) => !worker || run.worker === worker)
    .filter((run) => !intent || run.intent === intent)
    .slice(0, safeLimit)
    .map((run) => ({ ...run }));
};

module.exports = {
  createWorkerRun,
  listWorkerRuns,
};
