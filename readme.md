# BibTex-BibJson

[![Npm Package][npm-img]][npm-url]
[![License][license-img]][license-url]
[![Unit Tests][actions-img]][actions-url]

## Installation

```bash
npm i bibtex-bibjson -S
```

A tool to convert BibTeX citations to and from [BibJSON](http://okfnlabs.org/bibjson/).

## Demo

Check out our [Demo](https://codepen.io/alaingalvan/pen/agjaLo) to try it out for yourself!

## Usage

```ts
import { readFileSync } from 'fs';
import { parse, encode, type BibJSON } from 'bibtex-bibjson';

const bibTexStr = readFileSync('./citations.bib', 'utf8');

const bibJson: BibJSON = parse(bibTexStr);
const bibTex: string = encode(bibJson);
```

## API

- `parse(bibTexStr: string): BibJSON` converts a BibTeX string into a
  citation-keyed BibJSON object.

- `encode(bibJson: BibJSON): string` converts that object back into a BibTeX
  string.

## Example

`parse` turns the BibTeX entry below into the BibJSON object shown after it.

```bib
@article{hasselgren2020,
    author = {Hasselgren, Jon and Munkberg, J. and Salvi, Marco and Patney, A. and Lefohn, Aaron},
    year = {2020},
    title = {Neural Temporal Adaptive Sampling and Denoising},
    journal = {Computer Graphics Forum}
}
```

Becomes:

```json
{
  "hasselgren2020": {
    "bibtexType": "article",
    "author": [
      { "name": "Jon Hasselgren" },
      { "name": "J. Munkberg" },
      { "name": "Marco Salvi" },
      { "name": "A. Patney" },
      { "name": "Aaron Lefohn" }
    ],
    "year": 2020,
    "title": "Neural Temporal Adaptive Sampling and Denoising",
    "journal": "Computer Graphics Forum"
  }
}
```

## License

bibtex-bibjson is licensed as either **MIT** or **Apache-2.0**, whichever you would prefer.

[license-img]: https://img.shields.io/:license-mit-blue.svg?style=flat-square
[license-url]: https://opensource.org/licenses/MIT

[npm-img]: https://img.shields.io/npm/v/bibtex-bibjson.svg?style=flat-square
[npm-url]: http://npm.im/bibtex-bibjson

[actions-img]: https://img.shields.io/github/actions/workflow/status/alaingalvan/bibtex-bibjson/test.yml?style=flat-square
[actions-url]: https://github.com/alaingalvan/bibtex-bibjson/actions/
