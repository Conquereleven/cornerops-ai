const trackedFields = [
  'orderId',
  'productName',
  'businessType',
  'businessName',
  'customerName',
  'email',
  'phone',
  'emirate',
  'requestedProducts',
  'estimatedVolume',
];

const productTerms = [
  'Tajín',
  'Valentina',
  'Pulparindo',
  'Chiles secos',
  'Piñatas',
  'Tomatillo',
  'Chamoy',
  'Tortillas',
];

const extractMemoryData = (message = '') => {
  const text = String(message);
  const lower = text.toLocaleLowerCase('es');
  const orderId =
    text.match(/#[a-z0-9-]+/i)?.[0]?.slice(1) ||
    text.match(/(?:orden|pedido|order)\s*(?:n[uú]mero|number|no\.?)?\s*:?\s*([a-z0-9-]{3,})/i)?.[1];
  const email = text.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)?.[0];
  const phone = text.match(/(?:\+971|00971|05)\s?[\d\s-]{7,}/)?.[0]?.trim();
  const emirate = text.match(
    /\b(dubai|abu dhabi|sharjah|ajman|fujairah|ras al khaimah|umm al quwain|al ain)\b/i,
  )?.[0];
  const businessType = text.match(
    /\b(restaurante|restaurant|cafeter[ií]a|cafe|café|tienda|store|supermarket|supermercado|distributor|distribuidor|hotel|catering|horeca)\b/i,
  )?.[0];
  const estimatedVolume = text.match(
    /\b\d+(?:[.,]\d+)?\s*(?:cajas|boxes|cases|unidades|units|kg|kilos|kilograms|pallets|tarimas)(?:\s+(?:al|per)\s+(?:mes|month|semana|week))?\b/i,
  )?.[0];
  const businessName = text.match(
    /(?:negocio|business|empresa|restaurant|restaurante|tienda|store)\s+(?:se llama|name is|es|is)\s+([a-záéíóúñ0-9&' .-]{2,50}?)(?=\s+(?:in|en)\s+[a-záéíóúñ]|,|$)/i,
  )?.[1]?.trim();
  const customerName = text.match(
    /(?:me llamo|mi nombre es|my name is|contacto es|contact is)\s+([a-záéíóúñ' -]{2,50})/i,
  )?.[1]?.trim();
  const requestedProducts = productTerms.filter((product) =>
    lower.includes(product.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '')) ||
    lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(
      product.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
    ),
  );

  return Object.fromEntries(
    Object.entries({
      orderId,
      productName: requestedProducts.length === 1 ? requestedProducts[0] : undefined,
      businessType,
      businessName,
      customerName,
      email,
      phone,
      emirate,
      requestedProducts: requestedProducts.length ? requestedProducts : undefined,
      estimatedVolume,
    }).filter(([, value]) => value !== undefined),
  );
};

const mergeMemory = (base = {}, update = {}) => {
  const merged = { ...base };
  for (const field of trackedFields) {
    if (update[field] !== undefined && update[field] !== null && update[field] !== '') {
      merged[field] = update[field];
    }
  }
  for (const field of ['lastWorker', 'lastIntent', 'intentCategory']) {
    if (update[field]) merged[field] = update[field];
  }
  return merged;
};

const buildMemoryFromMessages = (messages = []) =>
  messages.reduce((memory, message) => {
    const saved = message.metadata?.memorySummary || {};
    const extracted = message.role === 'user'
      ? extractMemoryData(message.content)
      : {};
    return mergeMemory(memory, { ...extracted, ...saved });
  }, {});

module.exports = {
  trackedFields,
  extractMemoryData,
  mergeMemory,
  buildMemoryFromMessages,
};
