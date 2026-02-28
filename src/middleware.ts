import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

function parseAllowed(str?: string | null): string[] {
  return (str || "")
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

/** [CISO S1] Inject security response headers on every response */
function setSecurityHeaders(res: NextResponse): void {
  // Prevent clickjacking
  res.headers.set('X-Frame-Options', 'DENY')
  // Prevent MIME-type sniffing
  res.headers.set('X-Content-Type-Options', 'nosniff')
  // Enforce HTTPS (1 year, include subdomains)
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  // Control referrer leakage
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  // Prevent XSS in older browsers
  res.headers.set('X-XSS-Protection', '1; mode=block')
  // Restrict permissions
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  // Content Security Policy — strict but functional
  res.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://vercel.live",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https: wss: https://vercel.live",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "frame-src 'self' https://vercel.live",
  ].join('; '))
}

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const isApi = url.pathname.startsWith('/api/')
  const isAuthApi = url.pathname.startsWith('/api/auth')
  const origin = req.headers.get('origin') || ''
  const allowed = parseAllowed(process.env.ALLOWED_ORIGINS)

  // Enforce body size for API routes using Content-Length header
  if (isApi && req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    const len = req.headers.get('content-length')
    const maxKb = Number(process.env.MAX_JSON_BODY_KB ?? 512)
    if (len && Number(len) > maxKb * 1024) {
      return new NextResponse('Payload Too Large', { status: 413 })
    }
  }

  // [CISO S5] Strict Origin Validation
  const originHeader = req.headers.get('origin')
  const refererHeader = req.headers.get('referer')
  const host = req.headers.get('host')
  const protocol = req.nextUrl.protocol
  const selfOrigin = `${protocol}//${host}`

  // Automatically allow Vercel dynamic URLs (previews, dev branches)
  const isVercelDomain = host?.endsWith('.vercel.app')
  const isAllowedVercelOrigin = originHeader?.endsWith('.vercel.app')

  const isSameOrigin = originHeader
    ? originHeader === selfOrigin
    : refererHeader?.startsWith(selfOrigin)

  const isAllowedOrigin = (originHeader && allowed.includes(originHeader)) || (isVercelDomain && isAllowedVercelOrigin)

  // If validations are required (API route + ALLOWED_ORIGINS set)
  // We allow if:
  // 1. It's an Auth API (existing exception)
  // 2. ALLOWED_ORIGINS is empty (open mode)
  // 3. Origin is explicitly allowed (or it's a trusted Vercel preview)
  // 4. Request is same-origin (verified by Origin or Referer)
  const isAllowed = isAuthApi || !isApi || allowed.length === 0 || isAllowedOrigin || isSameOrigin

  // Handle CORS preflight for API routes
  if (isApi && req.method === 'OPTIONS') {
    if (!isAllowed) return new NextResponse('Forbidden', { status: 403 })
    const res = new NextResponse(null, { status: 204 })
    res.headers.set('Access-Control-Allow-Origin', originHeader || selfOrigin)
    res.headers.set('Vary', 'Origin')

    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', req.headers.get('access-control-request-headers') || 'Content-Type,Authorization')
    res.headers.set('Access-Control-Allow-Credentials', 'true')
    setSecurityHeaders(res)
    return res
  }

  if (isApi && !isAllowed) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Check authentication for protected routes (exclude public paths)
  const isPublicPath = url.pathname.startsWith('/sign-in') ||
    url.pathname.startsWith('/sign-up') ||
    url.pathname.startsWith('/landing') ||
    url.pathname.startsWith('/api/auth') ||
    url.pathname === '/' // Allow root path for now

  if (!isPublicPath && process.env.NEXTAUTH_SECRET) {
    try {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

      if (!token) {
        if (!isApi) {
          return NextResponse.redirect(new URL('/sign-in', req.url))
        }
        return new NextResponse('Unauthorized', { status: 401 })
      }
    } catch (error) {
      // [CISO S4] Fail-closed: deny access on auth errors instead of allowing through
      console.error('[Security] Auth middleware error — denying access:', error)
      if (!isApi) {
        return NextResponse.redirect(new URL('/sign-in', req.url))
      }
      return new NextResponse('Authentication Error', { status: 401 })
    }
  }

  // Set CORS + Security headers for all responses
  const res = NextResponse.next()
  setSecurityHeaders(res)
  if (isApi && isAllowed) {
    res.headers.set('Access-Control-Allow-Origin', origin)
    res.headers.set('Vary', 'Origin')
    res.headers.set('Access-Control-Allow-Credentials', 'true')
  }
  return res
}

export const config = {
  matcher: [
    "/((?!_next|.*\\..*|api/webhooks|sign-in|sign-up|landing).*)", // protected routes
    "/(api|trpc)(.*)", // always protect APIs
  ],
}
