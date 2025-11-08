import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

function parseAllowed(str?: string | null): string[] {
  return (str || "")
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const isApi = url.pathname.startsWith('/api/')
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

  const isAllowed = !isApi || allowed.length === 0 || allowed.includes(origin)

  // Handle CORS preflight for API routes
  if (isApi && req.method === 'OPTIONS') {
    if (!isAllowed) return new NextResponse('Forbidden', { status: 403 })
    const res = new NextResponse(null, { status: 204 })
    res.headers.set('Access-Control-Allow-Origin', origin)
    res.headers.set('Vary', 'Origin')
    res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', req.headers.get('access-control-request-headers') || 'Content-Type,Authorization')
    res.headers.set('Access-Control-Allow-Credentials', 'true')
    return res
  }

  if (isApi && !isAllowed) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Check authentication for protected routes (exclude public paths)
  const isPublicPath = url.pathname.startsWith('/sign-in') ||
                       url.pathname.startsWith('/sign-up') ||
                       url.pathname.startsWith('/landing') ||
                       url.pathname.startsWith('/api/auth')

  if (!isPublicPath) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    
    if (!token) {
      // Redirect to sign-in if not authenticated
      if (!isApi) {
        return NextResponse.redirect(new URL('/sign-in', req.url))
      }
      // Return 401 for API routes
      return new NextResponse('Unauthorized', { status: 401 })
    }
  }
  
  // Set CORS headers for allowed API requests
  const res = NextResponse.next()
  if (isApi && isAllowed) {
    try {
      res.headers.set('Access-Control-Allow-Origin', origin)
      res.headers.set('Vary', 'Origin')
      res.headers.set('Access-Control-Allow-Credentials', 'true')
    } catch {}
  }
  return res
}

export const config = {
  matcher: [
    "/((?!_next|.*\\..*|api/webhooks|sign-in|sign-up|landing).*)", // protected routes
    "/(api|trpc)(.*)", // always protect APIs
  ],
}
