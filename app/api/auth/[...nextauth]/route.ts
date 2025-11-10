import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { getDbPool } from "@/lib/db"
import bcrypt from "bcryptjs"

// Ensure NEXTAUTH_SECRET is set
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error(
    'NEXTAUTH_SECRET environment variable is not set. Generate one with: openssl rand -base64 32'
  )
}

export const authOptions: NextAuthOptions = {
  // Don't use database adapter - use pure JWT for now
  // adapter: PostgresAdapter(getDbPool()) as Adapter,
  
  providers: [
    // GitHub OAuth provider (optional, requires GITHUB_ID and GITHUB_SECRET)
    ...(process.env.GITHUB_ID && process.env.GITHUB_SECRET
      ? [
          GithubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET,
            // Request scopes needed to list org/private repos and clone via token
            // Users must re-consent after this change to grant the new scopes.
            authorization: {
              params: {
                scope: 'read:user user:email repo read:org',
              },
            },
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
    error: "/sign-in", // Keep simple - will show error in URL params
  },
  
  session: {
    strategy: "jwt", // Use JWT instead of database sessions for OAuth
  },
  
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔵 signIn callback started', { 
        provider: account?.provider, 
        userId: user?.id, 
        email: user?.email 
      })
      
      try {
        // For OAuth providers (GitHub), create/update user in database
        if (account?.provider === "github" && user?.email) {
          console.log('🔵 GitHub OAuth - handling user for:', user.email)
          const pool = getDbPool()
          
          // Atomic UPSERT: Insert new user or update existing one
          // This handles the case where user already exists from previous attempts
          const result = await pool.query(
            `INSERT INTO users (id, email, name, image, email_verified, created_at, updated_at)
             VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW(), NOW())
             ON CONFLICT (email) 
             DO UPDATE SET 
               name = EXCLUDED.name,
               image = EXCLUDED.image,
               email_verified = COALESCE(users.email_verified, NOW()),
               updated_at = NOW()
             RETURNING id, email`,
            [user.email, user.name || user.email.split('@')[0], user.image]
          )
          
          console.log('✅ User upserted:', result.rows[0])
        }
      } catch (error) {
        console.error('❌ Error in signIn callback:', error)
        console.error('❌ Error details:', error instanceof Error ? error.message : String(error))
        // Don't block sign-in if database operations fail
      }
      
      console.log('✅ signIn callback returning true')
      return true
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      // Pass GitHub access token to session
      if (token.accessToken) {
        session.accessToken = token.accessToken as string
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      }
      // Store GitHub access token on first sign in
      if (account?.provider === "github" && account.access_token) {
        token.accessToken = account.access_token
      }
      return token
    },
  },
  
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
