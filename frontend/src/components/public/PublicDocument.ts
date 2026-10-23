// Build-only document composition; every rendered text/attribute is escaped.
export type PublicDocument = {
  title: string; description: string; path: string; indexable: boolean; markup: string;
};
const escape = (value: string) => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]!));
export function publicDocument(template: string, page: PublicDocument) {
  if (template.split('<div id="root"></div>').length !== 2 || template.split('</head>').length !== 2) {
    throw new Error('Unexpected Vite document shape');
  }
  const canonical = page.indexable ? 'https://cornertech.ae' + page.path : '';
  const meta = [
    `<title>${escape(page.title)}</title>`,
    `<meta name="description" content="${escape(page.description)}">`,
    `<meta name="robots" content="${page.indexable ? 'index, follow' : 'noindex, nofollow'}">`,
    `<meta property="og:title" content="${escape(page.title)}">`,
    `<meta property="og:description" content="${escape(page.description)}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="CornerTech AI">',
    '<meta name="twitter:card" content="summary">',
    ...(canonical ? [`<link rel="canonical" href="${escape(canonical)}">`, `<meta property="og:url" content="${escape(canonical)}">`] : []),
  ].join('\n    ');
  return template.replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
    .replace(/<meta\b[^>]*(?:name|property)=["'](?:description|robots|og:[\w:]+|twitter:[\w:]+)["'][^>]*>/gi, '')
    .replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/gi, '')
    .replace('</head>', meta + '\n  </head>')
    .replace('<div id="root"></div>', '<div id="root">' + page.markup + '</div>');
}
