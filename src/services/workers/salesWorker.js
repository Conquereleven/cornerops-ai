const { generateWorkerReply } = require('../aiResponseService');
const { searchCatalog } = require('../catalogSearchService');
const {
  listAvailableProducts,
} = require('../../data/repositories/productRepository');

const handle = async ({ message, language = 'es' }) => {
  let products = await searchCatalog(message);
  if (!products.length && /cat[aá]logo|productos|products/i.test(message)) {
    products = (await listAvailableProducts()).slice(0, 5);
  }
  if (!products.length) {
    return {
      reply:
        language === 'en'
          ? 'I could not identify a specific product. Share its name, category, or SKU and I will check the Cornermex catalog.'
          : 'No encontré un producto específico. Dime el nombre, categoría o SKU y revisaré el catálogo de Cornermex.',
      metadata: { products: [], requiresHuman: false },
    };
  }
  const product = products[0];
  const priceText = product.priceAED === null || product.priceAED === undefined
    ? (
      language === 'en'
        ? 'Price is confirmed through a quotation.'
        : 'El precio se confirma mediante cotización.'
    )
    : (
      language === 'en'
        ? `Price: ${product.priceAED} AED.`
        : `Precio: ${product.priceAED} AED.`
    );
  const fallbackReply = language === 'en'
    ? `${product.name} is ${product.available === false ? 'not currently available' : 'available'}. ${priceText} Current stock: ${product.stock} units.${product.b2bAvailable ? ' It is also available for B2B orders.' : ''}`
    : `${product.name} ${product.available === false ? 'no está disponible actualmente' : 'está disponible'}. ${priceText} Stock actual: ${product.stock} unidades.${product.b2bAvailable ? ' También está disponible para pedidos B2B.' : ''}`;

  const facts = {
    products: products.map(
      ({ sku, name, priceAED, stock, b2bAvailable, available }) => ({
        sku,
        name,
        priceAED,
        stock,
        b2bAvailable,
        available: available !== false && stock > 0,
      }),
    ),
  };
  const reply = await generateWorkerReply({
    worker: 'sales worker',
    message,
    facts,
    instructions: 'Recommend only products listed in VERIFIED_FACTS.',
    fallbackReply,
  });
  return {
    reply,
    metadata: {
      ...facts,
      requiresHuman: false,
      memoryData: { productName: product.name },
    },
  };
};

module.exports = {
  handle,
};
