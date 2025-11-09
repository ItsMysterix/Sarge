# 📧 Email Setup Guide for SARGE Auth

## Quick Answer: **No EmailJS needed!**

We're using **nodemailer** which is already installed. You can integrate with any SMTP email service.

---

## 🚀 Recommended Email Services

### 1. **SendGrid** (Easiest - Recommended)
- ✅ Free tier: 100 emails/day
- ✅ Great deliverability
- ✅ Simple setup

**Setup:**
1. Create account at [sendgrid.com](https://sendgrid.com)
2. Get API key from Settings → API Keys
3. Add to `.env`:
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.your_actual_api_key_here
SMTP_FROM=noreply@yourdomain.com
```

### 2. **Resend** (Modern Alternative)
- ✅ 100 emails/day free
- ✅ Developer-friendly
- ✅ Great docs

**Setup:**
```bash
npm install resend

# .env
RESEND_API_KEY=re_your_key_here
```

### 3. **AWS SES** (Cheapest for Scale)
- ✅ $0.10 per 1,000 emails
- ✅ Very reliable
- ❌ Slightly more complex setup

**Setup:**
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your_aws_smtp_username
SMTP_PASS=your_aws_smtp_password
SMTP_FROM=noreply@yourdomain.com
```

---

## 🔧 Production Email Setup

### ✅ **Code Already Enabled!**

The email sending code in `lib/email-verification.ts` is **already active** with a beautiful branded template.

### Step 1: Get SendGrid API Key

1. Go to [SendGrid Dashboard](https://app.sendgrid.com/settings/api_keys)
2. Click **Create API Key**
3. Name: `SARGE Production`
4. Choose **Restricted Access** → Enable only **Mail Send**
5. Copy the API key (starts with `SG.`)

### Step 2: Add Environment Variables

**Local (.env):**
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.paste_your_new_api_key_here
SMTP_FROM=noreply@yourdomain.com
```

**Vercel Dashboard:**
Go to Project Settings → Environment Variables → Add:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

---

## 🎨 Custom Email Templates

Create a better email template by editing the `html` field:

```typescript
html: `
  <!DOCTYPE html>
  <html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; background: #0f0f0f; color: #fff; }
      .container { max-width: 600px; margin: 0 auto; padding: 40px; }
      .header { text-align: center; margin-bottom: 30px; }
      .code { 
        font-size: 32px; 
        font-weight: bold; 
        color: #00ff9f; 
        letter-spacing: 8px; 
        text-align: center;
        padding: 20px;
        background: rgba(0, 255, 159, 0.1);
        border-radius: 8px;
      }
      .footer { text-align: center; margin-top: 30px; color: #888; font-size: 12px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎯 SARGE Command Center</h1>
        <p>Verify Your Email Address</p>
      </div>
      
      <p>Welcome to SARGE! Your verification code is:</p>
      
      <div class="code">${code}</div>
      
      <p>This code expires in <strong>10 minutes</strong>.</p>
      
      <p>If you didn't request this code, you can safely ignore this email.</p>
      
      <div class="footer">
        <p>SARGE v2.0 • Secure DevOps Command Center</p>
        <p>System Online</p>
      </div>
    </div>
  </body>
  </html>
`,
```

---

## 🧪 Testing Emails Locally

### Option 1: Use Development Mode (Current)
OTP codes print to terminal - no email needed for testing!

### Option 2: Mailtrap (Email Sandbox)
Perfect for testing without sending real emails:

1. Sign up at [mailtrap.io](https://mailtrap.io)
2. Get SMTP credentials from inbox settings
3. Add to `.env.local`:
```bash
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_mailtrap_user
SMTP_PASS=your_mailtrap_pass
SMTP_FROM=test@sarge.dev
```

All emails will appear in Mailtrap inbox instead of real inboxes!

---

## ⚠️ Common Issues

### "Connection refused" error
- Check SMTP_HOST and SMTP_PORT are correct
- Try port 465 (SSL) or 587 (TLS)

### Emails go to spam
- Verify your domain with email provider
- Add SPF and DKIM records to DNS
- Use a custom domain for SMTP_FROM

### "Invalid credentials"
- For SendGrid, SMTP_USER must be exactly `apikey`
- SMTP_PASS is your API key (starts with `SG.`)
- Check for extra spaces in env vars

---

## 🎯 Production Checklist

- [ ] **SECURITY FIRST**: Revoke old/exposed API keys in SendGrid dashboard
- [ ] Create NEW SendGrid API key with Mail Send permission only
- [ ] Add SMTP env vars to Vercel (see above)
- [ ] Update local `.env` with new API key
- [ ] Test signup flow on production URL
- [ ] Check spam folder if emails not arriving
- [ ] Optional: Add domain verification for better deliverability
- [ ] Optional: Customize email template with your branding

---

## 💡 Pro Tips

1. **Rate limiting**: Add rate limiting to prevent abuse of signup/email endpoints
2. **Email templates**: Use [mjml.io](https://mjml.io) for responsive email templates
3. **Monitoring**: Track email delivery rates in your provider's dashboard
4. **Backup provider**: Configure a fallback SMTP provider for reliability

---

**That's it!** You don't need EmailJS - nodemailer + SendGrid (or any SMTP) is simpler and more flexible. 🚀
