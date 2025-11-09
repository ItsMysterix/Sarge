import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../auth/[...nextauth]/route"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.accessToken) {
      console.log("No GitHub access token found, returning mock repos")
      // Return mock repositories if not authenticated with GitHub
      return NextResponse.json([
        {
          id: 1,
          name: "sarge",
          full_name: "yourusername/sarge",
          description: "Local AWS cloud infrastructure platform",
          private: false,
          html_url: "https://github.com/yourusername/sarge",
          clone_url: "https://github.com/yourusername/sarge.git",
          ssh_url: "git@github.com:yourusername/sarge.git",
          updated_at: new Date().toISOString(),
          language: "TypeScript",
          stargazers_count: 42,
          default_branch: "main",
        },
        {
          id: 2,
          name: "production-api",
          full_name: "yourusername/production-api",
          description: "Production API backend service",
          private: true,
          html_url: "https://github.com/yourusername/production-api",
          clone_url: "https://github.com/yourusername/production-api.git",
          ssh_url: "git@github.com:yourusername/production-api.git",
          updated_at: new Date(Date.now() - 86400000).toISOString(),
          language: "Node.js",
          stargazers_count: 15,
          default_branch: "main",
        },
        {
          id: 3,
          name: "dev-fullstack",
          full_name: "yourusername/dev-fullstack",
          description: "Full-stack development environment",
          private: false,
          html_url: "https://github.com/yourusername/dev-fullstack",
          clone_url: "https://github.com/yourusername/dev-fullstack.git",
          ssh_url: "git@github.com:yourusername/dev-fullstack.git",
          updated_at: new Date(Date.now() - 172800000).toISOString(),
          language: "JavaScript",
          stargazers_count: 8,
          default_branch: "develop",
        },
      ])
    }

    // Fetch user's repositories from GitHub API
    const response = await fetch("https://api.github.com/user/repos?per_page=100&sort=updated", {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    })

    if (!response.ok) {
      console.error(`GitHub API error: ${response.status} ${response.statusText}`)
      // Return mock data on error
      return NextResponse.json([
        {
          id: 1,
          name: "sarge",
          full_name: "yourusername/sarge",
          description: "Local AWS cloud infrastructure platform",
          private: false,
          html_url: "https://github.com/yourusername/sarge",
          clone_url: "https://github.com/yourusername/sarge.git",
          ssh_url: "git@github.com:yourusername/sarge.git",
          updated_at: new Date().toISOString(),
          language: "TypeScript",
          stargazers_count: 42,
          default_branch: "main",
        },
      ])
    }

    const repos = await response.json()

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
    // Return mock data on error
    return NextResponse.json([
      {
        id: 1,
        name: "sarge",
        full_name: "yourusername/sarge",
        description: "Local AWS cloud infrastructure platform",
        private: false,
        html_url: "https://github.com/yourusername/sarge",
        clone_url: "https://github.com/yourusername/sarge.git",
        ssh_url: "git@github.com:yourusername/sarge.git",
        updated_at: new Date().toISOString(),
        language: "TypeScript",
        stargazers_count: 0,
        default_branch: "main",
      },
    ])
  }
}
