import express from 'express';
import { randomUUID } from 'node:crypto';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import fs from 'fs';
import { apiRouter } from './server/api';
import { sanitizeServerHtml } from './server/sanitizeHtml';
import { db } from './server/db';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  const allowedOrigins = new Set(
    (process.env.CORS_ALLOWED_ORIGINS || process.env.APP_URL || 'https://gestor.atendo.log.br')
      .split(',')
      .map(origin => origin.trim().replace(/\/$/, ''))
      .filter(Boolean)
  );
  app.use((req, res, next) => {
    const origin = String(req.headers.origin || '').replace(/\/$/, '');
    if (origin && allowedOrigins.has(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, asaas-access-token');
      res.setHeader('Vary', 'Origin');
    }
    if (req.method === 'OPTIONS') return res.sendStatus(origin && allowedOrigins.has(origin) ? 204 : 403);
    next();
  });
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.setHeader('Content-Security-Policy', "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; script-src 'self' 'sha256-b7b03057e94fe25acc9a10366b6cc21263896dd2ad2eac92946794b1306f9f6e' https://off.atendo.log.br; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https: wss:; frame-src 'self' https://off.atendo.log.br; worker-src 'self' blob:; form-action 'self'");
    const forwardedProto = String(res.req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
    if (forwardedProto === 'https' || res.req.secure) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
  });

  type RateBucket = { count: number; resetAt: number };
  const rateBuckets = new Map<string, RateBucket>();
  const rateWindowMs = 60 * 1000;
  const getRateKey = (req: express.Request) => `${req.ip}:${req.path.startsWith('/api/auth/') ? 'auth' : req.path === '/api/webhooks/asaas' ? 'webhook' : 'api'}`;
  const rateLimit = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const now = Date.now();
    const key = getRateKey(req);
    const isAuth = key.endsWith(':auth');
    const isWebhook = key.endsWith(':webhook');
    const limit = isAuth ? 20 : isWebhook ? 180 : 240;
    const windowMs = isAuth ? 15 * 60 * 1000 : rateWindowMs;
    const current = rateBuckets.get(key);
    if (!current || current.resetAt <= now) rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    else current.count += 1;
    const bucket = rateBuckets.get(key)!;
    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - bucket.count)));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
    if (bucket.count > limit) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      return res.status(429).json({ error: 'Muitas requisições. Aguarde antes de tentar novamente.' });
    }
    next();
  };
  const rateCleanup = setInterval(() => {
    const now = Date.now();
    rateBuckets.forEach((bucket, key) => { if (bucket.resetAt <= now) rateBuckets.delete(key); });
  }, 5 * 60 * 1000);
  rateCleanup.unref();
  app.use(rateLimit);

  // JSON Body Parser with a bounded payload to reduce abuse risk.
  app.use(express.json({ limit: '10mb' }));

  // Wait for persisted state before serving API requests and save mutations after each response.
  app.use('/api', async (req, res, next) => {
    try {
      await db.waitForPersistence();
      res.once('finish', () => {
        void db.persistNow();
      });
      next();
    } catch (error) {
      next(error);
    }
  });

  // Mount API router
  app.use('/api', apiRouter);

  // Health check
    app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      service: 'Portal de Fretes e Motoristas SaaS API',
      timestamp: new Date().toISOString() 
    });
  });
  app.use('/api', (_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

  const cleanAnalyticsValue = (value: unknown, max = 120) => String(Array.isArray(value) ? value[0] || '' : value || '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);
  const trackPublicVisit = (req: express.Request) => {
    if (req.method !== 'GET' || !(req.path === '/' || req.path === '/vitrine-fretes' || req.path.startsWith('/conteudo/') || req.path.startsWith('/elo-log/'))) return;
    const userAgent = cleanAnalyticsValue(req.headers['user-agent'], 300);
    if (/bot|crawler|spider|slurp|headless|facebookexternalhit|preview/i.test(userAgent)) return;
    const rawReferer = cleanAnalyticsValue(req.headers.referer, 500);
    let referrer = '';
    let referrerHost = '';
    try {
      if (rawReferer) {
        const parsed = new URL(rawReferer);
        referrerHost = parsed.hostname.toLowerCase();
        referrer = referrerHost.slice(0, 120);
      }
    } catch {
      referrer = '';
    }
    const utmSource = cleanAnalyticsValue(req.query.utm_source, 80).toLowerCase();
    const utmMedium = cleanAnalyticsValue(req.query.utm_medium, 80).toLowerCase();
    const utmCampaign = cleanAnalyticsValue(req.query.utm_campaign, 120);
    const source = utmSource || (referrerHost.includes('google.') ? 'google' : referrerHost.includes('bing.') ? 'bing' : referrerHost.includes('duckduckgo.') ? 'duckduckgo' : referrer ? 'referral' : 'direct');
    const medium = utmMedium || (['google', 'bing', 'duckduckgo'].includes(source) ? 'organic' : referrer ? 'referral' : 'direct');
    const device = /tablet|ipad/i.test(userAgent) ? 'tablet' : /mobile|iphone|android/i.test(userAgent) ? 'mobile' : 'desktop';
    const countryHeader = Array.isArray(req.headers['cf-ipcountry']) ? req.headers['cf-ipcountry'][0] : req.headers['cf-ipcountry'];
    db.recordVisit({
      date: new Date().toISOString().slice(0, 10),
      path: cleanAnalyticsValue(req.path, 180) || '/',
      source,
      medium,
      campaign: utmCampaign,
      referrer,
      device,
      country: cleanAnalyticsValue(countryHeader, 2).toUpperCase()
    });
  };
  app.use((req, _res, next) => {
    trackPublicVisit(req);
    next();
  });
  // Serve static files if built (avoids 429 dynamic load rate limit issues on complex apps)
  const distPath = path.join(process.cwd(), 'dist');
  const hasDist = fs.existsSync(path.join(distPath, 'index.html'));

  if (process.env.NODE_ENV === 'production' || hasDist) {
    console.log('📦 Serving production-bundled static files from /dist');
    app.use(express.static(distPath, {
      index: false,
      setHeaders: (res, filePath) => {
        const isVersionedAsset = filePath.includes('/assets/') && /-[A-Za-z0-9_-]{6,}\.(?:js|css|map|png|jpe?g|webp|svg|woff2?)$/i.test(filePath);
        res.setHeader('Cache-Control', isVersionedAsset ? 'public, max-age=31536000, immutable' : 'public, max-age=3600');
      }
    }));
    const escapeHtml = (value: unknown) => String(value || '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char));
    const stripUnsafeMarkup = (value: string) => sanitizeServerHtml(value);
    const safeHttpsUrl = (value: unknown, fallback = '') => {
      const candidate = String(value || '').trim();
      if (!candidate) return fallback;
      try {
        const parsed = new URL(candidate);
        return parsed.protocol === 'https:' ? parsed.toString().replace(/\/$/, '') : fallback;
      } catch {
        return fallback;
      }
    };
    const normalizeSeoBrand = (value: string, siteName: string) => String(value || '').replace(/Elo Log|Atendo One/gi, siteName).replace(/\s{2,}/g, ' ').trim();
    const publicSeo = () => ({
      siteName: db.saasGlobalConfig.seo?.siteName || db.saasGlobalConfig.systemName || 'Elo Log',
      title: db.saasGlobalConfig.seo?.title || `${db.saasGlobalConfig.systemName || 'Elo Log'} — Gestão e publicação de fretes`,
      description: db.saasGlobalConfig.seo?.description || 'Plataforma de gestão logística para transportadoras, motoristas e operações de fretes.',
      keywords: db.saasGlobalConfig.seo?.keywords || '',
      canonicalUrl: safeHttpsUrl(db.saasGlobalConfig.seo?.canonicalUrl || process.env.APP_URL, 'https://gestor.atendo.log.br'),
      ogImageUrl: safeHttpsUrl(db.saasGlobalConfig.seo?.ogImageUrl, `${safeHttpsUrl(db.saasGlobalConfig.seo?.canonicalUrl || process.env.APP_URL, 'https://gestor.atendo.log.br')}/og-default.svg`),
      locale: /^[a-z]{2}(?:_[A-Z]{2}|-[A-Z]{2})?$/.test(String(db.saasGlobalConfig.seo?.locale || '')) ? String(db.saasGlobalConfig.seo?.locale) : 'pt_BR',
      allowIndexing: db.saasGlobalConfig.seo?.allowIndexing !== false
    });
    const registrationOnlyContentSlugs = new Set(['termos-de-uso', 'politica-de-privacidade']);
    const isRegistrationOnlySlug = (value: unknown) => registrationOnlyContentSlugs.has(String(value || '').trim().toLowerCase());
    const publicItems = () => [
      ...db.pages.filter(item => item.tenantId === null && item.isPublished && item.isIndexable !== false && !isRegistrationOnlySlug(item.slug)).map(item => ({ ...item, kind: 'page' })),
      ...db.posts.filter(item => item.tenantId === null && item.isPublished && item.isIndexable !== false && !isRegistrationOnlySlug(item.slug)).map(item => ({ ...item, kind: 'post' }))
    ];
    const publicItemBySlug = (slug: string) => publicItems().find(item => item.slug === slug);
    const renderSeoHtml = (req: express.Request) => {
      const seo = publicSeo();
      const isSolutionIndex = req.path === '/elo-log';
      const isContentIndex = req.path === '/conteudo';
      const publicSection = req.path.startsWith('/elo-log') ? 'elo-log' : 'conteudo';
      const slug = req.path.startsWith('/conteudo/') || req.path.startsWith('/elo-log/')
        ? decodeURIComponent(req.path.replace(/^\/(?:conteudo|elo-log)\//, '').split('/')[0])
        : '';
      const item: any = slug ? publicItemBySlug(slug) : null;
      const isShowcase = req.path === '/vitrine-fretes';
      const routeMatchesItem = Boolean(item && (item.publicPath === publicSection || (!item.publicPath && publicSection === 'conteudo')));
      const isKnownPublicRoute = req.path === '/' || isShowcase || isSolutionIndex || isContentIndex || ((req.path.startsWith('/conteudo/') || req.path.startsWith('/elo-log/')) && routeMatchesItem);
      const isNotFound = !isKnownPublicRoute;
      const title = isNotFound ? `Página não encontrada | ${seo.siteName}` : isSolutionIndex ? `Soluções para operações logísticas | ${seo.siteName}` : isContentIndex ? `Conteúdos sobre transporte e gestão de fretes | ${seo.siteName}` : isShowcase ? `Fretes de mercadorias disponíveis | ${seo.siteName}` : normalizeSeoBrand(item?.metaTitle || item?.title || seo.title, seo.siteName);
      const description = isNotFound ? 'A página solicitada não foi encontrada.' : isSolutionIndex ? 'Conheça as soluções do Atendo One para gestão de fretes, transportadoras, motoristas, veículos e viagens.' : isContentIndex ? 'Guias e conteúdos práticos sobre TMS, fretes, motoristas, viagens, checklists e operação logística.' : isShowcase ? 'Encontre fretes de mercadorias publicados por empresas e cadastre-se para demonstrar interesse com segurança.' : item?.metaDescription || item?.excerpt || seo.description;
      const itemPath = item ? (item.publicPath === 'elo-log' ? 'elo-log' : 'conteudo') : publicSection;
      const itemCanonical = safeHttpsUrl(item?.canonicalUrl);
      const canonical = isNotFound ? `${seo.canonicalUrl}/404` : isSolutionIndex ? `${seo.canonicalUrl}/elo-log` : isContentIndex ? `${seo.canonicalUrl}/conteudo` : isShowcase ? `${seo.canonicalUrl}/vitrine-fretes` : itemCanonical || `${seo.canonicalUrl}${slug ? `/${itemPath}/${encodeURIComponent(slug)}` : '/'}`;
      const robots = isNotFound || !seo.allowIndexing || isRegistrationOnlySlug(slug) || (item && item.isIndexable === false) ? 'noindex,nofollow' : 'index,follow';
      const contentHtml = item?.content ? stripUnsafeMarkup(item.content).replace(/^\s*<h1\b[^>]*>[\s\S]*?<\/h1>\s*/i, '') : '';
      const organizationLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${seo.canonicalUrl}/#organization`,
        name: seo.siteName,
        url: `${seo.canonicalUrl}/`,
        description: seo.description
      };
      const websiteLd = {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${seo.canonicalUrl}/#website`,
        name: seo.siteName,
        url: `${seo.canonicalUrl}/`,
        description: seo.description,
        inLanguage: 'pt-BR',
        publisher: { '@id': `${seo.canonicalUrl}/#organization` },
        image: seo.ogImageUrl ? [seo.ogImageUrl] : undefined
      };
      const breadcrumbLd = item ? {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        '@id': `${canonical}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Início', item: `${seo.canonicalUrl}/` },
          { '@type': 'ListItem', position: 2, name: item.publicPath === 'elo-log' ? 'Soluções' : 'Conteúdos', item: `${seo.canonicalUrl}/${item.publicPath === 'elo-log' ? 'elo-log' : 'conteudo'}/${encodeURIComponent(item.slug)}` },
          { '@type': 'ListItem', position: 3, name: item.title, item: canonical }
        ]
      } : undefined;
      const itemLd = item ? {
        '@context': 'https://schema.org',
        '@type': item.kind === 'post' ? 'Article' : 'WebPage',
        '@id': canonical,
        name: item.title,
        headline: item.title,
        description,
        url: canonical,
        inLanguage: 'pt-BR',
        dateModified: item.updatedAt,
        ...(item.publishedAt ? { datePublished: item.publishedAt } : {}),
        image: seo.ogImageUrl ? [seo.ogImageUrl] : undefined,
        author: item.kind === 'post' ? { '@type': 'Person', name: item.author || seo.siteName } : { '@type': 'Organization', name: seo.siteName },
        isPartOf: { '@id': `${seo.canonicalUrl}/#website` }
      } : undefined;
      const jsonLd = isNotFound ? {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': canonical,
        name: title,
        description,
        url: canonical,
        inLanguage: 'pt-BR'
      } : item ? [itemLd, breadcrumbLd] : isSolutionIndex || isContentIndex ? {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': canonical,
        name: title,
        description,
        url: canonical,
        inLanguage: 'pt-BR',
        isPartOf: { '@id': `${seo.canonicalUrl}/#website` }
      } : isShowcase ? {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        '@id': canonical,
        name: title,
        description,
        url: canonical,
        inLanguage: 'pt-BR',
        isPartOf: { '@id': `${seo.canonicalUrl}/#website` }
      } : [websiteLd, organizationLd];
      const indexItems = publicItems().filter(entry => isSolutionIndex ? (entry as any).publicPath === 'elo-log' : (entry as any).publicPath !== 'elo-log');
      const indexLinks = indexItems.map(entry => `<li><a href="/${isSolutionIndex ? 'elo-log' : 'conteudo'}/${encodeURIComponent(entry.slug)}">${escapeHtml(entry.title)}</a></li>`).join('');
      const seoBody = isNotFound ? `<main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p><p><a href="/">Voltar para a página inicial</a></p></main>` : item ? `<main><nav aria-label="Breadcrumb"><a href="/">Início</a> › <a href="/${item.publicPath === 'elo-log' ? 'elo-log' : 'conteudo'}">${item.publicPath === 'elo-log' ? 'Soluções' : 'Conteúdos'}</a> › <span aria-current="page">${escapeHtml(item.title)}</span></nav><article><h1>${escapeHtml(item.title)}</h1>${item.excerpt ? `<p>${escapeHtml(item.excerpt)}</p>` : ''}<div>${contentHtml}</div></article></main>` : isSolutionIndex || isContentIndex ? `<main><nav aria-label="Breadcrumb"><a href="/">Início</a> › <span aria-current="page">${isSolutionIndex ? 'Soluções' : 'Conteúdos'}</span></nav><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p><ul>${indexLinks}</ul></main>` : `<main><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p>${isShowcase ? '<p>Os valores são liberados após cadastro e validação do motorista pela empresa responsável.</p>' : ''}<nav aria-label="Conteúdos públicos"><a href="/vitrine-fretes">Fretes de mercadorias disponíveis</a> · <a href="/conteudo">Conteúdos para transportadoras</a> · <a href="/elo-log">Soluções Atendo One</a></nav></main>`;
      const baseHtml = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8')
        .replace(/<title>[\s\S]*?<\/title>/i, '')
        .replace(/<meta[^>]+(?:name=["'](?:description|keywords|robots)["']|property=["']og:[^"']+["']|name=["']twitter:[^"']+["'])[^>]*>/gi, '')
        .replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, '');
      const headTags = `<meta name="description" content="${escapeHtml(description)}"><meta name="keywords" content="${escapeHtml(item?.keywords || seo.keywords)}"><meta name="robots" content="${robots}"><link rel="canonical" href="${escapeHtml(canonical)}"><meta property="og:type" content="${item?.kind === 'post' ? 'article' : 'website'}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:locale" content="${escapeHtml(seo.locale)}"><meta property="og:image" content="${escapeHtml(seo.ogImageUrl)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}"><meta name="twitter:image" content="${escapeHtml(seo.ogImageUrl)}">${item?.kind === 'post' && item.publishedAt ? `<meta property="article:published_time" content="${escapeHtml(item.publishedAt)}">` : ''}${item?.kind === 'post' ? `<meta property="article:modified_time" content="${escapeHtml(item.updatedAt)}">` : ''}<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\u003c')}</script>`;
      // A home é montada pelo React; o SEO permanece no head e não deve aparecer como fallback visual dentro do root.
      // Páginas públicas de conteúdo continuam com SSR real para preservar indexabilidade e leitura sem JavaScript.
      const initialBody = req.path === '/' ? '' : seoBody;
      return baseHtml.replace('<div id="root"></div>', `<div id="root">${initialBody}</div>`).replace('</head>', `<title>${escapeHtml(title)}</title>${headTags}</head>`);
    };
    app.get('/robots.txt', (req, res) => {
      const seo = publicSeo();
      res.type('text/plain').send(`${seo.allowIndexing ? 'User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /painel/\n' : 'User-agent: *\nDisallow: /\n'}Sitemap: ${seo.canonicalUrl}/sitemap.xml\n`);
    });
    app.get('/sitemap.xml', (req, res) => {
      const seo = publicSeo();
      const toSitemapDate = (value: unknown) => {
        const parsed = new Date(String(value || ''));
        return Number.isNaN(parsed.getTime()) ? '' : `<lastmod>${parsed.toISOString()}</lastmod>`;
      };
      const entries = seo.allowIndexing ? [
        `<url><loc>${escapeHtml(`${seo.canonicalUrl}/`)}</loc></url>`,
        `<url><loc>${escapeHtml(`${seo.canonicalUrl}/vitrine-fretes`)}</loc></url>`,
        ...publicItems().map(item => {
          const section = (item as any).publicPath === 'elo-log' ? 'elo-log' : 'conteudo';
          const itemPath = section === 'elo-log' && item.slug === 'elo-log' ? section : `${section}/${encodeURIComponent(item.slug)}`;
          return `<url><loc>${escapeHtml(`${seo.canonicalUrl}/${itemPath}`)}</loc>${toSitemapDate(item.updatedAt || (item as any).publishedAt || item.createdAt)}</url>`;
        })
      ] : [];
      res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.join('')}</urlset>`);
    });
    app.get('*', (req, res) => {
      const normalizedPath = req.path.replace(/\/+$/, '') || '/';
      const publicPathMatch = normalizedPath.match(/^\/(conteudo|elo-log)\/([^/]+)$/);
      const publicItem = publicPathMatch ? publicItemBySlug(decodeURIComponent(publicPathMatch[2])) : null;
      const publicItemMatchesSection = Boolean(publicItem && ((publicItem as any).publicPath === publicPathMatch?.[1] || (!(publicItem as any).publicPath && publicPathMatch?.[1] === 'conteudo')));
      const isKnownPublic = normalizedPath === '/' || normalizedPath === '/vitrine-fretes' || normalizedPath === '/elo-log' || normalizedPath === '/conteudo' || publicItemMatchesSection;
      res.status(isKnownPublic ? 200 : 404).type('html').send(renderSeoHtml(req));
    });
  } else {
    console.log('⚡ Starting Vite development server middleware');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    const correlationId = String(req.headers['x-request-id'] || `corr-${Date.now()}-${randomUUID().slice(0, 8)}`);
    db.addErrorLog({
      correlationId,
      service: 'elolog-app',
      route: req.path,
      method: req.method,
      statusCode: Number(error?.status || 500),
      event: 'EXPRESS_UNHANDLED_ERROR',
      message: 'Erro interno não tratado na aplicação.'
    });
    if (res.headersSent) return next(error);
    res.status(Number(error?.status || 500)).json({ error: 'Ocorreu um erro interno. Consulte o suporte com o identificador de atendimento.', correlationId });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚚 Portal de Fretes SaaS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
