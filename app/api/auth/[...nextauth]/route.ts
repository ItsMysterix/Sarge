import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"

// Ensure NEXTAUTH_SECRET is set
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error(
    'NEXTAUTH_SECRET environment variable is not set. Generate one with: openssl rand -base64 32'
  )
}

export const authOptions: NextAuthOptions = {
  providers: [
    // GitHub OAuth provider (optional, requires GITHUB_ID and GITHUB_SECRET)
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GithubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
          }),
        ]
      : []),
    
    // Credentials provider for dev/testing (accepts any email/password in dev mode)
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "dev@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // In dev mode, accept any non-empty credentials
        if (process.env.NODE_ENV === "development") {
          if (credentials?.email && credentials?.password) {
            return {
              id: "dev-user",
              email: credentials.email,
              name: credentials.email.split("@")[0],
            }
          }
        }
        
        // In production, you would validate against your database here
        // For now, reject in production without proper auth setup
        return null
      },
    }),
  ],
  
  pages: {
    signIn: "/sign-in",
    signOut: "/",
    error: "/sign-in",
  },
  
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },
  
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
