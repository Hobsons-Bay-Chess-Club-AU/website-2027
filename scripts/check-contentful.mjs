import { loadEnv } from './env.mjs';

const env = loadEnv();
const status = { checkedAt: new Date().toISOString(), environment: env.environment, managementTokenPresent: Boolean(env.managementToken), apis: {} };
for (const [name, host, token] of [
  ['delivery', 'cdn.contentful.com', env.deliveryToken],
  ['preview', 'preview.contentful.com', env.previewToken],
]) {
  if (!env.space || !token) { status.apis[name] = { configured: false }; continue; }
  try {
    const base = `https://${host}/spaces/${encodeURIComponent(env.space)}/environments/${encodeURIComponent(env.environment)}`;
    const resources = await Promise.all(['entries', 'content_types', 'assets'].map(async (resource) => {
      const response = await fetch(`${base}/${resource}?limit=1`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(15000) });
      const body = await response.json();
      return [resource, { status: response.status, total: body.total, error: body.sys?.id }];
    }));
    status.apis[name] = Object.fromEntries(resources);
  } catch { status.apis[name] = { error: 'Network request failed' }; }
}
if (env.space && env.managementToken) {
  try {
    const url = 'https://api.contentful.com/spaces/' + encodeURIComponent(env.space) + '/environments/' + encodeURIComponent(env.environment) + '/locales';
    const response = await fetch(url, { headers: { Authorization: 'Bearer ' + env.managementToken }, signal: AbortSignal.timeout(15000) });
    const body = await response.json();
    status.apis.management = { status: response.status, spaceAccessAuthorized: response.ok,
      defaultLocale: body.items?.find(locale => locale.default)?.code,
      error: response.ok ? undefined : body.sys?.id,
      authorizationRequired: body.sys?.id === 'OrganizationAccessGrantRequired' || undefined };
  } catch { status.apis.management = { error: 'Network request failed' }; }
}
console.log(JSON.stringify(status, null, 2));
if (Object.values(status.apis).some((api) => api.error || api.status >= 400 || api.entries?.status >= 400)) process.exitCode = 1;
