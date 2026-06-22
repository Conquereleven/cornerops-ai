class ProxylineAdapter {
  async planRoute() {
    return { toolId: 'proxyline', status: 'document_only', message: 'Proxy routing is documented only in v0.2.' };
  }
}

module.exports = { ProxylineAdapter };
