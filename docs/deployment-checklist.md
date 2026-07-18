# Deployment Checklist

Quick reference for deploying to Vercel.

## Pre-Deployment

- [ ] **Neon DB created** (PostgreSQL 16, pgvector enabled)
- [ ] **Migrations applied** (`npx prisma migrate deploy`)
- [ ] **Groq API key** obtained ([console.groq.com](https://console.groq.com))
- [ ] **Finnhub API key** obtained ([finnhub.io](https://finnhub.io))
- [ ] **OAuth apps configured** (GitHub + Google, optional)

## Vercel Setup

- [ ] **Import repository** from GitHub
- [ ] **Configure environment variables** (see below)
- [ ] **Deploy** and verify build succeeds

## Environment Variables

```bash
# Required
DATABASE_URL=postgresql://[neon-connection-string]
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=[32-char-random-string]
AUTH_TRUST_HOST=true
LLM_PROVIDER=groq
GROQ_API_KEY=gsk_[your-key]
GROQ_MODEL=llama-3.1-8b-instant
FINNHUB_API_KEY=[your-key]
NODE_ENV=production
```

## Post-Deployment Verification

- [ ] **Homepage loads** without errors
- [ ] **Register new user** works
- [ ] **Login** works
- [ ] **Import company** (e.g., AAPL) creates enrichment job
- [ ] **Analyze text** detects company and returns sentiment
- [ ] **View company detail** shows enrichment data
- [ ] **View news** loads Finnhub news
- [ ] **Job queue** shows job status correctly
- [ ] **Check Vercel dashboard** for errors
- [ ] **Check Neon dashboard** for DB health
- [ ] **Check Groq dashboard** for API usage

## OAuth Callback URLs

Update after deployment:

**GitHub**: `https://your-app.vercel.app/api/auth/callback/github`  
**Google**: `https://your-app.vercel.app/api/auth/callback/google`

## Troubleshooting

| Error | Solution |
|-------|----------|
| 504 Timeout | Check `maxDuration` exports in routes |
| DB connection error | Verify connection string has `?sslmode=require&pgbouncer=true` |
| 429 from Groq | Free tier is 30 req/min, add retry logic or upgrade |
| 429 from Finnhub | Free tier is 60 req/min, reduce API calls or upgrade |
| Cold start slow | Normal for Neon (auto-suspends after 5min idle) |

## Rollback

If deployment fails:
1. Keep `main` branch at `aedff1d` (Docker + Ollama)
2. Use Docker Compose for TFM presentation as fallback
3. `feat/serverless-deploy` branch is experimental only
