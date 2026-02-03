#!/bin/bash

# This script manually sets Vercel environment variables that keep getting set as empty strings

echo "Setting NEXTAUTH_URL..."
echo "https://v0-sarge.vercel.app" | npx vercel env add NEXTAUTH_URL production --force

echo "Setting ALLOWED_ORIGINS..."
echo "https://v0-sarge.vercel.app" | npx vercel env add ALLOWED_ORIGINS production --force

echo "Setting GITHUB_ID..."
echo "Ov23liOP1yVxDnm9SsYs" | npx vercel env add GITHUB_ID production --force

echo "Setting GITHUB_SECRET..."
echo "8766c6b5d38fb6cdaf96af985592936c4d97d55d" | npx vercel env add GITHUB_SECRET production --force

echo ""
echo "✅ All environment variables set!"
echo ""
echo "Now trigger a redeploy:"
echo "  git commit --allow-empty -m 'chore: redeploy with env vars' && git push"
echo ""
echo "Or manually in Vercel dashboard:"
echo "  https://vercel.com/itsmysterixs-projects/sarge/deployments"
