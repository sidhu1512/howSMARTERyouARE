"""
╔═══════════════════════════════════════════════════════════════╗
║  BENCHMARK PIPELINE — One-click runner                        ║
║  Runs: scrape → refactor → chunk in sequence                 ║
╚═══════════════════════════════════════════════════════════════╝

Usage:
    python run_all.py                  # Full pipeline
    python run_all.py --only siqa      # Single dataset
    python run_all.py --skip-scrape    # Re-chunk existing data
"""

import subprocess
import sys
import argparse
from pathlib import Path

SCRIPTS_DIR = Path(__file__).parent


def run_step(name, script, extra_args=None):
    """Run a pipeline step."""
    print(f"\n{'═'*60}")
    print(f"  🚀 STEP: {name}")
    print(f"{'═'*60}")
    
    cmd = [sys.executable, str(SCRIPTS_DIR / script)]
    if extra_args:
        cmd.extend(extra_args)
    
    result = subprocess.run(cmd, cwd=str(SCRIPTS_DIR))
    if result.returncode != 0:
        print(f"\n  ❌ {name} failed with exit code {result.returncode}")
        print(f"     You can re-run individual steps if needed.")
        return False
    return True


def main():
    parser = argparse.ArgumentParser(description="Run the full benchmark pipeline")
    parser.add_argument("--only", type=str, default=None, help="Comma-separated dataset names")
    parser.add_argument("--skip-scrape", action="store_true", help="Skip download step")
    parser.add_argument("--skip-refactor", action="store_true", help="Skip refactor step")
    args = parser.parse_args()
    
    extra = []
    if args.only:
        extra = ["--only", args.only]
    
    print(f"\n{'═'*60}")
    print(f"  ⚡ BENCHMARK DATA PIPELINE")
    print(f"     Scrape → Refactor → Chunk")
    print(f"{'═'*60}")
    
    if not args.skip_scrape:
        if not run_step("SCRAPE from HuggingFace", "scrape.py", extra):
            sys.exit(1)
    else:
        print("\n  ⏭  Skipping scrape step")
    
    if not args.skip_refactor:
        if not run_step("REFACTOR into standard format", "refactor.py", extra):
            sys.exit(1)
    else:
        print("\n  ⏭  Skipping refactor step")
    
    if not run_step("CHUNK into JSON files", "chunk.py", extra):
        sys.exit(1)
    
    print(f"\n{'═'*60}")
    print(f"  🎉 PIPELINE COMPLETE!")
    print(f"     Your data is ready in howSMARTERyouARE/data/")
    print(f"{'═'*60}\n")


if __name__ == "__main__":
    main()
