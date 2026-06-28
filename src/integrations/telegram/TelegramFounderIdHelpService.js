class TelegramFounderIdHelpService {
  extractCandidate(update = {}) {
    const message = update.message || {};
    const chat = message.chat || {};
    const from = message.from || {};
    const chatType = chat.type || 'unknown';
    const groupRejected = chatType !== 'private';
    return {
      candidateUserId: from.id === undefined ? null : String(from.id),
      candidateChatId: chat.id === undefined ? null : String(chat.id),
      chatType,
      groupRejected,
      autoAllowlisted: false,
      storedMessageText: false,
      messageLength: String(message.text || '').length,
      warnings: groupRejected
        ? ['Groups are rejected. Use a private founder DM for operator setup.']
        : [],
    };
  }

  instructions() {
    return [
      '1. Create a Telegram bot with BotFather.',
      '2. Send a private DM from the founder account to the bot.',
      '3. Run a dry-run webhook/local update capture to read candidate user/chat IDs.',
      '4. Set TELEGRAM_OPERATOR_ALLOWED_USER_IDS and TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS locally.',
      '5. Do not auto-allow unknown IDs and keep replies dry-run.',
    ];
  }
}

module.exports = { TelegramFounderIdHelpService };
