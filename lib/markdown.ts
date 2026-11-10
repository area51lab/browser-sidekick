import DOMPurify from 'dompurify';
import { Marked } from 'marked';

const parser = new Marked({ gfm: true, async: false });

const purifier = DOMPurify(window);

purifier.addHook('afterSanitizeAttributes', (node) => {
  if (node.nodeName.toLowerCase() === 'a' && node.hasAttribute('href')) {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

export function renderMarkdown(source: string): string {
  const html = parser.parse(source) as string;
  return purifier.sanitize(html);
}
