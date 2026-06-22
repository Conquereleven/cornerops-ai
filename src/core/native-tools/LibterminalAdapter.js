class LibterminalAdapter {
  async openStream() {
    return { toolId: 'libterminal', status: 'document_only', message: 'Terminal streaming is disabled pending sandbox policy.' };
  }
}

module.exports = { LibterminalAdapter };
