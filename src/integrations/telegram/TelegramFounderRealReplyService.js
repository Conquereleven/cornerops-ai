class TelegramFounderRealReplyService {
  constructor({ config = {}, fetchImpl = global.fetch } = {}) {
    this.config = config;
    this.fetchImpl = fetchImpl;
  }

  getStatus() {
    const missing = [];
    if (!this.config.telegramOperatorBotToken) missing.push('TELEGRAM_OPERATOR_BOT_TOKEN');
    if (!this.config.telegramOperatorAllowedUserIds?.length) missing.push('TELEGRAM_OPERATOR_ALLOWED_USER_IDS');
    if (!this.config.telegramOperatorAllowedChatIds?.length) missing.push('TELEGRAM_OPERATOR_ALLOWED_CHAT_IDS');
    const realReplyReady = Boolean(
      this.config.telegramOperatorEnabled
      && this.config.telegramOperatorMode === 'polling'
      && this.config.corneropsTelegramAllowPolling
      && this.config.corneropsTelegramRealMode
      && this.config.corneropsTelegramDryRun === false
      && this.config.corneropsTelegramAllowRealReply
      && this.config.telegramOperatorReplyDryRun === false
      && this.config.telegramOperatorReplyEnabled !== false
      && this.config.corneropsTelegramReadOnly !== false
      && !missing.length
    );
    return {
      mode: realReplyReady ? 'real_reply_ready' : 'dry_run',
      realReplyReady,
      missing,
      realReplyAllowed: this.config.corneropsTelegramAllowRealReply === true,
      replyDryRun: this.config.telegramOperatorReplyDryRun !== false,
      telegramDryRun: this.config.corneropsTelegramDryRun !== false,
      sameChatOnly: true,
      proactiveOutbound: false,
      tokenPrinted: false,
    };
  }

  async sendSameChatReply({ chatId, userId, text, inReplyToMessageId }) {
    const allowedChat = this.config.telegramOperatorAllowedChatIds?.includes(String(chatId));
    const allowedUser = this.config.telegramOperatorAllowedUserIds?.includes(String(userId));
    if (!inReplyToMessageId || !allowedChat || !allowedUser) {
      return {
        status: 'blocked',
        warnings: ['Telegram real reply blocked: destination must be the same approved founder chat.'],
      };
    }
    const status = this.getStatus();
    if (!status.realReplyReady) {
      return {
        status: 'dry_run',
        warnings: ['Telegram real reply is disabled; generated reply was not sent.'],
        mode: status.mode,
      };
    }
    const response = await this.fetchImpl(
      `https://api.telegram.org/bot${this.config.telegramOperatorBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          reply_to_message_id: String(inReplyToMessageId).replace(/^telegram-/, ''),
          disable_web_page_preview: true,
        }),
      },
    );
    if (!response.ok) {
      return { status: 'error', warnings: ['Telegram sendMessage failed.'] };
    }
    return { status: 'sent', warnings: [] };
  }
}

module.exports = { TelegramFounderRealReplyService };
