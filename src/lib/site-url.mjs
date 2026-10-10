import {safeUrl} from './sanitize.mjs';

export function normalizeBase(value = '/') {
  if (!value || value === '/') return '/';
  const path = '/' + String(value).replace(/^\/+|\/+$/g, '');
  if (!/^\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+$/.test(path)) {
    throw new Error('SITE_BASE_PATH must be a URL path such as /website-2027/.');
  }
  return path + '/';
}

// Apply once to CMS/root paths; external services and fragment links stay intact.
export function withBase(value, base = '/') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) return value;
  return normalizeBase(base).slice(0, -1) + value;
}

export function siteUrl(value, fallback = '#') {
  return withBase(safeUrl(value, fallback), import.meta.env?.BASE_URL || '/');
}
