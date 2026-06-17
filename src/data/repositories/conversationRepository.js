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

const conversations = [];
const messages = [];
let resolvedMessageTable;

const getMessageTable = async () => {
  if (!isSupabaseEnabled()) return 'messages';
  if (resolvedMessageTable) return resolvedMessageTable;

  const { error } = await supabase
    .from('conversation_messages')
    .select('id')
    .limit(1);
  resolvedMessageTable = ['42P01', 'PGRST205'].includes(error?.code)
    ? 'messages'
    : 'conversation_messages';
  return resolvedMessageTable;
};

const mapMessage = (row) => ({
  id: row.id,
  conversationId: row.conversation_id,
  userId: row.user_id,
  role: row.role,
  content: row.content,
  intent: row.intent,
  worker: row.worker,
  metadata: row.metadata || {},
  createdAt: row.created_at,
  source: 'supabase',
});

const mapConversation = (
  row,
  conversationMessages =
    row.conversation_messages || row.messages || [],
) => ({
  id: row.id,
  userId: row.user_id,
  conversationId: row.conversation_id || row.id,
  channel: row.channel || 'web',
  customerEmail: row.customer_email || '',
  customerName: row.customer_name || '',
  metadata: row.metadata || {},
  status: row.status,
  lastMessage: row.last_message || '',
  worker: row.main_worker || 'supportWorker',
  intent: row.main_intent || 'support',
  mainWorker: row.main_worker,
  mainIntent: row.main_intent,
  requiresHuman: Boolean(row.requires_human),
  messageCount: conversationMessages.length,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  source: 'supabase',
  ...(conversationMessages.length &&
    conversationMessages[0]?.content !== undefined && {
      messages: conversationMessages.map(mapMessage),
    }),
});

const createConversation = async (input) => {
  const data = typeof input === 'string' ? { userId: input } : input;
  const userId = data.userId;
  if (isSupabaseEnabled()) {
    const result = await trySupabase('create conversation', async () => {
      const conversationId = randomUUID();
      let { data: created, error } = await supabase
        .from('conversations')
        .insert({
          id: conversationId,
          conversation_id: conversationId,
          user_id: userId,
          channel: data.channel || 'web',
          customer_email: data.customerEmail || null,
          customer_name: data.customerName || null,
          metadata: data.metadata || {},
        })
        .select()
        .single();
      if (error?.code === 'PGRST204' || error?.code === '42703') {
        const legacy = await supabase
          .from('conversations')
          .insert({ id: conversationId, user_id: userId })
          .select()
          .single();
        created = legacy.data;
        error = legacy.error;
      }
      throwSupabaseError(error, 'create conversation');
      return mapConversation(created);
    });
    if (result.ok) return result.value;
  }

  const now = new Date().toISOString();
  const conversation = {
    id: `conv-${randomUUID().slice(0, 12)}`,
    userId,
    status: 'active',
    lastMessage: '',
    worker: 'supportWorker',
    intent: 'support',
    mainWorker: null,
    mainIntent: null,
    requiresHuman: false,
    channel: data.channel || 'web',
    customerEmail: data.customerEmail || '',
    customerName: data.customerName || '',
    metadata: data.metadata || {},
    source: 'memory',
    createdAt: now,
    updatedAt: now,
  };
  conversations.push(conversation);
  return { ...conversation };
};

const getConversationMessages = async (conversationId, limit = 200) => {
  const safeLimit = clampLimit(limit, 200, 1000);
  if (isSupabaseEnabled()) {
    const result = await trySupabase('get conversation messages', async () => {
      const messageTable = await getMessageTable();
      const { data, error } = await supabase
        .from(messageTable)
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(safeLimit);
      throwSupabaseError(error, 'get conversation messages');
      return data.map(mapMessage);
    });
    if (result.ok) return result.value;
  }
  return messages
    .filter((message) => message.conversationId === conversationId)
    .slice(-safeLimit)
    .map((message) => ({ ...message, source: 'memory' }));
};

const getConversationById = async (conversationId) => {
  if (isSupabaseEnabled()) {
    const result = await trySupabase('get conversation', async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .maybeSingle();
      throwSupabaseError(error, 'get conversation');
      if (!data) return null;
      const conversationMessages = await getConversationMessages(conversationId);
      return mapConversation(data, conversationMessages);
    });
    if (result.ok) return result.value;
  }

  const conversation = conversations.find((item) => item.id === conversationId);
  if (!conversation) return null;
  return {
    ...conversation,
    messages: await getConversationMessages(conversationId),
  };
};

