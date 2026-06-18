const CONTEXT_SOURCE_IDS = Object.freeze([
  'github_archive',
  'slack_archive',
  'whatsapp_archive',
  'telegram_archive',
  'notion_archive',
  'discord_archive',
  'granola_notes',
  'apple_messages',
  'apple_photos',
  'google_workspace',
  'google_places',
  'pdf_documents',
  'media_transcripts',
  'manual_uploads',
]);

const CONTEXT_MODES = Object.freeze([
  'mock',
  'read_only',
  'sync_allowed',
  'approval_required',
  'disabled',
]);

const PII_LEVELS = Object.freeze(['none', 'low', 'medium', 'high']);

const SOURCE_TYPES = Object.freeze([
  'message',
  'thread',
  'issue',
  'pr',
  'document',
  'note',
  'media',
  'contact',
  'place',
  'unknown',
]);

module.exports = {
  CONTEXT_MODES,
  CONTEXT_SOURCE_IDS,
  PII_LEVELS,
  SOURCE_TYPES,
};
