export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'

// Deprecated endpoint: the app uses tRPC (sarge.oneclick.workspaces.registerLocal)
export async function POST() {
  return NextResponse.json(
    { error: 'Deprecated: use tRPC sarge.oneclick.workspaces.registerLocal' },
    { status: 410 }
  )
}
