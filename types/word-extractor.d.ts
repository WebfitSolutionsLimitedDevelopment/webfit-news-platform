declare module 'word-extractor' {
  type TextboxOptions = { includeHeadersAndFooters?: boolean; includeBody?: boolean };
  class ExtractedDocument {
    getBody(): string;
    getFootnotes(): string;
    getFooters(): string;
    getAnnotations(): string;
    getTextboxes(options?: TextboxOptions): string;
  }
  export default class WordExtractor {
    extract(source: string | Buffer): Promise<ExtractedDocument>;
  }
}
