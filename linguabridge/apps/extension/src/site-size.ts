export interface SiteSizeEstimate {
  pages: number;
  source: 'sitemap' | 'links';
  complete: boolean;
}

async function readLimited(response: Response, maxBytes = 2_000_000): Promise<string | null> {
  if (!response.ok || Number(response.headers.get('content-length') || 0) > maxBytes) return null;
  if (!response.body) return null;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) { await reader.cancel(); return null; }
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    reader.releaseLock();
  }
}

/** A bounded, same-origin sitemap estimate. It does not crawl or translate unseen pages. */
export async function estimateSitePages(
  pageUrl: string,
  linkedPages: number,
  fetcher: typeof fetch = fetch,
): Promise<SiteSizeEstimate> {
  const page = new URL(pageUrl);
  if (!['http:', 'https:'].includes(page.protocol)) return { pages: linkedPages, source: 'links', complete: false };
  const queue: string[] = [];
  const enqueue = (candidate: string) => {
    try {
      const url = new URL(candidate, page.origin);
      if (url.origin === page.origin && !queue.includes(url.href)) queue.push(url.href);
    } catch { /* Ignore invalid sitemap references. */ }
  };
  try {
    const robots = await fetcher(new URL('/robots.txt', page.origin), { signal: AbortSignal.timeout(3000) });
    const text = await readLimited(robots, 200_000);
    for (const line of text?.split(/\r?\n/) || []) {
      const match = line.match(/^\s*Sitemap:\s*(\S+)/i);
      if (match) enqueue(match[1]);
    }
  } catch { /* Fall back to the usual sitemap path. */ }
  if (queue.length === 0) enqueue('/sitemap.xml');

  const visited = new Set<string>();
  const urls = new Set<string>();
  let complete = true;
  while (queue.length && visited.size < 10 && urls.size < 100_000) {
    const next = queue.shift()!;
    if (visited.has(next)) continue;
    visited.add(next);
    try {
      const response = await fetcher(next, { signal: AbortSignal.timeout(5000) });
      const xml = await readLimited(response);
      if (!xml) { complete = false; continue; }
      const parsed = new DOMParser().parseFromString(xml, 'application/xml');
      if (parsed.querySelector('parsererror')) { complete = false; continue; }
      const root = parsed.documentElement.localName;
      if (root === 'sitemapindex') {
        for (const entry of parsed.getElementsByTagName('sitemap')) {
          const location = entry.getElementsByTagName('loc')[0]?.textContent?.trim();
          if (location) enqueue(location);
        }
      } else if (root === 'urlset') {
        for (const entry of parsed.getElementsByTagName('url')) {
          const location = entry.getElementsByTagName('loc')[0]?.textContent?.trim();
          if (!location) continue;
          try {
            const url = new URL(location);
            if (url.origin === page.origin) urls.add(url.href.split('#')[0]);
          } catch { /* Skip invalid URLs. */ }
        }
      } else { complete = false; }
    } catch { complete = false; }
  }
  if (queue.length || urls.size >= 100_000) complete = false;
  return urls.size > 0
    ? { pages: Math.max(linkedPages, urls.size), source: 'sitemap', complete: complete && linkedPages <= urls.size }
    : { pages: linkedPages, source: 'links', complete: false };
}
