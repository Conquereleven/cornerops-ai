const inventory = require('../scripts/api-route-inventory');

test('committed route matrix matches actual mounted endpoints and middleware', () => {
  expect(inventory).toEqual(require('../docs/security/ct-web-sec-01-routes.json'));
  expect(inventory.routes.every(r=>['PUBLIC','INTERNAL','PROVIDER_CALLBACK','PRIVATE_DISABLED'].includes(r.category))).toBe(true);
});