const listConversations = async ({
  limit = 100,
  status,
  worker,
  intent,
} = {}) => {
  const safeLimit = clampLimit(limit);
  if (isSupabaseEnabled()) {
    const result = await trySupabase('list conversations', async () => {
      const messageTable = await getMessageTable();
      let query = supabase
        .from('conversations')
        .select(`*, ${messageTable}(id)`)
        .order('updated_at', { ascending: false })
        .limit(safeLimit);
      if (status) query = query.eq('status', status);
      if (worker) query = query.eq('main_worker', worker);
      if (intent) query = query.eq('main_intent', intent);
      const { data, error } = await query;
      throwSupabaseError(error, 'list conversations');
      return data.map(mapConversation);
    });
    if (result.ok) return result.value;
  }

  return conversations
    .filter((conversation) => !status || conversation.status === status)
    .filter((conversation) => !worker || conversation.worker === worker)
    .filter((conversation) => !intent || conversation.intent === intent)
    .map((conversation) => ({
      ...conversation,
      messageCount: messages.filter(
        (message) => message.conversationId === conversation.id,
      ).length,
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, safeLimit);
};

const getConversationHistory = async (userId, limit = 20) => {
  const safeLimit = clampLimit(limit, 20, 100);
  if (isSupabaseEnabled()) {
    const result = await trySupabase('get conversation history', async () => {
      const messageTable = await getMessageTable();
      const { data, error } = await supabase
        .from(messageTable)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(safeLimit);
      throwSupabaseError(error, 'get conversation history');
      return data.reverse().map(mapMessage);
    });
    if (result.ok) return result.value;
  }
  return messages
    .filter((message) => message.userId === userId)
    .slice(-safeLimit)
    .map((message) => ({ ...message }));
};

const addMessage = async ({
  conversationId,
  userId,
  role,
  content,
  intent = null,
  worker = null,
  metadata = {},
}) => {
  if (isSupabaseEnabled()) {
    const result = await trySupabase('add message', async () => {
      const messageTable = await getMessageTable();
      const { data, error } = await supabase
        .from(messageTable)
        .insert({
          conversation_id: conversationId,
          user_id: userId,
          role,
          content,
          intent,
          worker,
          metadata,
        })
        .select()
        .single();
      throwSupabaseError(error, 'add message');
      return mapMessage(data);
    });
    if (result.ok) return result.value;
  }

  const message = {
    id: `msg-${randomUUID().slice(0, 12)}`,
    conversationId,
    userId,
    role,
    content,
    intent,
    worker,
    metadata,
    createdAt: new Date().toISOString(),
    source: 'memory',
  };
  messages.push(message);
  return { ...message };
};

const updateConversation = async (conversationId, data) => {
  const changes = compact({
    status: data.status,
    main_worker: data.mainWorker ?? data.worker,
    main_intent: data.mainIntent ?? data.intent,
    last_message: data.lastMessage,
    requires_human: data.requiresHuman,
    last_worker: data.mainWorker ?? data.worker,
    last_intent: data.mainIntent ?? data.intent,
    metadata: data.metadata,
  });
  const legacyChanges = compact({
    status: data.status,
    main_worker: data.mainWorker ?? data.worker,
    main_intent: data.mainIntent ?? data.intent,
    last_message: data.lastMessage,
    requires_human: data.requiresHuman,
  });

  if (isSupabaseEnabled()) {
    const result = await trySupabase('update conversation', async () => {
      let { data: updated, error } = await supabase
        .from('conversations')
        .update(changes)
        .eq('id', conversationId)
        .select()
        .maybeSingle();
      if (error?.code === 'PGRST204' || error?.code === '42703') {
        const legacy = await supabase
          .from('conversations')
          .update(legacyChanges)
          .eq('id', conversationId)
          .select()
          .maybeSingle();
        updated = legacy.data;
        error = legacy.error;
      }
      throwSupabaseError(error, 'update conversation');
      return updated ? mapConversation(updated) : null;
    });
    if (result.ok) return result.value;
  }

  const conversation = conversations.find((item) => item.id === conversationId);
  if (!conversation) return null;
  Object.assign(
    conversation,
    compact({
      status: data.status,
      worker: data.mainWorker ?? data.worker,
      intent: data.mainIntent ?? data.intent,
      mainWorker: data.mainWorker ?? data.worker,
      mainIntent: data.mainIntent ?? data.intent,
      lastMessage: data.lastMessage,
      requiresHuman: data.requiresHuman,
    }),
    { updatedAt: new Date().toISOString() },
  );
  return { ...conversation };
};

const saveConversationSummary = async (conversationId, data) =>
  updateConversation(conversationId, data);

const findResponseByRequestId = async (userId, requestId) => {
  if (!requestId) return null;

  if (isSupabaseEnabled()) {
    const result = await trySupabase('find response by request id', async () => {
      const messageTable = await getMessageTable();
      const { data, error } = await supabase
        .from(messageTable)
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'assistant')
        .contains('metadata', { requestId })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      throwSupabaseError(error, 'find response by request id');
      return data?.metadata?.responseEnvelope || null;
    });
    if (result.ok) return result.value;
  }

  const existing = [...messages].reverse().find(
    (message) =>
      message.userId === userId &&
      message.role === 'assistant' &&
      message.metadata?.requestId === requestId,
  );
  return existing?.metadata?.responseEnvelope || null;
};

module.exports = {
  createConversation,
  getConversationById,
  getConversation: getConversationById,
  getConversationMessages,
  listConversations,
  getConversationHistory,
  addMessage,
  saveMessage: addMessage,
  updateConversation,
  saveConversation: updateConversation,
  saveConversationSummary,
  findResponseByRequestId,
};
