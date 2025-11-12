import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Returns a GitHub token for one-click deploy scanning.
// Priority order:
// 1. User-specific token stored in process.env.GITHUB_USER_TOKEN (future expansion)
// 2. Global token from process.env.GITHUB_ACCESS_TOKEN or GITHUB_TOKEN
// NEVER expose a token to unauthenticated requests.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userToken = process.env.GITHUB_USER_TOKEN
  const globalToken = process.env.GITHUB_ACCESS_TOKEN || process.env.GITHUB_TOKEN
  const token = userToken || globalToken

  if (!token) {
    return NextResponse.json({ error: 'Token unavailable' }, { status: 404 })
  }

  // Return full token; caller must keep in memory only.
  return NextResponse.json({ token, scope: userToken ? 'user' : 'global' })
}
