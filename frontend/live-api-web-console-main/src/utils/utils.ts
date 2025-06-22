import { marked } from 'marked';

export async function highlightTagsWithMarkdownSupport(text: string, tags: string[]): Promise<string> {
  if (!text || tags.length === 0) {
    const parsedText = await marked.parse(text || '');
    return parsedText;
  }

  const escapedTags = tags.map(tag => tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`\\b(${escapedTags.join('|')})\\b`, 'gi');

  const textWithHighlights = text.replace(regex, match => `<span class="highlighted">${match}</span>`);

  return marked.parse(textWithHighlights);
}

