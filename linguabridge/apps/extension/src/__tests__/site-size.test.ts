// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { estimateSitePages } from '../site-size';

describe('same-origin site size estimate', () => {
  it('counts indexed sitemap URLs without fetching their pages', async () => {
    const fetcher = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith('/robots.txt')) return new Response('Sitemap: https://example.com/index.xml');
      if (url.endsWith('/index.xml')) return new Response('<sitemapindex><sitemap><loc>https://example.com/a.xml</loc></sitemap><sitemap><loc>https://example.com/b.xml</loc></sitemap></sitemapindex>');
      if (url.endsWith('/a.xml')) return new Response('<urlset><url><loc>https://example.com/one</loc></url><url><loc>https://example.com/two</loc></url></urlset>');
      if (url.endsWith('/b.xml')) return new Response('<urlset><url><loc>https://example.com/three</loc></url></urlset>');
      throw new Error(`Unexpected URL ${url}`);
    });
    expect(await estimateSitePages('https://example.com/', 1, fetcher as typeof fetch))
      .toEqual({ pages: 3, source: 'sitemap', complete: true });
    expect(fetcher).toHaveBeenCalledTimes(4);
  });

  it('falls back to links when sitemaps are unavailable', async () => {
    const fetcher = vi.fn(async () => new Response('', { status: 404 }));
    expect(await estimateSitePages('https://example.com/', 7, fetcher as typeof fetch))
      .toEqual({ pages: 7, source: 'links', complete: false });
  });

  it('marks a sitemap estimate partial when the page reveals more links', async () => {
    const fetcher = vi.fn(async (input: string | URL | Request) => String(input).endsWith('/robots.txt')
      ? new Response('', { status: 404 })
      : new Response('<urlset><url><loc>https://example.com/one</loc></url></urlset>'));
    expect(await estimateSitePages('https://example.com/', 5, fetcher as typeof fetch))
      .toEqual({ pages: 5, source: 'sitemap', complete: false });
  });
});
