# Vercel Deployment Guide

**Zero-cost serverless deployment** for MarketWhisper TFM using Vercel Hobby + Neon Free + Groq Free.

## Architecture Overview

**Production Stack:**
- **Frontend/Backend**: Vercel Hobby (Next.js 16, serverless functions)
- **Database**: Neon Free (PostgreSQL 16, 0.5GB storage, autosuspend after 5min idle)
- **LLM Provider**: Groq Free (llama-3.1-8b-instant, fast responses ~2-5s)
- **Financial Data**: Finnhub Free (60 req/min, stock data & news)

**Total Cost**: **0 €/month** (all free tiers)

---

## Prerequisites

1. **GitHub Account** with MarketWhisper repository
2. **Vercel Account** (sign up at [vercel.com](https://vercel.com))
3. **Neon Account** (sign up at [neon.tech](https://neon.tech))
4. **Groq API Key** (get from [console.groq.com](https://console.groq.com))
5. **Finnhub API Key** (get from [finnhub.io](https://finnhub.io))
6. **OAuth Apps** (GitHub + Google, optional)

---

## Step 1: Database Setup (Neon)

### 1.1 Create Neon Project

1. Go to [console.neon.tech](https://console.neon.tech)
2. Click **"New Project"**
3. Project name: `marketwhisper-prod`
4. Region: **Europe (Frankfurt)** (closest to your users)
5. PostgreSQL version: **16**
6. Click **"Create Project"**

### 1.2 Enable pgvector Extension

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Run this in Neon SQL Editor (for future embeddings feature).

### 1.3 Get Connection String

1. Go to **Dashboard** → **Connection Details**
2. Copy the **Pooled connection** string:
   ```
   postgresql://[user]:[password]@[host]/[database]?sslmode=require&pgbouncer=true
   ```
3. Save this for Vercel environment variables

### 1.4 Run Migrations

From your local machine:

```bash
# Set DATABASE_URL temporarily
export DATABASE_URL="postgresql://[your-neon-connection-string]"

# Run migrations
npx prisma migrate deploy

# Verify tables created
npx prisma studio
```

---

## Step 2: Groq API Setup

1. Go to [console.groq.com](https://console.groq.com)
2. Sign in with Google/GitHub
3. Navigate to **API Keys**
4. Click **"Create API Key"**
5. Name: `marketwhisper-prod`
6. Copy the key (starts with `gsk_...`)
7. Save for Vercel environment variables

**Free Tier Limits:**
- 30 requests/minute
- 6000 requests/day
- No credit card required

---

## Step 3: Finnhub API Setup

1. Go to [finnhub.io](https://finnhub.io)
2. Sign up (email required)
3. Navigate to **Dashboard** → **API Key**
4. Copy your API key
5. Save for Vercel environment variables

**Free Tier Limits:**
- 60 API calls/minute
- US stocks, forex, crypto data
- Company news & analyst recommendations

---

## Step 4: OAuth Apps Setup (Optional)

### 4.1 GitHub OAuth

1. Go to GitHub → **Settings** → **Developer settings** → **OAuth Apps**
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name**: MarketWhisper Production
   - **Homepage URL**: `https://marketwhisper.vercel.app` (or your custom domain)
   - **Authorization callback URL**: `https://marketwhisper.vercel.app/api/auth/callback/github`
4. Click **"Register application"**
5. Copy **Client ID** and **Client Secret**

### 4.2 Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project: `marketwhisper-prod`
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   - `https://marketwhisper.vercel.app/api/auth/callback/google`
7. Copy **Client ID** and **Client Secret**

---

## Step 5: Vercel Deployment

### 5.1 Import GitHub Repository

1. Go to [vercel.com/new](https://vercel.com/new)
2. Select **"Import Git Repository"**
3. Choose your GitHub account
4. Select **marketwhisper** repository
5. Click **"Import"**

### 5.2 Configure Project Settings

**Framework Preset**: Next.js (auto-detected)  
**Root Directory**: `./` (leave default)  
**Build Command**: `npm run build` (default)  
**Output Directory**: `.next` (default)  
**Install Command**: `npm install` (default)

### 5.3 Environment Variables

Click **"Environment Variables"** and add the following:

#### Required Variables

```bash
# Database
DATABASE_URL=postgresql://[your-neon-connection-string]

# NextAuth.js
NEXTAUTH_URL=https://marketwhisper.vercel.app
NEXTAUTH_SECRET=[generate-random-string-32-chars]
AUTH_TRUST_HOST=true

# LLM Provider
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_[your-groq-api-key]
GROQ_MODEL=llama-3.1-8b-instant

# Financial Data
FINNHUB_API_KEY=[your-finnhub-api-key]

# Node Environment
NODE_ENV=production
```

#### Generate NEXTAUTH_SECRET

```bash
# Linux/Mac
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 5.4 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build and deployment
3. Vercel will show you the live URL: `https://marketwhisper.vercel.app`

---

## Step 6: Verification & Testing

### 6.1 Smoke Test

1. **Open app**: `https://marketwhisper.vercel.app`
2. **Register new user**: Email + password
3. **Login**: Verify auth works
4. **Import company**: Try `AAPL` (Apple)
   - Should fetch from Finnhub
   - Should create enrichment job
5. **Analyze text**: Paste news article
   - Should detect company
   - Should return sentiment analysis
6. **View company detail**: Check enrichment completed
7. **View news**: Verify Finnhub news API works

### 6.2 Check Job Queue

1. Navigate to `/jobs`
2. Verify jobs show status (PENDING → PROCESSING → COMPLETED)
3. Check that `after()` background processing works

### 6.3 Monitor Performance

**Vercel Dashboard:**
- Check function invocations (<10k/month for free tier)
- Check function duration (should be <5s avg)
- Check errors (should be 0)

**Neon Dashboard:**
- Check active time (should auto-suspend after 5min idle)
- Check storage usage (<0.5GB for free tier)

**Groq Dashboard:**
- Check API usage (30 req/min limit)
- Check daily quota (6000 req/day)

---

## Step 7: Custom Domain (Optional)

### 7.1 Add Custom Domain

1. Go to Vercel project → **Settings** → **Domains**
2. Add domain: `marketwhisper.yourdomain.com`
3. Configure DNS (Vercel provides instructions):
   - Add `CNAME` record pointing to `cname.vercel-dns.com`
4. Wait for DNS propagation (5-10 minutes)
5. Vercel auto-provisions SSL certificate (Let's Encrypt)

### 7.2 Update Environment Variables

1. Update `NEXTAUTH_URL` to your custom domain:
   ```bash
   NEXTAUTH_URL=https://marketwhisper.yourdomain.com
   ```
2. Redeploy (Vercel auto-redeploys on env var changes)

### 7.3 Update OAuth Callbacks

**GitHub OAuth:**
- Update callback URL: `https://marketwhisper.yourdomain.com/api/auth/callback/github`

**Google OAuth:**
- Update authorized redirect URI: `https://marketwhisper.yourdomain.com/api/auth/callback/google`

---

## Troubleshooting

### Issue: Function Timeout

**Symptoms**: 504 Gateway Timeout errors

**Solution**: Verify maxDuration exports in routes:
```typescript
export const maxDuration = 60; // seconds (Hobby tier max)
```

### Issue: Database Connection Errors

**Symptoms**: "Connection refused" or "SSL required"

**Solution**: Verify Neon connection string includes:
- `?sslmode=require`
- `&pgbouncer=true` (for pooled connections)

### Issue: Groq Rate Limit

**Symptoms**: 429 errors from Groq API

**Solution**: Free tier is 30 req/min. Consider:
- Adding retry logic with exponential backoff
- Caching analysis results
- Upgrading to paid tier if needed

### Issue: Finnhub Rate Limit

**Symptoms**: 429 errors from Finnhub API

**Solution**: Free tier is 60 req/min. Consider:
- Caching enrichment data
- Reducing enrichment frequency
- Upgrading to paid tier ($24/month for 300 req/min)

### Issue: Neon Cold Start

**Symptoms**: First request after idle takes ~1-2s

**Solution**: This is normal (Neon auto-suspends after 5min). Options:
- Accept the cold start (minimal impact)
- Keep DB warm with cron job (loses free tier benefit)
- Upgrade to paid tier (no autosuspend)

---

## Cost Comparison

### Zero-Cost Stack (Current)

| Service | Tier | Limits | Cost |
|---------|------|--------|------|
| Vercel | Hobby | 100GB bandwidth, 100 serverless hours | **$0** |
| Neon | Free | 0.5GB storage, 100h compute, autosuspend | **$0** |
| Groq | Free | 30 req/min, 6k req/day | **$0** |
| Finnhub | Free | 60 req/min | **$0** |
| **Total** | | | **$0/month** |

### Paid Upgrade Path (If Needed)

| Service | Tier | Limits | Cost |
|---------|------|--------|------|
| Vercel | Pro | 1TB bandwidth, unlimited functions | **$20/month** |
| Neon | Pro | 10GB storage, no autosuspend | **$19/month** |
| Groq | Pay-as-you-go | No rate limits | **~$0.10/1K requests** |
| Finnhub | Starter | 300 req/min | **$24/month** |
| **Total** | | | **~$63/month** |

---

## Rollback Strategy

If deployment fails validation, keep Docker setup as fallback:

1. Main branch (`aedff1d`) has stable Docker + Ollama setup
2. `feat/serverless-deploy` is experimental
3. For TFM presentation, can use either:
   - **Production**: Vercel deployment (if validated)
   - **Fallback**: Local Docker Compose (guaranteed to work)

---

## Next Steps After Deployment

1. **Monitor for 24-48h**: Check Vercel/Neon/Groq dashboards for errors
2. **Load test**: Simulate multiple concurrent users
3. **Optimize if needed**: Add caching, reduce API calls
4. **Document for TFM**: Screenshot deployment, include in memoria
5. **Merge to main**: If stable, merge `feat/serverless-deploy` to `main`

---

## Contact & Support

- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Neon Support**: [neon.tech/docs](https://neon.tech/docs)
- **Groq Discord**: [groq.com/discord](https://groq.com/discord)
- **Project Issues**: [github.com/IvanAbadLopez/marketwhisper/issues](https://github.com/IvanAbadLopez/marketwhisper/issues)
