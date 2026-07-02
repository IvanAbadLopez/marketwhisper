"""
MarketWhisper - Video Download Script
Downloads the latest video from the analysis blog using Playwright.
"""

import os
import sys
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

# Load environment variables
env_path = Path(__file__).resolve().parent.parent / ".env.local"
load_dotenv(env_path)

BLOG_URL = os.getenv("BLOG_ANALYSIS_URL", "")
BLOG_USER = os.getenv("BLOG_ANALYSIS_USER", "")
BLOG_PASSWORD = os.getenv("BLOG_ANALYSIS_PASSWORD", "")
DOWNLOADS_DIR = Path(__file__).resolve().parent.parent / "downloads"
COOKIES_DIR = Path(__file__).resolve().parent / "cookies"


def ensure_dirs():
    """Create necessary directories."""
    DOWNLOADS_DIR.mkdir(exist_ok=True)
    COOKIES_DIR.mkdir(exist_ok=True)


def download_latest_video() -> dict | None:
    """
    Navigate to the blog, login if needed, and download the latest video.
    Returns metadata dict or None if no new video found.
    """
    ensure_dirs()

    if not BLOG_URL:
        print("ERROR: BLOG_ANALYSIS_URL not configured in .env.local")
        sys.exit(1)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()

        # Load cookies if available (skip login)
        cookies_file = COOKIES_DIR / "analysis_blog.json"
        if cookies_file.exists():
            import json
            cookies = json.loads(cookies_file.read_text())
            context.add_cookies(cookies)

        page = context.new_page()
        page.goto(BLOG_URL)

        # TODO: Implement login logic specific to your blog
        # TODO: Implement video detection and download logic
        # TODO: Save cookies after successful login

        # Placeholder return
        print("TODO: Implement blog-specific download logic")
        print(f"Blog URL: {BLOG_URL}")
        print(f"Downloads dir: {DOWNLOADS_DIR}")

        browser.close()

    return None


if __name__ == "__main__":
    result = download_latest_video()
    if result:
        print(f"Downloaded: {result['title']}")
    else:
        print("No new video found or download not yet implemented.")
