const productRepository = require('../data/repositories/productRepository');

const searchCatalog = async (query) => productRepository.searchProducts(query);

module.exports = {
  searchCatalog,
};
