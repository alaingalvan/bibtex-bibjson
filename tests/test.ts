import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
import test from 'ava';

const { parse } = createRequire(import.meta.url)('../src/bibtex-bibjson.js');

// Deep equality check of parsed bibtex with reference json.
test('Test Example', (t) => {
  var input = readFileSync(join(import.meta.dirname, 'input.bib')).toString();

  var compiled = parse(input);

  //writeFileSync('tests/out.json', JSON.stringify(compiled));

  var outFile = JSON.parse(
    readFileSync(join(import.meta.dirname, 'out.json')).toString()
  );

  t.deepEqual(compiled, outFile);
});
