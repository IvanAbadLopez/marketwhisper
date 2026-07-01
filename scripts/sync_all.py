"""
MarketWhisper - Sync Orchestrator
Runs the full sync pipeline: download video + scrape situations + transcribe + process.
Called by the Next.js API route via subprocess.
"""

import sys
import json
import argparse
from pathlib import Path
from datetime import datetime

from download_video import download_latest_video
from download_situations import scrape_situations
from transcribe import transcribe_video


def emit_progress(step: str, progress: int, message: str):
    """Print progress as JSON for the Next.js API to read via stdout."""
    print(json.dumps({
        "step": step,
        "progress": progress,
        "message": message,
        "timestamp": datetime.now().isoformat(),
    }), flush=True)


def sync_all(skip_video: bool = False, skip_situations: bool = False):
    """Run the full sync pipeline."""

    # Step 1: Download video
    if not skip_video:
        emit_progress("download", 0, "Connecting to analysis blog...")
        video_info = download_latest_video()

        if video_info:
            emit_progress("download", 50, f"Downloaded: {video_info['title']}")

            # Step 2: Transcribe
            emit_progress("transcribe", 0, "Starting transcription with Whisper...")
            transcript = transcribe_video(video_info["path"])
            emit_progress("transcribe", 100, f"Transcribed {len(transcript['segments'])} segments")
        else:
            emit_progress("download", 100, "No new video found")
    else:
        emit_progress("download", 100, "Video download skipped")

    # Step 3: Scrape special situations
    if not skip_situations:
        emit_progress("situations", 0, "Checking special situations blog...")
        situations = scrape_situations()
        emit_progress("situations", 100, f"Found {len(situations)} new situations")
    else:
        emit_progress("situations", 100, "Situations scraping skipped")

    # Step 4: Done
    emit_progress("complete", 100, "Sync completed successfully")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="MarketWhisper Sync Pipeline")
    parser.add_argument("--skip-video", action="store_true", help="Skip video download")
    parser.add_argument("--skip-situations", action="store_true", help="Skip situations scraping")
    args = parser.parse_args()

    sync_all(skip_video=args.skip_video, skip_situations=args.skip_situations)
