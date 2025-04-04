// Markdown 변환 구현
import Turndown from 'turndown';
import { ContentFormatter } from '../port/content-formatter';

export class MarkdownFormatter implements ContentFormatter {
  private turndown: Turndown;
  
  constructor() {
    this.turndown = new Turndown({
      headingStyle: 'atx',
      hr: '---',
      bulletListMarker: '-',
    });
  }
  
  format(content: string): string {
    return this.turndown.turndown(content);
  }
}