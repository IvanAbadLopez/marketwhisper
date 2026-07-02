# MarketWhisper - Database Utilities

## 🎯 Purpose

This folder contains utility scripts for database management and seeding.

## 📋 Active Scripts

### Database Management

#### `seed_companies.py`
Seeds the database with common stock companies.

```bash
python seed_companies.py
```

**Companies included**: AAPL, MSFT, GOOGL, AMZN, NVDA, TSLA, META, NFLX, SPY, QQQ, RIVN, ATVI

#### `seed_content.py`
Seeds sample content and analysis data for testing.

```bash
python seed_content.py
```

#### `clean_content.py`
Utility to clean/reset content data in the database.

```bash
python clean_content.py
```

#### `check_user.ts`
TypeScript utility to verify user authentication and database connectivity.

```bash
npx tsx check_user.ts
```

#### `init-db.sh`
Shell script to initialize PostgreSQL with pgvector extension (used in Docker).

```bash
bash init-db.sh
```

## 📦 Legacy Scripts

**Note**: The `/legacy` subfolder contains archived scripts from the original architecture (web scraping, video downloading, transcription). These are kept for reference only.

See [legacy/README.md](legacy/README.md) for details on archived scripts.

## 🔧 Setup (One-time)

### 1. Install Python Dependencies

```bash
cd scripts
pip install -r requirements.txt
```

### 2. Verify `.env.local` exists

Ensure you have a `.env.local` file in the project root with `DATABASE_URL`:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

## 🚀 Usage

### Seed Companies

```bash
cd scripts
python seed_companies.py
```

### Seed Sample Content

```bash
python seed_content.py
```

### Clean Database

```bash
python clean_content.py
```

### Check User Authentication

```bash
npx tsx check_user.ts
```

---

## 📚 Related Documentation

- [Main README](../README.md)
- [Testing Guide](../docs/testing.md)
- [Docker Deployment](../docs/docker.md)

---

**Last Updated**: 2026-07-02
