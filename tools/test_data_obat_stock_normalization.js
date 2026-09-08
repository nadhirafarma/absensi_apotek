const fs = require('fs');
const vm = require('vm');

const scope = {};
vm.createContext(scope);
vm.runInContext(fs.readFileSync('tools/gas-a/Kode.js', 'utf8'), scope);

const cases = [
  { name: 'empty string', input: '', want: 0 },
  { name: 'null', input: null, want: 0 },
  { name: 'date string 30/12/1899', input: '30/12/1899 14:24:00', want: 0 },
  { name: 'date object 1899', input: new Date(1899, 11, 30, 14, 24, 0), want: 0 },
  { name: 'numeric stock 1899', input: 1899, want: 1899 },
  { name: 'string stock 1899', input: '1899', want: '1899' },
  { name: 'numeric decimal stock', input: 30.12, want: 30.12 },
  { name: 'string decimal stock', input: '30.12', want: '30.12' }
];

for (const tc of cases) {
  const got = scope.normalizeDataObatStockValue_(tc.input);
  if (got !== tc.want) {
    throw new Error(`Test failed for [${tc.name}]: expected ${tc.want}, got ${got}`);
  }
}

console.log('ALL_PASS: normalizeDataObatStockValue_ working as expected');