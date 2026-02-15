import NextAuth from "next-auth"
import type { NextAuthOptions } from "next-auth"
import GithubProvider from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import { getDbPool } from "@/lib/db"
import { storeProviderCredentials } from "@/lib/provider-credentials"
import bcrypt from "bcryptjs"

// Detailed environment validation logging
// console.log('🔍 [AUTH CONFIG] Initializing NextAuth...')
console.log('🔍 [AUTH CONFIG] NODE_ENV:', process.env.NODE_ENV)
console.log('🔍 [AUTH CONFIG] NEXTAUTH_URL:', process.env.NEXTAUTH_URL || '❌ NOT SET')
console.log('🔍 [AUTH CONFIG] NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ SET (length: ' + process.env.NEXTAUTH_SECRET.length + ')' : '❌ NOT SET')
console.log('🔍 [AUTH CONFIG] GITHUB_ID:', process.env.GITHUB_ID || '❌ NOT SET')
console.log('🔍 [AUTH CONFIG] GITHUB_SECRET:', process.env.GITHUB_SECRET ? '✅ SET' : '❌ NOT SET')

// Ensure NEXTAUTH_SECRET is set
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error(
    'NEXTAUTH_SECRET environment variable is not set. Generate one with: openssl rand -base64 32'
  )
}

// Ensure NEXTAUTH_URL is set
const nextAuthUrl = process.env.NEXTAUTH_URL
if (!nextAuthUrl) {
  console.error('❌ [AUTH CONFIG] NEXTAUTH_URL not set - OAuth WILL FAIL')
} else {
  console.log('✅ [AUTH CONFIG] NEXTAUTH_URL configured:', nextAuthUrl)
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  useSecureCookies: process.env.NODE_ENV === 'production',

  callbacks: {
    async signIn({ user, account, profile }) {
      const logPrefix = `🔵 [SIGNIN ${account?.provider?.toUpperCase() || 'UNKNOWN'}]`
      console.log(`${logPrefix} ========== SIGNIN CALLBACK START ==========`)
      console.log(`${logPrefix} Provider:`, account?.provider)
      console.log(`${logPrefix} User ID:`, user?.id)
      console.log(`${logPrefix} User Email:`, user?.email)
      console.log(`${logPrefix} User Name:`, user?.name)
      console.log(`${logPrefix} Account Type:`, account?.type)
      console.log(`${logPrefix} Account Provider Account ID:`, account?.providerAccountId)

      try {
        // For OAuth providers (GitHub), create/update user in database
        if (account?.provider === "github" && user?.email) {
          console.log(`${logPrefix} Processing GitHub OAuth for:`, user.email)

          try {
            const pool = getDbPool()
            console.log(`${logPrefix} Database pool acquired`)

            // Atomic UPSERT: Insert new user or update existing one
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

            console.log(`${logPrefix} ✅ User upserted successfully:`, {
              id: result.rows[0]?.id,
              email: result.rows[0]?.email
            })
          } catch (dbError) {
            console.error(`${logPrefix} ❌ Database error:`, dbError)
            console.error(`${logPrefix} Error message:`, dbError instanceof Error ? dbError.message : String(dbError))
            console.error(`${logPrefix} Error stack:`, dbError instanceof Error ? dbError.stack : 'No stack trace')
            // Don't block sign-in if database operations fail
            console.log(`${logPrefix} ⚠️  Continuing with sign-in despite DB error`)
          }
        }
      } catch (error) {
        console.error(`${logPrefix} ❌ Unexpected error in signIn callback:`, error)
        console.error(`${logPrefix} Error details:`, error instanceof Error ? error.message : String(error))
        console.error(`${logPrefix} Error stack:`, error instanceof Error ? error.stack : 'No stack trace')
        // Don't block sign-in if database operations fail
      }

      console.log(`${logPrefix} ✅ Returning true - sign-in successful`)
      console.log(`${logPrefix} ========== SIGNIN CALLBACK END ==========`)
      return true
    },
    async session({ session, token }) {
      console.log('🟢 [SESSION] ========== SESSION CALLBACK START ==========')
      console.log('🟢 [SESSION] Token sub (user ID):', token.sub)
      console.log('🟢 [SESSION] Token email:', token.email)
      console.log('🟢 [SESSION] Session user before:', session.user)

      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      // Pass GitHub access token to session
      if (token.accessToken) {
        session.accessToken = token.accessToken as string
        console.log('🟢 [SESSION] GitHub access token attached to session')
      }

      console.log('🟢 [SESSION] Session user after:', {
        id: session.user?.id,
        email: session.user?.email,
        name: session.user?.name,
        hasAccessToken: !!session.accessToken
      })
      console.log('🟢 [SESSION] ========== SESSION CALLBACK END ==========')
      return session
    },
    async jwt({ token, user, account, profile, trigger }) {
      if (user) {
        token.id = user.id

        // Ensure token.sub uses our database UUID instead of the provider ID
        // This is critical for matching users with their projects in the database
        try {
          const pool = getDbPool()
          const result = await pool.query("SELECT id FROM users WHERE email = $1", [user.email])
          if (result.rows[0]) {
            token.sub = result.rows[0].id
            console.log('🟡 [JWT] Database ID found and assigned to token.sub:', token.sub)
          } else {
            console.warn('🟡 [JWT] User not found in database for email:', user.email)
          }
        } catch (error) {
          console.error('🟡 [JWT] Failed to fetch database ID for user:', error)
        }
      }

      // Store GitHub access token on first sign in
      if (account?.provider === "github" && account.access_token) {
        token.accessToken = account.access_token

        const userEmail = user?.email || (profile as any)?.email || token.email
        if (userEmail) {
          try {
            await storeProviderCredentials(
              "github",
              {
                access_token: account.access_token,
                scope: account.scope || "",
                token_type: account.token_type || "",
              },
              userEmail
            )
          } catch (error) {
            console.error('🟡 [JWT] ❌ Failed to store GitHub credentials:', error)
          }
        }
      }

      return token
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
