# MarketWhisper - Docker Setup

**Docker is the RECOMMENDED way to run MarketWhisper**, both for thesis evaluation and local development.

## Why Docker?

✅ **Zero setup**: No need to install Node.js, PostgreSQL, or configure databases  
✅ **Reproducible**: Works the same on any machine (Windows, Mac, Linux)  
✅ **All-inclusive**: PostgreSQL database with pgvector integrated  
✅ **Ideal for thesis**: Evaluators only need `docker compose up`  

This file explains how to run MarketWhisper using Docker.

## Prerequisites

- **Docker Desktop** installed ([download here](https://www.docker.com/products/docker-desktop))
- **Git** (to clone the repository)

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/IvanAbadLopez/marketwhisper.git
cd marketwhisper
```

### 2. Configure Environment Variables (Optional)

If you want to use OAuth or external APIs, create a `.env` file in the project root:

```bash
# Copy example
cp .env.example .env

# Edit with your credentials (optional)
# Empty variables will use default values for development
```

**Note**: For demo mode, NO configuration needed. The application will work with the demo user.

### 3. Start the Application

```bash
docker compose up
```

This command:
- Downloads necessary Docker images
- Creates a PostgreSQL database with pgvector
- Builds the Next.js application
- Starts all services

**First time**: May take 3-5 minutes to build everything.

### 4. Access the Application

Open your browser at: **http://localhost:3000**

**Demo credentials:**
- Email: `demo@marketwhisper.com`
- Password: `demo1234`

## Useful Commands

### Stop the application
```bash
docker compose down
```

### Stop and remove data
```bash
docker compose down -v
```

### View logs
```bash
docker compose logs -f web
```

### Rebuild after code changes
```bash
docker compose up --build
```

### Run Python scripts (scraping, etc.)

Python scripts must be run from your local machine, as they require:
- Playwright with browser installed
- Access to blog credentials (in `.env.local`)
- Optionally: Whisper with GPU for transcription

```bash
# Make sure you have Python 3.12+ and dependencies installed
pip install -r scripts/requirements.txt

# Example: scraping from URL
python scripts/scrape_url.py https://example.com "Example Source" --type WEB_ARTICLE
```

## Service Structure

```
┌─────────────────────────────────────┐
│  localhost:3000                     │
│  Next.js Web App                    │
│  (Frontend + API Routes)            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  db:5432                            │
│  PostgreSQL + pgvector              │
│  (Database)                         │
└─────────────────────────────────────┘
```

## Persistent Data

Database data is saved in a **Docker volume** called `postgres_data`. This means:

- ✅ Data persists even if you stop containers
- ✅ You can do `docker compose down` without losing information
- ❌ `docker compose down -v` WILL delete all data

## Populate the Database

To add sample companies and content:

```bash
# From your local machine (with Python installed)
python scripts/seed_companies.py
python scripts/seed_content.py
```

Or access the web application and use the "Sync Now" button to add content via scraping.

## Troubleshooting

### Port 3000 already in use
```bash
# Change port in docker-compose.yml
ports:
  - "3001:3000"  # Now accessible at localhost:3001
```

### Port 5432 already in use (you have Postgres installed)
```bash
# Change port in docker-compose.yml
ports:
  - "5433:5432"  # Also change DATABASE_URL
```

### Clean everything and start fresh
```bash
docker compose down -v
docker system prune -a
docker compose up --build
```

### View container status
```bash
docker compose ps
```

## For Production

This setup is for **development/evaluation**. For production:

1. Change `NEXTAUTH_SECRET` to one generated with:
   ```bash
   openssl rand -base64 32
   ```

2. Use managed PostgreSQL (Neon, Supabase, etc.)

3. Configure HTTPS and real domain

4. Enable OAuth with real credentials

5. Deploy to:
   - **Vercel** (Frontend)
   - **Railway/Fly.io** (Full-stack with Docker)
   - **AWS ECS/Google Cloud Run** (Containers)

## Support

If you encounter problems:
1. Check the logs: `docker compose logs -f`
2. Make sure Docker Desktop is running
3. Verify ports 3000 and 5432 are free
4. Consult the documentation in `README.md`
