# 📦 Legacy Scripts

**Status**: ⚠️ OBSOLETE - Archived for reference only

## Why are these scripts here?

These scripts were part of the **original architecture** before MarketWhisper switched to a simplified AI-based approach:

- **Old approach**: Web scraping + video downloading + transcription
- **New approach**: Manual text input + Ollama AI analysis

## Archived Scripts

### `download_video.py`
Downloaded YouTube videos from a financial blog for transcription.

### `download_situations.py`
Scraped special situations from a blog with Selenium.

### `transcribe.py`
Used Whisper API to transcribe downloaded videos.

### `scrape_url.py`
Generic web scraper using Playwright for extracting content.

### `sync_all.py`
Orchestration script that ran all the above in sequence.

---

## Current Active Scripts

See `/scripts` directory for currently used scripts:
- `seed_companies.py` - Seeds company data to database
- `seed_content.py` - Seeds sample content
- `clean_content.py` - Utility to clean database
- `check_user.ts` - Verify user authentication
- `init-db.sh` - Initialize PostgreSQL with pgvector

---

**Last Updated**: 2026-07-02  
**Migration Reason**: Simplified to manual text input + local Ollama AI analysis
