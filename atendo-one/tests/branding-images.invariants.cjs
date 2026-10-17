const fs = require('fs');
const types = fs.readFileSync('src/types/index.ts', 'utf8');
const api = fs.readFileSync('server/api.ts', 'utf8');
const panel = fs.readFileSync('src/components/superadmin/SaaSConfigPanel.tsx', 'utf8');
const context = fs.readFileSync('src/context/SaaSContext.tsx', 'utf8');
for (const value of ['logoImageUrl', 'faviconUrl', 'appIconUrl', 'homeHeroImageUrl']) {
  if (!types.includes(value) || !api.includes(value) || !panel.includes(value)) throw new Error(`BRANDING_IMAGE_FIELD_MISSING:${value}`);
}
if (!api.includes('safePublicUrl(layout.faviconUrl)')) throw new Error('BRANDING_IMAGE_URL_VALIDATION_MISSING');
if (!context.includes('apple-touch-icon')) throw new Error('PWA_ICON_APPLICATION_MISSING');
console.log('BRANDING_IMAGES_INVARIANTS_OK');
