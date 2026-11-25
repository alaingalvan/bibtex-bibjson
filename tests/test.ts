import { readFileSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';
import test from 'ava';

const { parse } = createRequire(import.meta.url)('../src/bibtex-bibjson.js');
const { encode } = createRequire(import.meta.url)('../src/encode.ts');

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

test('encode round-trips the parsed fixture', (t) => {
  const input = readFileSync(join(import.meta.dirname, 'input.bib'), 'utf8');
  const json = parse(input);

  t.deepEqual(parse(encode(json)), json);
});

test('encode handles authors, special characters, links and multiple entries', (t) => {
  const json = {
    'paper:2024': {
      bibtexType: 'article',
      author: [{ name: 'Research and Development' }, { name: 'Doe, Jane' }],
      title: 'Cost & benefit: 50% of $5 #1_a',
      year: 2024,
      link: [{ url: 'https://example.com/a_b?x=1&y=2' }],
      note: '\\httpsAddr{//example.com/a_b}',
    },
    empty: { bibtexType: 'misc' },
  };

  t.deepEqual(parse(encode(json)), json);
  t.is(encode({}), '');
});

test('encode preserves an empty author produced by parse', (t) => {
  const json = parse('@misc{empty, author = {}}');

  t.deepEqual(parse(encode(json)), json);
});

test('encode keeps personal names ungrouped while protecting literal names', (t) => {
  const json = {
    key: {
      bibtexType: 'article',
      author: [{ name: 'Jane Doe' }, { name: 'Research and Development' }],
    },
  };
  const bibtex = encode(json);

  t.regex(bibtex, /author = \{Jane Doe and \{Research and Development\}\}/);
  t.deepEqual(parse(bibtex), json);
});

test('encode preserves backslashes preceding TeX special characters', (t) => {
  const json = {
    key: {
      bibtexType: 'article',
      author: [{ name: 'Jane \\& Doe' }],
      title: '\\& \\% \\$ \\# \\_ \\\\&',
    },
  };
  const bibtex = encode(json);

  t.regex(bibtex, /\\textbackslash\{\}\\&/);
  t.deepEqual(parse(bibtex), json);
  const parsed = parse('@misc{key, note = {\\\\& and \\\\%}}');
  t.deepEqual(parse(encode(parsed)), parsed);
});

test('encode preserves unmatched escaped braces produced by parse', (t) => {
  const parsed = parse('@misc{key, title={left \\{example}}, note={{right\\}}}');

  t.deepEqual(parsed, {
    key: { bibtexType: 'misc', title: 'left \\{example', note: 'right\\}' },
  });
  t.deepEqual(parse(encode(parsed)), parsed);
});

test('encode rejects invalid or unrepresentable data', (t) => {
  for (const json of [
    { 'bad key': { bibtexType: 'article' } },
    { key: { bibtexType: 'comment' } },
    { key: { bibtexType: 'article', link: [{ url: 'unbalanced {' }] } },
    { key: { bibtexType: 'article', author: [{ name: 'Jane', email: 'jane@example.com' }] } },
    { key: { bibtexType: 'article', link: [{ url: 'a' }, { url: 'b' }] } },
    { key: { bibtexType: 'article', link: [{ url: 'a' }], url: 'b' } },
    { key: { bibtexType: 'article', tags: ['a', 'b'] } },
  ]) {
    t.throws(() => encode(json), { instanceOf: TypeError });
  }
});
