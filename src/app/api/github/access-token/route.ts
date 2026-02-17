import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { getGithubAccessToken } from '@/lib/provider-credentials'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Returns a GitHub token for one-click deploy scanning.
// Only returns the user's OAuth token from GitHub sign-in.
// This ensures each user sees their own repos (multi-tenant isolation).
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ 
      error: 'Not signed in',
      hint: 'Please sign in to access GitHub features',
      action: 'signin_required'
    }, { status: 401 })
  }

  // Prefer OAuth token from current session
  const oauthToken = session.accessToken
  if (oauthToken) {
    return NextResponse.json({ token: oauthToken, scope: 'oauth' })
  }

  // Fallback to stored GitHub token linked to this user (per-user only)
  const userEmail = session.user.email
  const linkedToken = userEmail ? await getGithubAccessToken(userEmail) : null
  if (linkedToken) {
    return NextResponse.json({ token: linkedToken, scope: 'oauth-linked' })
  }

  return NextResponse.json({
    error: 'GitHub authentication required',
    hint: 'Connect GitHub in Settings to access your repositories',
    action: 'github_connect_required'
  }, { status: 403 })
}
