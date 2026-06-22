class ClickClackChatAdapter {
  async listRooms() {
    return {
      serviceId: 'clickclack',
      status: 'document_only',
      message: 'ClickClack internal chat console remains disabled/document-only in v0.1.',
    };
  }
}

module.exports = {
  ClickClackChatAdapter,
};
