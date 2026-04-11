import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.ad2vo.com'
  
  const routes = [
    '',
    '/analysis',
    '/solutions',
    '/pricing',
    '/about',
    '/contact',
    '/blog',
    '/faq',
    '/terms',
    '/privacy',
    '/roadmap',
  ].map((route) => ({
    url: route === '' ? `${baseUrl}/` : `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }))
 
  return [...routes]
}
