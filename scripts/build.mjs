import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

const shared = {
  stdin: {
    contents: "export const { parse, SyntaxError } = require('./src/bibtex-bibjson.js');",
    resolveDir: root,
    sourcefile: 'bibtex-bibjson.js',
    loader: 'js',
  },
  bundle: true,
  minify: true,
  sourcemap: true,
  platform: 'neutral',
  target: 'es2015',
};

// Output paths match the fields in package.json (main, module, exports, unpkg).
const outputs = [
  { outfile: 'dist/bibtex-bibjson.js', format: 'cjs' },
  { outfile: 'dist/bibtex-bibjson.module.js', format: 'esm' },
  { outfile: 'dist/bibtex-bibjson.modern.js', format: 'esm' },
  { outfile: 'dist/bibtex-bibjson.umd.js', format: 'iife', globalName: 'bibtexBibjson' },
];

await Promise.all(
  outputs.map(({ outfile, ...options }) =>
    build({ ...shared, ...options, outfile: root + outfile }),
  ),
);
