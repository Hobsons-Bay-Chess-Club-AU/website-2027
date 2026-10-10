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
console.log(JSON.stringify(status, null, 2));
if (Object.values(status.apis).some((api) => api.error || api.entries?.status >= 400)) process.exitCode = 1;
