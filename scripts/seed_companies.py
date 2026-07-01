# -*- coding: utf-8 -*-
"""
Seed Company Data
Populates the Company table with commonly mentioned stocks.
"""

import os
import sys
from dotenv import load_dotenv
import psycopg

# Load environment variables from parent directory
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(parent_dir, '.env.local')
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in environment variables")

# Common companies to seed
COMPANIES = [
    {
        "ticker": "AAPL",
        "name": "Apple Inc.",
        "description": "Technology company specializing in consumer electronics, software, and online services",
        "sector": "Technology",
        "industry": "Consumer Electronics",
        "website": "https://www.apple.com"
    },
    {
        "ticker": "MSFT",
        "name": "Microsoft Corporation",
        "description": "Technology company producing computer software, consumer electronics, and cloud services",
        "sector": "Technology",
        "industry": "Software - Infrastructure",
        "website": "https://www.microsoft.com"
    },
    {
        "ticker": "GOOGL",
        "name": "Alphabet Inc.",
        "description": "Multinational conglomerate specializing in Internet-related services and products",
        "sector": "Technology",
        "industry": "Internet Content & Information",
        "website": "https://www.google.com"
    },
    {
        "ticker": "AMZN",
        "name": "Amazon.com, Inc.",
        "description": "E-commerce, cloud computing, digital streaming, and artificial intelligence company",
        "sector": "Consumer Cyclical",
        "industry": "Internet Retail",
        "website": "https://www.amazon.com"
    },
    {
        "ticker": "NVDA",
        "name": "NVIDIA Corporation",
        "description": "Technology company designing graphics processing units and system on chip units",
        "sector": "Technology",
        "industry": "Semiconductors",
        "website": "https://www.nvidia.com"
    },
    {
        "ticker": "TSLA",
        "name": "Tesla, Inc.",
        "description": "Electric vehicle and clean energy company",
        "sector": "Consumer Cyclical",
        "industry": "Auto Manufacturers",
        "website": "https://www.tesla.com"
    },
    {
        "ticker": "META",
        "name": "Meta Platforms, Inc.",
        "description": "Social technology company operating Facebook, Instagram, WhatsApp, and Oculus",
        "sector": "Technology",
        "industry": "Internet Content & Information",
        "website": "https://www.meta.com"
    },
    {
        "ticker": "NFLX",
        "name": "Netflix, Inc.",
        "description": "Streaming entertainment service offering TV series and films",
        "sector": "Communication Services",
        "industry": "Entertainment",
        "website": "https://www.netflix.com"
    },
    {
        "ticker": "SPY",
        "name": "SPDR S&P 500 ETF Trust",
        "description": "Exchange-traded fund that tracks the S&P 500 stock market index",
        "sector": "ETF",
        "industry": "Broad Market ETF"
    },
    {
        "ticker": "QQQ",
        "name": "Invesco QQQ Trust",
        "description": "Exchange-traded fund that tracks the Nasdaq-100 Index",
        "sector": "ETF",
        "industry": "Technology ETF"
    },
    {
        "ticker": "RIVN",
        "name": "Rivian Automotive, Inc.",
        "description": "Electric vehicle manufacturer specializing in electric trucks and SUVs",
        "sector": "Consumer Cyclical",
        "industry": "Auto Manufacturers",
        "website": "https://www.rivian.com"
    },
    {
        "ticker": "ATVI",
        "name": "Activision Blizzard, Inc.",
        "description": "Video game holding company developing and publishing games",
        "sector": "Communication Services",
        "industry": "Electronic Gaming & Multimedia",
        "website": "https://www.activisionblizzard.com"
    }
]


def seed_companies():
    """Seed company data into the database"""
    print("Seeding companies...")
    
    conn = psycopg.connect(DATABASE_URL)
    cur = conn.cursor()
    
    try:
        for company in COMPANIES:
            # Check if company already exists
            cur.execute(
                "SELECT id FROM \"Company\" WHERE ticker = %s",
                (company["ticker"],)
            )
            existing = cur.fetchone()
            
            if existing:
                # Update existing company
                cur.execute(
                    """
                    UPDATE \"Company\"
                    SET name = %s,
                        description = %s,
                        sector = %s,
                        industry = %s,
                        website = %s,
                        \"updatedAt\" = NOW()
                    WHERE ticker = %s
                    """,
                    (
                        company["name"],
                        company.get("description"),
                        company.get("sector"),
                        company.get("industry"),
                        company.get("website"),
                        company["ticker"]
                    )
                )
                print(f"  Updated: {company['ticker']} - {company['name']}")
            else:
                # Insert new company
                cur.execute(
                    """
                    INSERT INTO \"Company\" (id, ticker, name, description, sector, industry, website, \"createdAt\", \"updatedAt\")
                    VALUES (
                        replace(cast(gen_random_uuid() as text), '-', ''),
                        %s, %s, %s, %s, %s, %s, NOW(), NOW()
                    )
                    """,
                    (
                        company["ticker"],
                        company["name"],
                        company.get("description"),
                        company.get("sector"),
                        company.get("industry"),
                        company.get("website")
                    )
                )
                print(f"  Added: {company['ticker']} - {company['name']}")
        
        conn.commit()
        print("\nCompany seeding completed successfully!")
        
    except Exception as e:
        conn.rollback()
        print(f"Error seeding companies: {e}")
        raise
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    seed_companies()
