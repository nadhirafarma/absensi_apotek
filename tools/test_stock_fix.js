const assert = require('assert');

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const scope = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../google-apps-script-api-search-box-final.gs'), 'utf8'), scope);
const { normalizeDataObatStockValue_ } = scope;

assert.strictEqual(normalizeDataObatStockValue_('30/12/1899 14:24:00'), 0);
assert.strictEqual(normalizeDataObatStockValue_('30.12.1899 14:24:00'), 0);
assert.strictEqual(normalizeDataObatStockValue_('1899-12-30T07:17:28.000Z'), 0);
assert.strictEqual(normalizeDataObatStockValue_('30.12'), '30.12');
assert.strictEqual(normalizeDataObatStockValue_(new Date('1899-12-30T14:24:00Z')), 0);
assert.strictEqual(normalizeDataObatStockValue_(1899), 1899);
assert.strictEqual(normalizeDataObatStockValue_('1899'), '1899');
assert.strictEqual(normalizeDataObatStockValue_(10), 10);
assert.strictEqual(normalizeDataObatStockValue_('0'), '0');

console.log('ALL STOCK NORMALIZATION TESTS PASSED');