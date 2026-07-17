# MarketWhisper - Scripts & Utilities

## 🎯 Purpose

This folder contains utility scripts for database seeding, Docker initialization, and development setup.

---

## 📋 Available Scripts

### 🐳 Docker & Initialization

#### `docker-entrypoint.sh`
Docker entrypoint script for database initialization and migrations.

**Used by**: Docker Compose automatically on container startup

**What it does**:
- Waits for PostgreSQL to be ready
- Runs Prisma migrations
- Seeds demo data via `seed-demo.js`

```bash
# Called automatically by Docker, but can be run manually:
bash docker-entrypoint.sh
```

---

#### `init-db.sh`
Initializes PostgreSQL with pgvector extension.

**Used by**: Docker Compose on first database creation

**What it does**:
- Enables pgvector extension for vector similarity search
- Creates database schema foundation

```bash
# Mounted as /docker-entrypoint-initdb.d/01-init-db.sh
bash init-db.sh
```

---

### 🌱 Database Seeding

#### `seed-demo.js`
Seeds demo user and sample companies for Docker deployments.

**Usage**:
```bash
node seed-demo.js
```

**What it seeds**:
- Demo user: `demo@marketwhisper.com` / `MarketWhisper2026!`
- Sample companies: AAPL, MSFT, GOOGL

**When to use**: Automatically called by Docker entrypoint, or manually for local dev

---

#### `seed_companies.py`
Seeds database with a larger set of stock companies.

**Usage**:
```bash
cd scripts
python seed_companies.py
```

**Companies included**: 
- Tech: AAPL, MSFT, GOOGL, AMZN, NVDA, TSLA, META, NFLX
- ETFs: SPY, QQQ
- Others: RIVN, ATVI

**When to use**: When you need more companies beyond the 3 demo ones

**Prerequisites**:
```bash
pip install -r requirements.txt
```

---

### 🔐 Security

#### `generate-auth-secret.js`
Generates a secure random secret for NextAuth.js `NEXTAUTH_SECRET`.

**Usage**:
```bash
node generate-auth-secret.js
```

**Output**: Base64-encoded 32-byte random string

**When to use**: 
- Setting up new environment (.env.local)
- Rotating secrets in production

---

## 🛠️ Setup Guide

### For Local Development (No Docker)

1. **Install Python dependencies** (if using Python scripts):
   ```bash
   cd scripts
   pip install -r requirements.txt
   ```

2. **Set up .env.local** in project root:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/marketwhisper"
   NEXTAUTH_SECRET="<generate with generate-auth-secret.js>"
   ```

3. **Run migrations**:
   ```bash
   npx prisma migrate deploy
   ```

4. **Seed demo data**:
   ```bash
   node scripts/seed-demo.js
   ```

### For Docker Development

Docker Compose handles everything automatically:
```bash
docker compose up
```

The `docker-entrypoint.sh` will:
1. Wait for database
2. Run migrations
3. Seed demo data

---

## 📁 Files in This Directory

| File | Purpose | Called By |
|------|---------|-----------|
| `docker-entrypoint.sh` | Docker initialization script | Docker Compose |
| `init-db.sh` | PostgreSQL setup (pgvector) | Docker Compose (first run) |
| `seed-demo.js` | Seed demo user + 3 companies | Docker entrypoint / Manual |
| `seed_companies.py` | Seed 12+ companies | Manual |
| `generate-auth-secret.js` | Generate NEXTAUTH_SECRET | Manual |
| `requirements.txt` | Python dependencies | pip install |
| `README.md` | This file | Documentation |

---

## 📚 Related Documentation

- [Main README](../README.md) - Project overview and setup
- [Docker Deployment](../docs/docker.md) - Docker Compose guide
- [Deployment Checklist](../docs/deployment-checklist.md) - Pre-deployment steps

---

**Last Updated**: 2026-07-17
