import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'

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

  // Only use OAuth token - no fallback to shared PAT
  const oauthToken = session.accessToken

  if (!oauthToken) {
    return NextResponse.json({ 
      error: 'GitHub authentication required',
      hint: 'Sign out and sign in with GitHub to access your repositories',
      action: 'github_oauth_required'
    }, { status: 403 })
  }

  // Return OAuth token only
  return NextResponse.json({ token: oauthToken, scope: 'oauth' })
}
