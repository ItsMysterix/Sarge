import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.accessToken) {
      console.error("No GitHub access token found in session")
      return NextResponse.json(
        { error: "Not authenticated with GitHub. Please sign in with GitHub to connect repositories." },
        { status: 401 }
      )
    }

    console.log("Fetching GitHub repositories with access token...")

    // Fetch all repositories with pagination
    let allRepos: any[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const response = await fetch(
        `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`GitHub API error: ${response.status} ${response.statusText}`, errorText)
        
        return NextResponse.json(
          { 
            error: `GitHub API error: ${response.statusText}. Please try signing out and signing in again with GitHub.`,
            details: errorText 
          },
          { status: response.status }
        )
      }

      const repos = await response.json()
      allRepos = allRepos.concat(repos)
      
      // If we got less than 100 repos, we've reached the last page
      if (repos.length < 100) {
        hasMore = false
      } else {
        page++
      }
    }

    console.log(`Successfully fetched ${allRepos.length} repositories from GitHub (${page} page${page > 1 ? 's' : ''})`)
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
    console.error("Error fetching GitHub repos:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch repositories. Please ensure you're signed in with GitHub.",
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
