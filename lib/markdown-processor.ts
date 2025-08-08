import sanitizeHtml from 'sanitize-html';
import MarkdownIt from 'markdown-it';

// Configure markdown-it with therapeutic-friendly settings
const md = new MarkdownIt({
  html: false,        // Disable raw HTML for security
  breaks: true,       // Convert line breaks to <br>
  linkify: true,      // Auto-convert URLs to links
  typographer: false  // Disable smart quotes/dashes for cleaner output
});

/**
 * Simplified markdown processor using markdown-it + sanitize-html
 * Generates standard HTML elements and relies on CSS classes for styling
 */
export function processMarkdown(text: string, _isUser: boolean = false): string {
  if (!text) return '';

  // Convert markdown to HTML using markdown-it
  let html: string;
  try {
    html = md.render(text);
  } catch (error) {
    console.warn('Markdown parsing failed:', error);
    html = `<p>${text}</p>`;
  }

  // Sanitize HTML for security only - no styling logic
  const sanitizedHtml = sanitizeHtml(html, {
    allowedTags: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 's',
      'ul', 'ol', 'li',  // Standard list elements
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'hr', 'blockquote', 'code', 'pre',
      'a' // Allow links
    ],
    allowedAttributes: {
      'a': ['href', 'title', 'target', 'rel']
    },
    // Clean HTML output - no classes added by sanitizer
    allowedClasses: {},
    transformTags: {
      // Only security-related transforms
      'a': function(tagName, attribs) {
        attribs.target = '_blank';
        attribs.rel = 'noopener noreferrer';
        return { tagName, attribs };
      }
    }
  });
  
  return sanitizedHtml;
}