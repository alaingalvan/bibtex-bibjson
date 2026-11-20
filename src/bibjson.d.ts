export interface BibJSONAuthor {
  name: string;
}

export interface BibJSONLink {
  url: string;
}

export interface BibJSONEntry {
  bibtexType: string;
  author?: BibJSONAuthor[];
  link?: BibJSONLink[];
  year?: string | number;
  [field: string]: string | number | BibJSONAuthor[] | BibJSONLink[] | undefined;
}

export interface BibJSON {
  [citationKey: string]: BibJSONEntry;
}
