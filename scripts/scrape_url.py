# -*- coding: utf-8 -*-
"""
Generic Web Scraper for MarketWhisper
Scrapes content from any URL and saves to Neon database.

Usage:
    python scripts/scrape_url.py <URL> <SOURCE_NAME> [--type VIDEO|WEB_ARTICLE|...]

Example:
    python scripts/scrape_url.py https://example.com/article "MarketWatch" --type WEB_ARTICLE
"""

import os
import sys
import re
import json
import argparse
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
import psycopg
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

# Load environment variables
env_path = Path(__file__).resolve().parent.parent / ".env.local"
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in .env.local")
    sys.exit(1)

# Common stock ticker patterns (simplified)
TICKER_PATTERNS = [
    r'\$([A-Z]{1,5})',           # $AAPL format
    r'\b([A-Z]{2,5})\b',         # AAPL format (2-5 uppercase letters)
]

def extract_tickers(text):
    """Extract potential stock tickers from text."""
    tickers = set()
    
    for pattern in TICKER_PATTERNS:
        matches = re.findall(pattern, text)
        tickers.update(matches)
    
    # Filter out common words that aren't tickers
    common_words = {'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'OUT', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW', 'ITS', 'MAY', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WAY', 'WHO', 'BOY', 'DID', 'ITS', 'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'USE'}
    tickers = [t for t in tickers if t not in common_words and len(t) >= 2]
    
    return list(set(tickers))

def scrape_url(url, source_name, content_type="WEB_ARTICLE"):
    """Scrape content from URL using Playwright."""
    print("Launching browser...")
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        page = context.new_page()
        
        try:
            print("Navigating to: " + url)
            page.goto(url, wait_until="networkidle", timeout=30000)
            
            # Wait for content to load
            page.wait_for_timeout(2000)
            
            # Try to extract title
            title = ""
            for selector in ['h1', 'title', '.article-title', '[class*="title"]']:
                try:
                    title_el = page.query_selector(selector)
                    if title_el:
                        title = title_el.inner_text().strip()
                        if title:
                            break
                except:
                    continue
            
            if not title:
                title = "Untitled Article from " + source_name
            
            # Try to extract description/summary
            description = ""
            for selector in ['.article-summary', '.description', 'meta[name="description"]', '.excerpt', 'p']:
                try:
                    desc_el = page.query_selector(selector)
                    if desc_el:
                        if selector.startswith('meta'):
                            description = desc_el.get_attribute('content') or ""
                        else:
                            description = desc_el.inner_text().strip()
                        if description and len(description) > 20:
                            break
                except:
                    continue
            
            # Extract all text content for ticker detection
            body_text = ""
            try:
                body_el = page.query_selector('body')
                if body_el:
                    body_text = body_el.inner_text()
            except:
                pass
            
            # Extract potential tickers
            tickers = extract_tickers(body_text)
            
            print("\nExtracted Content:")
            print("  Title: " + title[:80])
            print("  Description: " + (description[:100] if description else "N/A"))
            print("  Tickers found: " + str(tickers))
            
            browser.close()
            
            return {
                "title": title,
                "description": description or "No description available",
                "url": url,
                "sourceName": source_name,
                "contentType": content_type,
                "publishDate": datetime.now().isoformat(),
                "tickers": tickers,
                "metadata": {
                    "scrapedAt": datetime.now().isoformat(),
                    "bodyLength": len(body_text)
                }
            }
            
        except PlaywrightTimeout:
            print("ERROR: Timeout loading page")
            browser.close()
            return None
        except Exception as e:
            print("ERROR: " + str(e))
            browser.close()
            return None

def save_to_database(content):
    """Save scraped content to Neon database."""
    try:
        conn = psycopg.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # Check if content already exists
        cur.execute(
            'SELECT id, title FROM "Content" WHERE "sourceUrl" = %s',
            (content["url"],)
        )
        existing = cur.fetchone()
        
        if existing:
            print("\nContent already exists in database!")
            print("  ID: " + existing[0])
            print("  Title: " + existing[1])
            print("\nUpdating existing content...")
            
            # Update existing content
            cur.execute(
                '''UPDATE "Content" SET 
                    title = %s,
                    description = %s,
                    "contentType" = %s,
                    date = %s,
                    tickers = %s,
                    "sourceName" = %s,
                    metadata = %s,
                    "updatedAt" = NOW()
                WHERE "sourceUrl" = %s
                RETURNING id''',
                (
                    content["title"],
                    content["description"],
                    content["contentType"],
                    content["publishDate"],
                    content["tickers"],
                    content["sourceName"],
                    json.dumps(content["metadata"]),
                    content["url"]
                )
            )
            result_id = cur.fetchone()[0]
            print("Updated content with ID: " + result_id)
            
        else:
            # Insert new content
            cur.execute(
                '''INSERT INTO "Content" (
                    id, title, description, "contentType", date, tickers,
                    "sourceUrl", "sourceName", status, metadata, "createdAt", "updatedAt"
                ) VALUES (
                    gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
                ) RETURNING id''',
                (
                    content["title"],
                    content["description"],
                    content["contentType"],
                    content["publishDate"],
                    content["tickers"],
                    content["url"],
                    content["sourceName"],
                    "COMPLETED",
                    json.dumps(content["metadata"])
                )
            )
            result_id = cur.fetchone()[0]
            print("\nSaved to database with ID: " + result_id)
        
        conn.commit()
        cur.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print("\nERROR saving to database: " + str(e))
        return False

def main():
    parser = argparse.ArgumentParser(description='Scrape content from URL and save to database')
    parser.add_argument('url', help='URL to scrape')
    parser.add_argument('source_name', help='Source name (e.g., "MarketWatch", "Bloomberg")')
    parser.add_argument('--type', choices=['VIDEO', 'WEB_ARTICLE', 'BLOG_POST', 'SPECIAL_EVENT', 'NEWS'],
                        default='WEB_ARTICLE', help='Content type (default: WEB_ARTICLE)')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("MarketWhisper - Web Scraper")
    print("=" * 60)
    print("URL: " + args.url)
    print("Source: " + args.source_name)
    print("Type: " + args.type)
    print("=" * 60)
    
    # Scrape content
    content = scrape_url(args.url, args.source_name, args.type)
    
    if not content:
        print("\nFailed to scrape content")
        sys.exit(1)
    
    # Save to database
    success = save_to_database(content)
    
    if success:
        print("\n" + "=" * 60)
        print("SUCCESS! Content saved to database.")
        print("View it at: http://localhost:3000/situations")
        print("=" * 60)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
