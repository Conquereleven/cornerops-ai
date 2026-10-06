// Regenerates docs/security/api-route-inventory-v1.md from the mounted routes.
// Usage: node scripts/generate-route-inventory.js [--check]
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const fs = require('fs');
const path = require('path');
const app = require('../src/app');
const { buildInventory, renderInventoryTable } = require('../src/api/routeInventory');

const target = path.join(__dirname, '../docs/security/api-route-inventory-v1.md');
const START = '<!-- inventory:start -->';
const END = '<!-- inventory:end -->';

const render = () => {
  const inventory = buildInventory(app);
  const current = fs.readFileSync(target, 'utf8');
  const head = current.slice(0, current.indexOf(START) + START.length);
  const tail = current.slice(current.indexOf(END));
  return `${head}\n\nTotal routes: ${inventory.length}\n\n${renderInventoryTable(inventory)}\n${tail}`;
};

if (require.main === module) {
  const next = render();
  if (process.argv.includes('--check')) {
    if (next !== fs.readFileSync(target, 'utf8')) {
      console.error('api-route-inventory-v1.md is stale. Run: npm run security:route-inventory');
      process.exit(1);
    }
    console.log('Route inventory is up to date.');
  } else {
    fs.writeFileSync(target, next);
    console.log('Route inventory written.');
  }
}

module.exports = { render, target };
