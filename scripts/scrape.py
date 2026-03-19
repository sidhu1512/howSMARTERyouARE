"""
╔═══════════════════════════════════════════════════════════════╗
║  BENCHMARK SCRAPER — Downloads MCQ datasets from HuggingFace  ║
║  Saves raw data to scripts/raw_data/<dataset_name>.json       ║
╚═══════════════════════════════════════════════════════════════╝

Usage:
    pip install datasets
    python scrape.py
    python scrape.py --only siqa,medmcqa    # scrape specific datasets
"""

import os
import sys
import json
import argparse
from pathlib import Path

RAW_DIR = Path(__file__).parent / "raw_data"

# ──────────────────────────────────────────────
#  DATASET REGISTRY
#  Each entry: (hf_id, subset, split, max_rows)
# ──────────────────────────────────────────────
DATASETS = {
    # NEW datasets
    "siqa":        ("social_i_qa",              None,          "train",      2000),
    "medmcqa":     ("openlifescienceai/medmcqa", None,         "train",      3000),
    "logiqa":      ("lucasmccabe/logiqa",        None,         "train",      2000),
    "boolq":       ("google/boolq",              None,         "train",      1000),
    "copa":        ("pkavumba/balanced-copa",     None,         "train",       400),
    "swag":        ("allenai/swag",              "regular",    "train",      2000),
    "qasc":        ("allenai/qasc",              None,         "train",      1700),
    "gpqa":        ("Idavidrein/gpqa",           "gpqa_main",  "train",       448),
    # EXPAND existing datasets with more data
    "mmlu_extra":       ("cais/mmlu",            "all",        "test",       5000),
    "hellaswag_extra":  ("Rowan/hellaswag",      None,         "train",      3000),
    "arc_extra":        ("allenai/ai2_arc",      "ARC-Challenge", "train",   3000),
    "sciq_extra":       ("allenai/sciq",         None,         "train",      3000),
    "piqa_extra":       ("piqa",                 None,         "train",      2000),
    "commonsense_extra":("tau/commonsense_qa",   None,         "train",      2000),
    "winogrande_extra": ("allenai/winogrande",   "winogrande_xl","train",    2000),
    "truthfulqa_extra": ("truthfulqa/truthful_qa","multiple_choice","validation",500),
    "openbookqa_extra": ("allenai/openbookqa",   "main",       "train",      2000),
    "mathqa_extra":     ("math_qa",              None,         "train",      3000),
    "race_extra":       ("ehovy/race",           "high",       "train",      2000),
    "aqua_extra":       ("deepmind/aqua_rat",    None,         "train",      1000),
}


def scrape_dataset(name, hf_id, subset, split, max_rows):
    """Download a single dataset from HuggingFace and save as raw JSON."""
    from datasets import load_dataset
    
    print(f"\n{'='*60}")
    print(f"  📥 Downloading: {name}")
    print(f"     HuggingFace ID: {hf_id}")
    print(f"     Subset: {subset or 'default'} | Split: {split}")
    print(f"     Max rows: {max_rows}")
    print(f"{'='*60}")
    
    try:
        if subset:
            ds = load_dataset(hf_id, subset, split=split, trust_remote_code=True)
        else:
            ds = load_dataset(hf_id, split=split, trust_remote_code=True)
        
        # Take first max_rows
        if len(ds) > max_rows:
            ds = ds.select(range(max_rows))
        
        # Convert to list of dicts
        data = [dict(row) for row in ds]
        
        out_path = RAW_DIR / f"{name}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=None)
        
        print(f"  ✅ Saved {len(data)} rows → {out_path.name}")
        return len(data)
        
    except Exception as e:
        print(f"  ❌ FAILED: {e}")
        print(f"     Skipping {name}...")
        return 0


def main():
    parser = argparse.ArgumentParser(description="Scrape benchmark datasets from HuggingFace")
    parser.add_argument("--only", type=str, default=None,
                        help="Comma-separated list of dataset names to scrape (default: all)")
    args = parser.parse_args()
    
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    
    targets = DATASETS
    if args.only:
        names = [n.strip() for n in args.only.split(",")]
        targets = {k: v for k, v in DATASETS.items() if k in names}
        if not targets:
            print(f"❌ No matching datasets found. Available: {', '.join(DATASETS.keys())}")
            sys.exit(1)
    
    print(f"\n🚀 BENCHMARK SCRAPER")
    print(f"   Datasets to download: {len(targets)}")
    print(f"   Output directory: {RAW_DIR}")
    
    total = 0
    results = {}
    for name, (hf_id, subset, split, max_rows) in targets.items():
        count = scrape_dataset(name, hf_id, subset, split, max_rows)
        total += count
        results[name] = count
    
    print(f"\n{'='*60}")
    print(f"  🏁 SCRAPING COMPLETE")
    print(f"     Total rows downloaded: {total:,}")
    print(f"     Successful: {sum(1 for v in results.values() if v > 0)}/{len(results)}")
    for name, count in results.items():
        status = "✅" if count > 0 else "❌"
        print(f"     {status} {name}: {count:,}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
