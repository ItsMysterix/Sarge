import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"
import { getGithubAccessToken } from "@/lib/provider-credentials"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    const sessionToken = session?.accessToken
    const userEmail = session?.user?.email
    const linkedToken = userEmail ? await getGithubAccessToken(userEmail) : null
    const token = sessionToken || linkedToken

    if (!token) {
      return NextResponse.json(
        {
          error: "GitHub access token not found. Connect GitHub in Settings to access your repositories.",
          action: "github_connect_required"
        },
        { status: 401 }
      )
    }



    // Fetch all repositories with pagination
    let allRepos: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore && page <= 10) { // Safety limit of 10 pages (1000 repos)
      const response = await fetch(
        `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner,collaborator,organization_member`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      )

      if (!response.ok) {
        const errorText = await response.text()

        // Handle 401 Unauthorized specifically
        if (response.status === 401) {
          return NextResponse.json(
            {
              error: "GitHub authentication expired or insufficient permissions. Please sign out and sign back in with GitHub to refresh your access.",
              action: "signout_required",
              details: errorText
            },
            { status: 401 }
          )
        }

        return NextResponse.json(
          {
            error: `GitHub API error: ${response.statusText}. Please try signing out and signing in again with GitHub.`,
            details: errorText
          },
          { status: response.status }
        )
      }

      const text = await response.text()
      if (!text || text.trim().length === 0) {
        hasMore = false
        break
      }

      let repos: any[]
      try {
        repos = JSON.parse(text)
      } catch (parseError) {
        return NextResponse.json(
          { error: 'Invalid response from GitHub API', details: text.substring(0, 200) },
          { status: 500 }
        )
      }
      allRepos = allRepos.concat(repos)

      // If we got less than 100 repos, we've reached the last page
      if (repos.length < 100) {
        hasMore = false
      } else {
        page++
      }
    }

    const repos = allRepos

    // Format the response
    const formattedRepos = repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      ssh_url: repo.ssh_url,
      updated_at: repo.updated_at,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      default_branch: repo.default_branch,
    }))

    return NextResponse.json(formattedRepos)
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch repositories. Please ensure you're signed in with GitHub.",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
