import type { BibJSON, BibJSONAuthor, BibJSONLink } from './bibjson';

const citationKeyPattern = /^[\p{L}\p{Nl}\p{Nd}\p{Mn}\p{Pc}./()'":;\-]+$/u;
const entryTypePattern = /^[\p{L}\p{Nl}\p{Nd}]+$/u;
const fieldNamePattern = /^[A-Za-z_][A-Za-z0-9_:.\-]*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isAuthor(value: unknown): value is BibJSONAuthor {
  return isRecord(value) &&
    typeof value.name === 'string' &&
    value.name.length > 0 &&
    Object.keys(value).every(key => key === 'name');
}

function isLink(value: unknown): value is BibJSONLink {
  return isRecord(value) &&
    typeof value.url === 'string' &&
    Object.keys(value).every(key => key === 'url');
}

function braced(value: string, escapeSpecial = true): string {
  const open: number[] = [];
  const unmatched = new Set<number>();
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '{') open.push(i);
    if (value[i] === '}') {
      if (open.length) open.pop();
      else unmatched.add(i);
    }
  }
  for (const index of open) unmatched.add(index);
  if (!escapeSpecial && unmatched.size) throw new TypeError('Unbalanced braces in URL');

  const text = escapeSpecial
    ? value.replace(/(\\*)([{}&%$#_])/g, (match, slashes: string, special: string, offset: number) => {
        if (special === '{' || special === '}') {
          if (!unmatched.has(offset + slashes.length)) return match;
          return '\\textbackslash{}'.repeat(slashes.length) +
            (special === '{' ? '\\textbraceleft{}' : '\\textbraceright{}');
        }
        return '\\textbackslash{}'.repeat(slashes.length) + '\\' + special;
      })
    : value;
  return `{${text}}`;
}

function encodeEntry(key: string, entry: unknown): string {
  if (!citationKeyPattern.test(key)) throw new TypeError(`Invalid citation key: ${key}`);
  if (!isRecord(entry)) {
    throw new TypeError(`Invalid entry: ${key}`);
  }
  const type = entry.bibtexType;
  if (typeof type !== 'string' || !entryTypePattern.test(type) || /^(string|comment|preamble)$/i.test(type)) {
    throw new TypeError(`Invalid BibTeX entry type for ${key}`);
  }

  const fields: string[] = [];
  const seen = new Set<string>();
  for (const [name, value] of Object.entries(entry)) {
    if (name === 'bibtexType') continue;
    const field = name === 'link' ? 'url' : name;
    if (!fieldNamePattern.test(field) || seen.has(field.toLowerCase())) {
      throw new TypeError(`Invalid or duplicate field ${name} in ${key}`);
    }
    seen.add(field.toLowerCase());

    let encoded: string;
    if (name === 'author') {
      if (!Array.isArray(value) || !value.every(isAuthor)) {
        throw new TypeError(`Invalid authors in ${key}`);
      }
      encoded = `{${value.map(author => {
        const name = braced(author.name);
        return /,|\s+and\s+/i.test(author.name) ? name : name.slice(1, -1);
      }).join(' and ')}}`;
    } else if (name === 'link') {
      if (!Array.isArray(value) || value.length !== 1 || !isLink(value[0])) {
        throw new TypeError(`Expected exactly one URL in ${key}`);
      }
      encoded = braced(value[0].url, false);
    } else if (typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))) {
      encoded = braced(String(value));
    } else {
      throw new TypeError(`Unsupported value for ${name} in ${key}`);
    }
    fields.push(`  ${field} = ${encoded}`);
  }
  return `@${type}{${key},${fields.length ? '\n' + fields.join(',\n') + '\n' : '\n'}}`;
}

/** Convert the citation-keyed BibJSON produced by parse into BibTeX. */
export function encode(json: BibJSON): string {
  if (!isRecord(json)) {
    throw new TypeError('Expected a citation-keyed BibJSON object');
  }
  return Object.entries(json).map(([key, entry]) => encodeEntry(key, entry)).join('\n\n');
}

