# -*- coding: utf-8 -*-
"""
Seed script to populate database with sample content for testing.
"""
import os
from datetime import datetime, timedelta
import json
from dotenv import load_dotenv
import psycopg
from pathlib import Path

# Load environment variables
env_path = Path(__file__).resolve().parent.parent / ".env.local"
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not found in .env.local")
    exit(1)

# Sample content to seed
SAMPLE_CONTENT = [
    {
        "title": "Apple Q4 Earnings Beat Expectations",
        "description": "Apple Inc. reported quarterly earnings that exceeded analyst expectations, driven by strong iPhone sales.",
        "contentType": "WEB_ARTICLE",
        "date": datetime.now() - timedelta(days=2),
        "tickers": ["AAPL"],
        "sourceUrl": "https://example.com/apple-earnings",
        "sourceName": "MarketWatch",
        "status": "COMPLETED",
        "metadata": {"author": "John Doe", "tags": ["earnings", "tech"]},
    },
    {
        "title": "Tesla and Rivian: The EV Battle Heats Up",
        "description": "Analysis of the competitive landscape between Tesla and emerging EV manufacturers.",
        "contentType": "BLOG_POST",
        "date": datetime.now() - timedelta(days=5),
        "tickers": ["TSLA", "RIVN"],
        "sourceUrl": "https://example.com/ev-battle",
        "sourceName": "EV Insider Blog",
        "status": "COMPLETED",
        "metadata": {"readTime": "5 min"},
    },
    {
        "title": "Microsoft-Activision Merger Approved",
        "description": "Regulatory authorities approve Microsoft's acquisition of Activision Blizzard.",
        "contentType": "SPECIAL_EVENT",
        "date": datetime.now() - timedelta(days=10),
        "tickers": ["MSFT", "ATVI"],
        "sourceUrl": "https://example.com/msft-atvi-merger",
        "sourceName": "Financial Times",
        "status": "COMPLETED",
        "metadata": {"dealValue": "$69B", "type": "MERGER"},
    },
    {
        "title": "Fed Rate Decision Video Analysis",
        "description": "Expert commentary on the Federal Reserve's latest interest rate decision.",
        "contentType": "VIDEO",
        "date": datetime.now() - timedelta(days=1),
        "tickers": ["SPY", "QQQ"],
        "sourceUrl": "https://example.com/fed-rate-video",
        "sourceName": "Financial News Network",
        "status": "TRANSCRIBING",
        "metadata": {"duration": 1200, "videoPath": "/videos/fed-analysis.mp4"},
    },
    {
        "title": "NVIDIA AI Chip Shortage Impact",
        "description": "Breaking news on NVIDIA's supply chain challenges affecting AI chip availability.",
        "contentType": "NEWS",
        "date": datetime.now(),
        "tickers": ["NVDA"],
        "sourceUrl": "https://example.com/nvidia-shortage",
        "sourceName": "Bloomberg",
        "status": "PENDING",
        "metadata": {"breaking": True},
    },
]

def seed_database():
    """Insert sample content into the database."""
    try:
        conn = psycopg.connect(DATABASE_URL)
        cur = conn.cursor()
        
        print("Seeding database with sample content...")
        
        for content in SAMPLE_CONTENT:
            cur.execute(
                'SELECT id FROM "Content" WHERE "sourceUrl" = %s',
                (content["sourceUrl"],)
            )
            existing = cur.fetchone()
            
            if existing:
                print("  Skipping: " + content["title"] + " (already exists)")
                continue
            
            # Insert content
            cur.execute(
                '''INSERT INTO "Content" (
                    id, title, description, "contentType", date,
                    "sourceUrl", "sourceName", status, metadata, "createdAt", "updatedAt"
                ) VALUES (
                    replace(cast(gen_random_uuid() as text), '-', ''), %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW()
                ) RETURNING id''',
                (
                    content["title"],
                    content["description"],
                    content["contentType"],
                    content["date"],
                    content["sourceUrl"],
                    content["sourceName"],
                    content["status"],
                    json.dumps(content["metadata"]),
                )
            )
            content_id = cur.fetchone()[0]
            
            # Link companies
            for ticker in content["tickers"]:
                cur.execute(
                    'SELECT id FROM "Company" WHERE ticker = %s',
                    (ticker,)
                )
                company = cur.fetchone()
                
                if company:
                    company_id = company[0]
                    # Create ContentCompany relation
                    cur.execute(
                        '''INSERT INTO "ContentCompany" (
                            id, "contentId", "companyId", "createdAt"
                        ) VALUES (
                            replace(cast(gen_random_uuid() as text), '-', ''), %s, %s, NOW()
                        )''',
                        (content_id, company_id)
                    )
            
            print("  Added: " + content["title"])
        
        conn.commit()
        cur.close()
        conn.close()
        
        print("\nDatabase seeding completed successfully!")
        
    except Exception as e:
        print("\nError seeding database: " + str(e))
        exit(1)

if __name__ == "__main__":
    seed_database()
