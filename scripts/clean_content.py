# -*- coding: utf-8 -*-
import os
import sys
from dotenv import load_dotenv
import psycopg
from pathlib import Path

# Load environment variables from parent directory
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(parent_dir, '.env.local')
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg.connect(DATABASE_URL)
cur = conn.cursor()

cur.execute('DELETE FROM "Content"')
conn.commit()

print("Content deleted successfully")
