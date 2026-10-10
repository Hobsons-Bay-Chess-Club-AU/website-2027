import sanitizeHtml from 'sanitize-html';

export function safeUrl(value, fallback = '#') {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  const url = value.trim();
  if (/[\u0000-\u001f\u007f\\]/.test(url)) return fallback;
  const encodeQuotes = value => value.replace(/'/g,'%27').replace(/"/g,'%22');
  if (url.startsWith('/') && !url.startsWith('//')) {
    try { const parsed = new URL(url,'https://hbcc-url.invalid'); return encodeQuotes(parsed.pathname+parsed.search+parsed.hash); } catch { return fallback; }
  }
  if (url.startsWith('#')) return encodeQuotes(url);
  try {
    const parsed = new URL(url);
    if (['https:', 'mailto:', 'tel:'].includes(parsed.protocol)) return encodeQuotes(parsed.href);
  } catch {}
  return fallback;
}

export function cleanHtml(html) {
  return sanitizeHtml(String(html || ''), {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'details', 'summary', 'section', 'article', 'header', 'footer', 'figure', 'figcaption', 'iframe'],
    allowedAttributes: {
      '*': ['class', 'id', 'title', 'tabindex', 'role', 'aria-label'],
      a: ['href', 'target', 'rel', 'class', 'title'],
      img: ['src', 'alt', 'width', 'height', 'loading', 'decoding', 'class'],
      iframe: ['src', 'title', 'loading', 'referrerpolicy', 'class', 'allowfullscreen'],
      th: ['colspan', 'rowspan', 'scope'], td: ['colspan', 'rowspan'],
    },
    allowedSchemes: ['https', 'mailto', 'tel'],
    allowProtocolRelative: false,
    allowedIframeHostnames: ['docs.google.com', 'www.google.com', 'www.youtube.com', 'www.youtube-nocookie.com'],
    transformTags: {
      h1: 'h2',
      a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, href: safeUrl(attribs.href), ...(attribs.target === '_blank' ? { rel: 'noopener noreferrer' } : {}) } }),
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, src: safeUrl(attribs.src, ''), alt: /^https?:/.test(attribs.alt || '') ? '' : attribs.alt || '', loading: 'lazy', decoding: 'async' } }),
      iframe: (tagName, attribs) => ({ tagName, attribs: { ...attribs, title: attribs.title || 'Club information', loading: 'lazy', referrerpolicy: 'no-referrer-when-downgrade' } }),
    },
    exclusiveFilter: (frame) => frame.tag === 'img' && !frame.attribs.src,
  });
}
