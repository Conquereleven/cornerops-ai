class QuoteRepository {
  constructor({ adapter, normalizer }) {
    this.adapter = adapter;
    this.normalizer = normalizer;
  }

  async listQuotes(filters = {}) {
    return this.adapter.listQuotes()
      .filter((quote) => !filters.status || quote.status === filters.status)
      .map((quote) => this.normalizer.normalizeQuote(quote));
  }

  async getQuoteById(id) {
    const quotes = await this.listQuotes();
    return quotes.find((quote) => quote.id === id || quote.quoteNumber === id) || null;
  }

  async findQuotesNeedingFollowUp() {
    const quotes = await this.listQuotes();
    return quotes.filter((quote) =>
      ['sent', 'viewed', 'follow_up_needed', 'expired'].includes(quote.status));
  }
}

module.exports = {
  QuoteRepository,
};
