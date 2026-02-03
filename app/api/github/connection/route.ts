import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { getGithubAccessToken } from "@/lib/provider-credentials"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ connected: false }, { status: 401 })
  }

  if (session.accessToken) {
    return NextResponse.json({ connected: true, source: "oauth" })
  }

  const linkedToken = await getGithubAccessToken(session.user.email)
  if (linkedToken) {
    return NextResponse.json({ connected: true, source: "linked" })
  }

  return NextResponse.json({ connected: false })
}
