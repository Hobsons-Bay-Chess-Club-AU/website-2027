import { existsSync } from 'node:fs';

export function loadEnv() {
  if (existsSync('.env')) process.loadEnvFile('.env');
  return {
    space: process.env.CONTENTFUL_SPACE_ID || process.env.CONTENTFUL_SPACEID,
    environment: process.env.CONTENTFUL_ENVIRONMENT || 'master',
    deliveryToken: process.env.CONTENTFUL_DELIVERY_TOKEN || process.env.CONTENTFUL_DELIVERY_API,
    previewToken: process.env.CONTENTFUL_PREVIEW_TOKEN || process.env.CONTENTFUL_PREVIEW_API,
    managementToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN,
  };
}
