const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const snippetFor = (text, query) => {
  const cleanText = String(text || '');
  const index = normalizeText(cleanText).indexOf(normalizeText(query).split(/\s+/)[0] || '');
  if (index < 0) return cleanText.slice(0, 180);
  return cleanText.slice(Math.max(0, index - 60), index + 180);
};

class LocalArchiveSearchIndex {
  search(records = [], query = '') {
    const terms = normalizeText(query).split(/\s+/).filter(Boolean);
    if (!terms.length) return [];
    return records
      .map((record) => {
        const haystack = normalizeText([
          record.title,
          record.text,
          record.tags?.join(' '),
          record.entities?.join(' '),
        ].filter(Boolean).join(' '));
        const hits = terms.filter((term) => haystack.includes(term)).length;
        return {
          record,
          score: hits / terms.length,
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ record, score }) => ({
        recordId: record.id,
        sourceId: record.sourceId,
        title: record.title,
        snippet: snippetFor(record.text, query),
        score: Number(score.toFixed(3)),
        piiLevel: record.piiLevel,
        provenance: record.provenance,
      }));
  }
}

module.exports = {
  LocalArchiveSearchIndex,
  normalizeText,
};
