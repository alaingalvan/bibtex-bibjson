import { readFileSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
import test from 'ava';

const { parse } = createRequire(import.meta.url)('../src/bibtex-bibjson.js');

// Snapshot of the parsed fixture. Refresh with: npm test -- --update-snapshots
test('Test Example', (t) => {
  var input = readFileSync(join(import.meta.dirname, 'input.bib')).toString();

  t.snapshot(parse(input));
});

test('Nested braces, LaTeX accents and escapes in fields, and multiline values', (t) => {
  var compiled = parse(`@misc{nested,
  title = {"{RDNA3}" {Instruction} Guide},
  note = {see \\httpsAddr{//example.com/a_b?x=1&y=2}},
  editor = {M. G\\"{o}bel and Taylor \\& Francis},
  abstract = {First line
    second line}
}`);

  t.deepEqual(compiled, {
    nested: {
      bibtexType: 'misc',
      title: '"RDNA3" Instruction Guide',
      note: 'see \\httpsAddr{//example.com/a_b?x=1&y=2}',
      editor: 'M. Göbel and Taylor & Francis',
      abstract: 'First line\n    second line'
    }
  });
});

test('@string macros, # concatenation, and bare values', (t) => {
  var compiled = parse(`@STRING{jn = "Journal of Tests"}
@article(key1,
  journal = jn # " Letters",
  month = aug,
  volume = 36,
  pages = {15–19},
  title = {Taylor \\& Francis: A Study; Part~1 + \\$5},
)`);

  t.deepEqual(compiled, {
    key1: {
      bibtexType: 'article',
      journal: 'Journal of Tests Letters',
      month: 'aug',
      volume: '36',
      pages: '15–19',
      title: 'Taylor & Francis: A Study; Part~1 + $5'
    }
  });
});

test('@comment, @preamble, and % lines are skipped; quoted values keep escapes', (t) => {
  var compiled = parse(`% ignored @note
@comment{ignored @article{ghost, title={x}} }
@preamble{"\\newcommand{\\x}{y}"}
@book{b1, title = "Quoted \\"title\\"", abstract = {“curly” quotes}, year = 2001}`);

  t.deepEqual(compiled, {
    b1: {
      bibtexType: 'book',
      title: 'Quoted \\"title\\"',
      abstract: '“curly” quotes',
      year: 2001
    }
  });
});

test('Authors handle LaTeX escapes, Last, First, mixed lists, and line breaks', (t) => {
  var compiled = parse(`@article{a1,
  author = {M\\"{u}ller, Thomas and Nov\\'{a}k, Jan
    and Keller, Alexander},
}
@article{a2, author = {Rodolfo Sabino, Creto Vidal, Joaquim Cavalcante-Neto and José Maia}}`);

  t.deepEqual(compiled, {
    a1: {
      bibtexType: 'article',
      author: [
        { name: 'Thomas Müller' },
        { name: 'Jan Novák' },
        { name: 'Alexander Keller' }
      ]
    },
    a2: {
      bibtexType: 'article',
      author: [
        { name: 'Rodolfo Sabino' },
        { name: 'Creto Vidal' },
        { name: 'Joaquim Cavalcante-Neto' },
        { name: 'José Maia' }
      ]
    }
  });
});
