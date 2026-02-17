import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/api/',
                '/projects/',
                '/services/',
                '/settings/',
                '/profile/',
                '/stacks/',
                '/orchestration/',
                '/governance/',
                '/observability/',
            ],
        },
        sitemap: 'https://sarge.app/sitemap.xml',
    }
}
