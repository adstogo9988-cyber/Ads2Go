import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/auth/', '/api/scans/'],
    },
    sitemap: 'https://www.ad2vo.com/sitemap.xml',
  }
}
