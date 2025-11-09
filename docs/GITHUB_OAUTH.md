# 🔗 GitHub OAuth Setup Guide

## Quick Setup (5 minutes)

### **Step 1: Create GitHub OAuth App**

1. Go to https://github.com/settings/developers
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in:
   - **Application name**: `SARGE DevOps Dashboard`
   - **Homepage URL**: `http://localhost:3000` (or your Vercel URL for production)
   - **Authorization callback URL**: 
     - Local: `http://localhost:3000/api/auth/callback/github`
     - Production: `https://v0-sarge.vercel.app/api/auth/callback/github`
4. Click **Register application**
5. You'll see your **Client ID**
6. Click **Generate a new client secret**
7. Copy both **Client ID** and **Client secret**

---

### **Step 2: Add to Local `.env`**

Open `/Users/mysterix/Downloads/Sarge-1/.env` and update:

```bash
GITHUB_ID=your_client_id_here
GITHUB_SECRET=your_client_secret_here
```

---

### **Step 3: Add to Vercel**

Go to Vercel Dashboard → Settings → Environment Variables

Add these for **Production, Preview, Development**:
- `GITHUB_ID` = your client ID
- `GITHUB_SECRET` = your client secret

---

### **Step 4: Create a Production OAuth App (Recommended)**

For production, create a **separate** OAuth App with production URLs:

1. Create another OAuth App in GitHub
2. Use production URLs:
   - **Homepage URL**: `https://v0-sarge.vercel.app`
   - **Callback URL**: `https://v0-sarge.vercel.app/api/auth/callback/github`
3. Add these credentials to Vercel environment variables (Production only)

This keeps local and production auth separate and secure.

---

## ✅ **What's Already Done:**

- ✅ GitHub OAuth provider configured in NextAuth
- ✅ Sign-in page has "Sign in with GitHub" button
- ✅ Database adapter stores GitHub accounts
- ✅ Landing page now checks auth status:
  - **Logged in?** → Redirects to dashboard
  - **Not logged in?** → Redirects to sign-up

---

## 🧪 **Test It:**

### **Local Testing:**
```bash
npm run dev
# Visit http://localhost:3000/sign-in
# Click "Sign in with GitHub"
# Authorize the app
# You'll be redirected to the dashboard
```

### **What Happens:**
1. User clicks "Sign in with GitHub"
2. Redirected to GitHub authorization page
3. After approval, GitHub redirects back with code
4. NextAuth exchanges code for user info
5. User account created in database (if new)
6. Session created
7. User redirected to dashboard

---

## 🎯 **User Flow:**

### **Landing Page:**
- Click "Launch Command Center"
- **If logged in:** → Dashboard (`/`)
- **If not logged in:** → Sign up page (`/sign-up`)

### **Sign In Page:**
- Option 1: Email + Password
- Option 2: GitHub OAuth button
- Both methods create/use same database records

### **Sign Up Page:**
- Email + Password → Sends OTP
- After verification → Can sign in
- Or use GitHub OAuth (no verification needed)

---

## 🔐 **Security Notes:**

1. **Never commit OAuth secrets** to git (they're in `.env` which is gitignored)
2. **Use different OAuth apps** for dev vs production
3. **Rotate secrets** if exposed
4. **Restrict OAuth app access** in GitHub settings if needed

---

## 🚀 **Optional: Add More OAuth Providers**

Want Google, Microsoft, or other providers? Just add to `app/api/auth/[...nextauth]/route.ts`:

```typescript
import GoogleProvider from "next-auth/providers/google"

providers: [
  GoogleProvider({
    clientId: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_SECRET,
  }),
  // ... other providers
]
```

Then add env vars and you're done!

---

## ❓ **Common Issues:**

### "Redirect URI mismatch"
- Check callback URL matches exactly in GitHub OAuth app settings
- Must include `/api/auth/callback/github` path

### "Access denied"
- User clicked "Cancel" on GitHub auth page
- Try again

### GitHub button not showing
- Check that `GITHUB_ID` and `GITHUB_SECRET` are set
- Restart dev server after adding env vars

---

**That's it!** GitHub OAuth is ready to use. 🎉
