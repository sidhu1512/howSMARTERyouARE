"""
╔═══════════════════════════════════════════════════════════════╗
║  BENCHMARK CHUNKER — Splits clean data into 50-question JSON  ║
║  files and outputs them to data/<category>/                   ║
║  Auto-updates manifest.json with chunk counts                 ║
╚═══════════════════════════════════════════════════════════════╝

Usage:  python chunk.py
        python chunk.py --only siqa,medmcqa
        python chunk.py --size 50   (questions per chunk, default 50)
"""

import os
import sys
import json
import random
import argparse
from pathlib import Path

CLEAN_DIR = Path(__file__).parent / "clean_data"
DATA_DIR = Path(__file__).parent.parent / "data"
CHUNK_SIZE = 50


def chunk_dataset(name, chunk_size):
    """Split a clean dataset into numbered JSON chunks."""
    clean_path = CLEAN_DIR / f"{name}.json"
    if not clean_path.exists():
        print(f"  ⏭  Skipping {name} — no clean data found")
        return 0
    
    with open(clean_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    if not data:
        print(f"  ⏭  Skipping {name} — empty dataset")
        return 0
    
    # Shuffle for variety
    random.shuffle(data)
    
    # Create output directory
    out_dir = DATA_DIR / name
    out_dir.mkdir(parents=True, exist_ok=True)
    
    # If the directory already has existing chunks, we KEEP them and add new ones
    # Find highest existing file number
    existing_files = list(out_dir.glob("*.json"))
    existing_numbers = set()
    for f in existing_files:
        try:
            existing_numbers.add(int(f.stem))
        except ValueError:
            pass
    
    # Load all existing questions to avoid duplicates
    existing_questions = set()
    for f in existing_files:
        try:
            num = int(f.stem)
            with open(f, "r", encoding="utf-8") as fh:
                existing_data = json.load(fh)
                for item in existing_data:
                    if isinstance(item, dict) and "question" in item:
                        existing_questions.add(item["question"][:100])  # First 100 chars
        except (ValueError, json.JSONDecodeError):
            pass
    
    # Filter out duplicates
    new_data = [item for item in data if item["question"][:100] not in existing_questions]
    
    if not new_data and existing_numbers:
        print(f"  ℹ️  {name}: No new questions to add ({len(existing_numbers)} existing chunks)")
        return len(existing_numbers)
    
    # If no existing data, use all data
    if not existing_numbers:
        new_data = data
    
    # Chunk new data
    start_num = max(existing_numbers) + 1 if existing_numbers else 0
    chunks = [new_data[i:i + chunk_size] for i in range(0, len(new_data), chunk_size)]
    
    for i, chunk in enumerate(chunks):
        file_num = start_num + i
        out_path = out_dir / f"{file_num}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(chunk, f, ensure_ascii=False)
    
    total_chunks = len(existing_numbers) + len(chunks)
    print(f"  ✅ {name}: {len(chunks)} new chunks (total: {total_chunks} chunks, {len(new_data)} new Qs)")
    return total_chunks


def update_manifest(chunk_counts):
    """Update manifest.json with chunk counts for all categories."""
    manifest_path = DATA_DIR / "manifest.json"
    
    # Load existing manifest
    if manifest_path.exists():
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
    else:
        manifest = {}
    
    # Update with new counts
    for name, count in chunk_counts.items():
        if count > 0:
            manifest[name] = count
    
    # Write back
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=4, ensure_ascii=False)
    
    print(f"\n  📋 Updated manifest.json ({len(manifest)} categories)")
    return manifest


def main():
    parser = argparse.ArgumentParser(description="Chunk clean data into JSON files")
    parser.add_argument("--only", type=str, default=None, help="Comma-separated dataset names")
    parser.add_argument("--size", type=int, default=CHUNK_SIZE, help="Questions per chunk")
    args = parser.parse_args()
    
    chunk_size = args.size
    
    # Find all clean datasets
    clean_files = sorted(CLEAN_DIR.glob("*.json")) if CLEAN_DIR.exists() else []
    
    if args.only:
        names = [n.strip() for n in args.only.split(",")]
        clean_files = [f for f in clean_files if f.stem in names]
    
    if not clean_files:
        print("❌ No clean data files found. Run refactor.py first.")
        sys.exit(1)
    
    print(f"\n📦 BENCHMARK CHUNKER")
    print(f"   Chunk size: {chunk_size} questions")
    print(f"   Datasets to chunk: {len(clean_files)}")
    print(f"   Output: {DATA_DIR}")
    
    chunk_counts = {}
    total_chunks = 0
    
    for clean_file in clean_files:
        name = clean_file.stem
        count = chunk_dataset(name, chunk_size)
        chunk_counts[name] = count
        total_chunks += count
    
    # Update manifest.json
    manifest = update_manifest(chunk_counts)
    
    print(f"\n{'='*60}")
    print(f"  🏁 CHUNKING COMPLETE")
    print(f"     Total chunk files: {total_chunks:,}")
    print(f"     Categories: {len(chunk_counts)}")
    for name, count in sorted(chunk_counts.items()):
        print(f"     📁 {name}/: {count} chunks")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
