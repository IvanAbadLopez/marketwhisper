"""
MarketWhisper - Audio Transcription with Whisper
Transcribes downloaded videos using OpenAI Whisper (local).
"""

import sys
import json
from pathlib import Path
from datetime import datetime

import whisper


DOWNLOADS_DIR = Path(__file__).resolve().parent.parent / "downloads"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "downloads" / "transcripts"


def transcribe_video(video_path: str, model_name: str = "medium") -> dict:
    """
    Transcribe a video file using Whisper.

    Args:
        video_path: Path to the video/audio file
        model_name: Whisper model to use (tiny, base, small, medium, large-v3)

    Returns:
        Dict with full transcript and segments with timestamps
    """
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"Loading Whisper model '{model_name}'...")
    model = whisper.load_model(model_name)

    print(f"Transcribing: {video_path}")
    result = model.transcribe(
        video_path,
        language="es",  # Spanish - adjust if needed
        verbose=True,
    )

    # Structure output
    output = {
        "file": video_path,
        "model": model_name,
        "language": result.get("language", "es"),
        "duration": result["segments"][-1]["end"] if result["segments"] else 0,
        "full_text": result["text"],
        "segments": [
            {
                "start": seg["start"],
                "end": seg["end"],
                "text": seg["text"].strip(),
            }
            for seg in result["segments"]
        ],
        "transcribed_at": datetime.now().isoformat(),
    }

    # Save JSON output
    output_file = OUTPUT_DIR / f"{Path(video_path).stem}_transcript.json"
    output_file.write_text(json.dumps(output, ensure_ascii=False, indent=2))
    print(f"Transcript saved to: {output_file}")

    return output


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python transcribe.py <video_path> [model_name]")
        print("Models: tiny, base, small, medium (recommended), large-v3 (best)")
        sys.exit(1)

    video_file = sys.argv[1]
    model = sys.argv[2] if len(sys.argv) > 2 else "medium"

    if not Path(video_file).exists():
        print(f"ERROR: File not found: {video_file}")
        sys.exit(1)

    result = transcribe_video(video_file, model)
    print(f"\nDone! {len(result['segments'])} segments transcribed.")
    print(f"Duration: {result['duration']:.1f}s")
