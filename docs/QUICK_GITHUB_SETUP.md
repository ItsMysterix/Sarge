# Quick GitHub Setup for One-Click Deploy

## The Problem
The one-click deploy feature needs GitHub access to analyze repositories. Previously, **every user** had to manually configure a personal access token in `.env` — terrible UX!

## The Solution ✅
**Users sign in with GitHub OAuth** → their token is automatically available for repo analysis. No manual setup needed!

---

## Setup (Choose One)

### Option 1: GitHub OAuth (Recommended) 🎯
**Best for:** Multi-user deployments, production use

1. **Create GitHub OAuth App** (2 minutes)
   - Go to https://github.com/settings/developers
   - Click **OAuth Apps** → **New OAuth App**
   - Fill in:
     ```
     Application name: Sarge DevOps Dashboard
     Homepage URL: http://localhost:3000
     Authorization callback URL: http://localhost:3000/api/auth/callback/github
     ```
   - Click **Register application**
   - Copy your **Client ID** and **Client Secret**

2. **Add to `.env`**
   ```bash
   GITHUB_ID=your_client_id_here
   GITHUB_SECRET=your_client_secret_here
   ```

3. **Restart dev server**
   ```bash
   npm run dev
   ```

4. **Users sign in with GitHub**
   - Go to http://localhost:3000/sign-in
   - Click "Sign in with GitHub"
   - Authorize the app
   - ✅ Done! Their GitHub token is now available for repo analysis

**Benefits:**
- ✅ Each user uses their own GitHub token (no shared credentials)
- ✅ Automatic access to private repos the user can access
- ✅ No manual token configuration needed
- ✅ Token automatically refreshed by OAuth

---

### Option 2: Manual Access Token (Quick Dev Setup)
**Best for:** Solo development, quick testing

1. **Generate token** at https://github.com/settings/tokens
   - Click "Generate new token (classic)"
   - Select scope: `repo` (full control of private repositories)
   - Copy the token (starts with `ghp_`)

2. **Add to `.env`**
   ```bash
   GITHUB_ACCESS_TOKEN=ghp_your_token_here
   ```

3. **Restart dev server**
   ```bash
   npm run dev
   ```

**Limitations:**
- ⚠️ All users share the same token
- ⚠️ Only works for repos the token owner can access
- ⚠️ Must manually update token when it expires
- ⚠️ Not suitable for production

---

## Priority Logic

The system checks for tokens in this order:
1. **User's OAuth token** (from GitHub sign-in) ← Recommended
2. Environment variable `GITHUB_USER_TOKEN` (future: per-user tokens)
3. Environment variable `GITHUB_ACCESS_TOKEN` or `GITHUB_TOKEN` (global fallback)

---

## Testing

### Test OAuth Flow:
```bash
# 1. Make sure GITHUB_ID and GITHUB_SECRET are set in .env
# 2. Start dev server
npm run dev

# 3. Visit sign-in page
open http://localhost:3000/sign-in

# 4. Click "Sign in with GitHub"
# 5. Authorize the app
# 6. You'll be redirected to dashboard
# 7. Go to One-Click Deploy and click "Analyze"
# ✅ Should work without any token errors!
```

### Test Fallback Token:
```bash
# If GitHub OAuth is not configured, the system falls back to GITHUB_ACCESS_TOKEN
# Users will see: "GitHub authentication required - Sign in with GitHub"
```

---

## For New Users

**With OAuth configured:**
1. Sign in with GitHub (one click)
2. Use one-click deploy immediately
3. No manual configuration needed! 🎉

**Without OAuth:**
Users see a friendly error:
```
❌ GitHub authentication required
💡 Sign in with GitHub to analyze repositories
   Or set GITHUB_ACCESS_TOKEN in .env for admin access
```

---

## Production Setup

For production deployments (Vercel, etc.):

1. **Create separate OAuth app** with production URLs:
   ```
   Homepage URL: https://your-app.vercel.app
   Callback URL: https://your-app.vercel.app/api/auth/callback/github
   ```

2. **Add to Vercel environment variables:**
   - `GITHUB_ID` = production client ID
   - `GITHUB_SECRET` = production client secret

3. **Set for all environments:**
   - Production: ✅
   - Preview: ✅
   - Development: ✅

See `docs/GITHUB_OAUTH.md` for detailed production setup.

---

## Troubleshooting

### Error: "GitHub authentication required"
**Cause:** No token available (OAuth not configured + no fallback token)
**Fix:** Set up GitHub OAuth (Option 1) or add GITHUB_ACCESS_TOKEN (Option 2)

### Error: "Unauthorized"
**Cause:** User not signed in
**Fix:** Sign in at http://localhost:3000/sign-in

### OAuth button not showing
**Cause:** `GITHUB_ID` or `GITHUB_SECRET` missing from `.env`
**Fix:** Follow Option 1 setup steps above

---

## Summary

🎯 **Best Practice:** Set up GitHub OAuth (5 minutes) → all users get automatic token access

⚡ **Quick Dev:** Add `GITHUB_ACCESS_TOKEN` to `.env` → works immediately but only for you

The OAuth approach provides the best UX and scales to multiple users without any manual token management!
