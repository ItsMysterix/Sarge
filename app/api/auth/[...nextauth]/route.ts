import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import PostgresAdapter from "@auth/pg-adapter"
import { getDbPool } from "@/lib/db"
import bcrypt from "bcryptjs"
import type { Adapter } from "next-auth/adapters"

// Ensure NEXTAUTH_SECRET is set
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error(
    'NEXTAUTH_SECRET environment variable is not set. Generate one with: openssl rand -base64 32'
  )
}

export const authOptions: NextAuthOptions = {
  adapter: PostgresAdapter(getDbPool()) as Adapter,
  
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
    
    // Credentials provider with database validation
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "dev@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const pool = getDbPool()
        
        // Get user and password hash
        const result = await pool.query(
          `SELECT u.id, u.email, u.name, u.image, u.email_verified, c.password_hash
           FROM users u
           LEFT JOIN user_credentials c ON u.id = c.user_id
           WHERE u.email = $1`,
          [credentials.email]
        )

        if (result.rows.length === 0) {
          return null
        }

        const user = result.rows[0]

        // Check if email is verified
        if (!user.email_verified) {
          throw new Error("Please verify your email before signing in")
        }

        // Verify password
        if (!user.password_hash) {
          return null
        }

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password_hash
        )

        if (!isValidPassword) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  
  pages: {
    signIn: "/sign-in",
    signOut: "/",
    error: "/sign-in",
  },
  
  callbacks: {
    async signIn({ user, account, profile }) {
      // For OAuth providers (GitHub), auto-verify email
      if (account?.provider === "github") {
        const pool = getDbPool()
        await pool.query(
          `UPDATE users SET email_verified = NOW() WHERE id = $1 AND email_verified IS NULL`,
          [user.id]
        )
      }
      return true
    },
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
