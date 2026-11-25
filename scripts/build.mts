import { build, type BuildOptions } from 'esbuild';
import { copyFile, appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

const shared: BuildOptions = {
  stdin: {
    contents: "import { parse, SyntaxError } from './src/bibtex-bibjson.js'; import { encode } from './src/encode.ts'; export { parse, SyntaxError, encode };",
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

interface Output extends BuildOptions {
  outfile: string;
}

// Output paths match the fields in package.json (main, module, exports, unpkg).
const outputs: Output[] = [
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

await copyFile(root + 'src/bibjson.d.ts', root + 'dist/bibjson.d.ts');
await appendFile(root + 'dist/bibtex-bibjson.d.ts', [
  "\nexport type { BibJSON, BibJSONEntry, BibJSONAuthor, BibJSONLink } from './bibjson';",
  "export declare function encode(json: import('./bibjson').BibJSON): string;\n",
].join('\n'));
