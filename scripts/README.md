# MarketWhisper - Local Scraping Setup

## 🎯 Purpose

Execute the web scraper locally on your PC to add content to the production database, even when the app is deployed on Vercel.

## 📋 Prerequisites

1. **Python 3.8+** installed
2. **PostgreSQL connection** (Neon DB URL in `.env.local`)
3. **Internet connection** (for Playwright browser automation)

## 🔧 Setup (One-time)

### 1. Install Python Dependencies

```bash
cd scripts
pip install -r requirements.txt
```

### 2. Install Playwright Browsers

```bash
playwright install chromium
```

This downloads the Chromium browser (~300MB) for scraping.

### 3. Verify `.env.local` exists

Make sure your `.env.local` file in the project root contains:

```env
DATABASE_URL="postgresql://neondb_owner:npg_J7wPxGB9oaKD@ep-billowing-hall-asown4px.eu-central-1.aws.neon.tech/neondb?sslmode=require"
```

## 🚀 Usage

### Basic Scraping

```bash
python scripts/scrape_url.py <URL> "<SOURCE_NAME>"
```

**Example:**
```bash
python scripts/scrape_url.py https://www.marketwatch.com/story/apple-stock "MarketWatch"
```

### With Content Type

```bash
python scripts/scrape_url.py <URL> "<SOURCE_NAME>" --type <TYPE>
```

**Content Types:**
- `WEB_ARTICLE` (default) - News articles, blog posts
- `BLOG_POST` - Blog entries
- `NEWS` - Breaking news
- `SPECIAL_EVENT` - Mergers, acquisitions, special situations
- `VIDEO` - Video content (use only if analyzing video metadata)

**Examples:**
```bash
# Blog post
python scripts/scrape_url.py https://investing-blog.com/apple-analysis "Investing Blog" --type BLOG_POST

# Special event (merger news)
python scripts/scrape_url.py https://news.com/merger "Financial Times" --type SPECIAL_EVENT

# News article
python scripts/scrape_url.py https://bloomberg.com/tech-news "Bloomberg" --type NEWS
```

## 📊 What the Scraper Does

1. **Launches browser** (Playwright Chromium)
2. **Navigates to URL** and waits for JavaScript rendering
3. **Extracts content:**
   - Title (h1, title tag, etc.)
   - Description (meta description, first paragraph)
   - Body text (for ticker detection)
4. **Detects stock tickers:**
   - Formats: `$AAPL`, `AAPL`
   - Filters out common words (THE, AND, etc.)
5. **Saves to Neon DB:**
   - Creates new content if URL doesn't exist
   - Updates existing content if URL already scraped
6. **Returns result** with database ID

## 📝 Output Example

```
============================================================
MarketWhisper - Web Scraper
============================================================
URL: https://www.marketwatch.com/story/apple-stock
Source: MarketWatch
Type: WEB_ARTICLE
============================================================
Launching browser...
Navigating to: https://www.marketwatch.com/story/apple-stock

Extracted Content:
  Title: Apple Stock Rises on Strong iPhone Sales
  Description: Apple Inc. shares climbed Tuesday after the tech giant...
  Tickers found: ['AAPL', 'MSFT', 'GOOGL']

Saved to database with ID: clzx1234567890abcdefghij

============================================================
SUCCESS! Content saved to database.
View it at: http://localhost:3000/situations
============================================================
```

## 🔄 Workflow

```
┌─────────────────────────────────────────────────────────┐
│  1. You run scraper locally on your PC                 │
│     python scripts/scrape_url.py <URL> <SOURCE>        │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  2. Scraper connects to Neon DB (cloud PostgreSQL)     │
│     Inserts/updates content in "Content" table         │
└─────────────────┬───────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────┐
│  3. Vercel app reads from same Neon DB                 │
│     Users see the new content immediately              │
└─────────────────────────────────────────────────────────┘
```

## 🛡️ Duplicate Handling

The scraper checks if content with the same URL already exists:
- **If exists:** Updates the content (title, description, tickers)
- **If new:** Creates new content entry

Status is always set to `COMPLETED` after scraping.

## ⚠️ Limitations

- **Ticker detection is heuristic** - may have false positives/negatives
- **Paywalled content** - may not scrape full text behind paywalls
- **JavaScript-heavy sites** - some sites may require additional wait time (edit script to add `page.wait_for_timeout()`)
- **Rate limiting** - don't scrape too many URLs too fast from the same domain

## 🚀 Future: Automated Scraping

For automated scraping (cron jobs), you can:
1. Deploy this script to Railway/Render/Fly.io
2. Set up scheduled tasks to run daily/weekly
3. Keep your PC off while scraping runs in the cloud

But for now, manual scraping from your PC is perfect for a TFM project.

## 📚 Files

- `scrape_url.py` - Main scraper script
- `requirements.txt` - Python dependencies
- `seed_content.py` - Sample data seeder (for testing)
- `download_situations.py` - Legacy (not used)
- `download_video.py` - Legacy (not used)
- `transcribe.py` - Video transcription (future use)

## 🐛 Troubleshooting

**"DATABASE_URL not found"**
→ Make sure `.env.local` exists in project root with DATABASE_URL

**"playwright not found"**
→ Run `pip install playwright` then `playwright install chromium`

**"Connection refused"**
→ Check your internet connection and Neon DB status

**"Timeout loading page"**
→ Some sites are slow, increase timeout in script or try again
