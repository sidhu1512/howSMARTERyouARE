"""
╔════════════════════════════════════════════════════════════════════╗
║  BENCHMARK REFACTOR — Normalizes raw HuggingFace data into the    ║
║  site's standard format: {id, question, options[], answer}        ║
║  Handles 2-5 option questions, cleans text, validates entries     ║
╚════════════════════════════════════════════════════════════════════╝

Usage:  python refactor.py
        python refactor.py --only siqa,medmcqa
"""

import os
import sys
import json
import re
import argparse
import random
import unicodedata
from pathlib import Path

RAW_DIR = Path(__file__).parent / "raw_data"
CLEAN_DIR = Path(__file__).parent / "clean_data"


# ══════════════════════════════════════════════
#  TEXT CLEANING UTILITIES
# ══════════════════════════════════════════════

def clean_text(s):
    """Clean and normalize a text string."""
    if not s or not isinstance(s, str):
        return ""
    s = unicodedata.normalize("NFC", s)
    # Collapse whitespace
    s = re.sub(r"[\t\r]+", " ", s)
    s = re.sub(r"  +", " ", s)
    # Fix spacing before punctuation
    s = re.sub(r"\s+([,.?!:;%])", r"\1", s)
    return s.strip()


def is_valid_entry(entry):
    """Validate a normalized entry has all required fields and sane values."""
    if not isinstance(entry, dict):
        return False
    if "question" not in entry or not entry["question"]:
        return False
    if "options" not in entry or not isinstance(entry["options"], list):
        return False
    if len(entry["options"]) < 2:
        return False
    if any(not opt or not isinstance(opt, str) for opt in entry["options"]):
        return False
    if "answer" not in entry or not isinstance(entry["answer"], int):
        return False
    if entry["answer"] < 0 or entry["answer"] >= len(entry["options"]):
        return False
    # Skip questions that are too short
    if len(entry["question"]) < 10:
        return False
    return True


# ══════════════════════════════════════════════
#  PER-DATASET TRANSFORMERS
#  Each returns a list of normalized entries.
#  Handles variable option counts (2-5 options).
# ══════════════════════════════════════════════

def transform_siqa(data):
    """Social IQa: answerA/B/C + label → options + answer"""
    results = []
    for i, row in enumerate(data):
        ctx = clean_text(row.get("context", ""))
        q = clean_text(row.get("question", ""))
        question = f"{ctx} {q}" if ctx else q
        
        options = [
            clean_text(row.get("answerA", "")),
            clean_text(row.get("answerB", "")),
            clean_text(row.get("answerC", "")),
        ]
        # Remove empty options
        options = [o for o in options if o]
        
        label = row.get("label", "")
        try:
            answer = int(label) - 1  # labels are 1-indexed
        except (ValueError, TypeError):
            continue
        
        if 0 <= answer < len(options):
            results.append({"id": i, "question": question, "options": options, "answer": answer})
    return results


def transform_medmcqa(data):
    """MedMCQA: opa/opb/opc/opd + cop → options + answer"""
    results = []
    for i, row in enumerate(data):
        q = clean_text(row.get("question", ""))
        exp = clean_text(row.get("exp", ""))
        
        options = []
        for key in ["opa", "opb", "opc", "opd"]:
            opt = clean_text(row.get(key, ""))
            if opt:
                options.append(opt)
        
        answer = row.get("cop", None)
        if answer is None:
            continue
        try:
            answer = int(answer)
        except (ValueError, TypeError):
            continue
        
        if 0 <= answer < len(options) and q:
            results.append({"id": i, "question": q, "options": options, "answer": answer})
    return results


def transform_logiqa(data):
    """LogiQA: context + query + options + correct_option"""
    results = []
    for i, row in enumerate(data):
        ctx = clean_text(row.get("context", ""))
        query = clean_text(row.get("query", row.get("question", "")))
        question = f"{ctx}\n\n{query}" if ctx else query
        
        options = row.get("options", [])
        if isinstance(options, list):
            options = [clean_text(o) for o in options if o]
        else:
            continue
        
        answer = row.get("correct_option", row.get("answer", None))
        if answer is None:
            continue
        try:
            answer = int(answer)
        except (ValueError, TypeError):
            continue
        
        if 0 <= answer < len(options) and question:
            results.append({"id": i, "question": question, "options": options, "answer": answer})
    return results


def transform_boolq(data):
    """BoolQ: passage + question + answer (bool) → MCQ with True/False + 2 distractors"""
    results = []
    for i, row in enumerate(data):
        passage = clean_text(row.get("passage", ""))
        q = clean_text(row.get("question", ""))
        ans = row.get("answer", None)
        
        if not q or ans is None:
            continue
        
        # Create a short context + question
        # Truncate passage if too long
        if len(passage) > 400:
            passage = passage[:400] + "..."
        
        question = f"{passage}\n\nQuestion: {q}"
        options = ["True", "False"]
        answer = 0 if ans else 1
        
        results.append({"id": i, "question": question, "options": options, "answer": answer})
    return results


def transform_copa(data):
    """COPA: premise + question + choice1/choice2 + label"""
    results = []
    for i, row in enumerate(data):
        premise = clean_text(row.get("premise", ""))
        q_type = row.get("question", "effect")  # "cause" or "effect"
        
        if q_type == "cause":
            question = f"{premise}\n\nWhat was the cause of this?"
        else:
            question = f"{premise}\n\nWhat happened as a result?"
        
        options = [
            clean_text(row.get("choice1", "")),
            clean_text(row.get("choice2", "")),
        ]
        options = [o for o in options if o]
        
        answer = row.get("label", None)
        if answer is None:
            continue
        try:
            answer = int(answer)
        except (ValueError, TypeError):
            continue
        
        if 0 <= answer < len(options) and question:
            results.append({"id": i, "question": question, "options": options, "answer": answer})
    return results


def transform_swag(data):
    """SWAG: startphrase + sent2 context + ending0-3 + label"""
    results = []
    for i, row in enumerate(data):
        ctx = clean_text(row.get("startphrase", row.get("sent1", "")))
        question = f"{ctx}\n\nWhat happens next?"
        
        options = []
        for key in ["ending0", "ending1", "ending2", "ending3"]:
            opt = clean_text(row.get(key, ""))
            if opt:
                options.append(opt)
        
        answer = row.get("label", None)
        if answer is None:
            continue
        try:
            answer = int(answer)
        except (ValueError, TypeError):
            continue
        
        if 0 <= answer < len(options) and ctx:
            results.append({"id": i, "question": question, "options": options, "answer": answer})
    return results


def transform_qasc(data):
    """QASC: question + choices (usually a dict with labels/text)"""
    results = []
    for i, row in enumerate(data):
        q = clean_text(row.get("question", ""))
        
        choices = row.get("choices", {})
        if isinstance(choices, dict):
            labels = choices.get("label", [])
            texts = choices.get("text", [])
            options = [clean_text(t) for t in texts if t]
        elif isinstance(choices, list):
            options = [clean_text(c) for c in choices if c]
            labels = []
        else:
            continue
        
        answer_key = row.get("answerKey", "")
        # Convert letter to index
        if answer_key and answer_key.isalpha():
            answer = ord(answer_key.upper()) - ord("A")
        else:
            try:
                answer = int(answer_key) if answer_key else -1
            except ValueError:
                continue
        
        if 0 <= answer < len(options) and q:
            results.append({"id": i, "question": q, "options": options, "answer": answer})
    return results


def transform_gpqa(data):
    """GPQA: Question + (Correct Answer, Incorrect Answer 1-3)"""
    results = []
    for i, row in enumerate(data):
        q = clean_text(row.get("Question", row.get("question", "")))
        
        correct = clean_text(row.get("Correct Answer", ""))
        wrong1 = clean_text(row.get("Incorrect Answer 1", ""))
        wrong2 = clean_text(row.get("Incorrect Answer 2", ""))
        wrong3 = clean_text(row.get("Incorrect Answer 3", ""))
        
        if not correct or not q:
            continue
        
        options = [o for o in [correct, wrong1, wrong2, wrong3] if o]
        if len(options) < 2:
            continue
        
        # Shuffle options but track correct answer
        answer = 0  # correct is first
        combined = list(zip(options, [True] + [False] * (len(options) - 1)))
        random.shuffle(combined)
        options = [c[0] for c in combined]
        answer = next(i for i, c in enumerate(combined) if c[1])
        
        results.append({"id": i, "question": q, "options": options, "answer": answer})
    return results


def transform_mmlu(data):
    """MMLU: question + choices + answer (0-3 index)"""
    results = []
    for i, row in enumerate(data):
        q = clean_text(row.get("question", ""))
        choices = row.get("choices", [])
        if isinstance(choices, list):
            options = [clean_text(c) for c in choices if c]
        else:
            continue
        
        answer = row.get("answer", None)
        if answer is None:
            continue
        try:
            answer = int(answer)
        except (ValueError, TypeError):
            continue
        
        if 0 <= answer < len(options) and q:
            results.append({"id": i, "question": q, "options": options, "answer": answer})
    return results


def transform_hellaswag(data):
    """HellaSwag: ctx_a + ctx_b context, endings[], label"""
    results = []
    for i, row in enumerate(data):
        ctx = clean_text(row.get("ctx", row.get("ctx_a", "")))
        ctx_b = clean_text(row.get("ctx_b", ""))
        if ctx_b:
            ctx = f"{ctx} {ctx_b}"
        
        question = f"{ctx}\n\nWhat comes next?"
        
        endings = row.get("endings", [])
        if isinstance(endings, list):
            options = [clean_text(e) for e in endings if e]
        else:
            continue
        
        answer = row.get("label", None)
        if answer is None or answer == "":
            continue
        try:
            answer = int(answer)
        except (ValueError, TypeError):
            continue
        
        if 0 <= answer < len(options) and ctx:
            results.append({"id": i, "question": question, "options": options, "answer": answer})
    return results


def transform_arc(data):
    """ARC: question + choices{label,text} + answerKey"""
    results = []
    for i, row in enumerate(data):
        q = clean_text(row.get("question", ""))
        
        choices = row.get("choices", {})
        if isinstance(choices, dict):
            texts = choices.get("text", [])
            options = [clean_text(t) for t in texts if t]
        elif isinstance(choices, list):
            options = [clean_text(c.get("text", c) if isinstance(c, dict) else c) for c in choices]
        else:
            continue
        
        answer_key = row.get("answerKey", "")
        if answer_key and answer_key.isalpha():
            answer = ord(answer_key.upper()) - ord("A")
        else:
            try:
                answer = int(answer_key) - 1 if answer_key else -1
            except ValueError:
                continue
        
        if 0 <= answer < len(options) and q:
            results.append({"id": i, "question": q, "options": options, "answer": answer})
    return results


def transform_sciq(data):
    """SciQ: question + correct_answer + distractor1-3"""
    results = []
    for i, row in enumerate(data):
        q = clean_text(row.get("question", ""))
        correct = clean_text(row.get("correct_answer", ""))
        d1 = clean_text(row.get("distractor1", ""))
        d2 = clean_text(row.get("distractor2", ""))
        d3 = clean_text(row.get("distractor3", ""))
        
        if not correct or not q:
            continue
        
        options = [o for o in [correct, d1, d2, d3] if o]
        if len(options) < 2:
            continue
        
        combined = list(zip(options, [True] + [False] * (len(options) - 1)))
        random.shuffle(combined)
        options = [c[0] for c in combined]
        answer = next(i for i, c in enumerate(combined) if c[1])
        
        results.append({"id": i, "question": q, "options": options, "answer": answer})
    return results


def transform_piqa(data):
    """PIQA: goal + sol1/sol2 + label"""
    results = []
    for i, row in enumerate(data):
        q = clean_text(row.get("goal", ""))
        sol1 = clean_text(row.get("sol1", ""))
        sol2 = clean_text(row.get("sol2", ""))
        
        if not q or not sol1 or not sol2:
            continue
        
        options = [sol1, sol2]
        answer = row.get("label", None)
        if answer is None:
            continue
        try:
            answer = int(answer)
        except (ValueError, TypeError):
            continue
        
        if 0 <= answer < len(options):
            results.append({"id": i, "question": q, "options": options, "answer": answer})
    return results


def transform_commonsense(data):
    """CommonsenseQA: question + choices{label,text} + answerKey"""
    return transform_arc(data)  # Same format as ARC


def transform_winogrande(data):
    """Winogrande: sentence (with _) + option1/option2 + answer"""
    results = []
    for i, row in enumerate(data):
        sentence = clean_text(row.get("sentence", ""))
        opt1 = clean_text(row.get("option1", ""))
        opt2 = clean_text(row.get("option2", ""))
        
        if not sentence or not opt1 or not opt2:
            continue
        
        # Replace _ with blank indicator
        question = sentence.replace("_", "______")
        options = [opt1, opt2]
        
        answer = row.get("answer", None)
        if answer is None or answer == "":
            continue
        try:
            answer = int(answer) - 1  # 1-indexed
        except (ValueError, TypeError):
            continue
        
        if 0 <= answer < len(options):
            results.append({"id": i, "question": question, "options": options, "answer": answer})
    return results


def transform_truthfulqa(data):
    """TruthfulQA (multiple_choice): question + mc1_targets or mc2_targets"""
    results = []
    for i, row in enumerate(data):
        q = clean_text(row.get("question", ""))
        
        # mc1_targets has {choices: [...], labels: [0,1,...]}
        targets = row.get("mc1_targets", row.get("mc2_targets", {}))
        if isinstance(targets, dict):
            choices = targets.get("choices", [])
            labels = targets.get("labels", [])
            options = [clean_text(c) for c in choices[:5]]  # Max 5 options
            # Find correct answer (label=1)
            answer = -1
            for j, label in enumerate(labels[:5]):
                if label == 1:
                    answer = j
                    break
        else:
            continue
        
        if answer >= 0 and answer < len(options) and q and len(options) >= 2:
            results.append({"id": i, "question": q, "options": options, "answer": answer})
    return results


def transform_openbookqa(data):
    """OpenBookQA: same format as ARC"""
    return transform_arc(data)


def transform_mathqa(data):
    """MathQA: Problem + options (string with a,b,c,d,e) + correct"""
    results = []
    for i, row in enumerate(data):
        q = clean_text(row.get("Problem", row.get("problem", "")))
        
        # Options come as string: "a ) 123 , b ) 456 , c ) 789 , d ) 012 , e ) 345"
        opts_raw = row.get("options", "")
        if isinstance(opts_raw, str):
            # Parse "a ) val , b ) val , ..."
            parts = re.split(r"[a-e]\s*\)", opts_raw)
            options = [clean_text(p.strip().rstrip(",")) for p in parts if p.strip().rstrip(",")]
        elif isinstance(opts_raw, list):
            options = [clean_text(o) for o in opts_raw if o]
        else:
            continue
        
        correct = row.get("correct", row.get("answer", ""))
        if isinstance(correct, str) and correct.isalpha():
            answer = ord(correct.lower()) - ord("a")
        else:
            try:
                answer = int(correct)
            except (ValueError, TypeError):
                continue
        
        if 0 <= answer < len(options) and q and len(options) >= 2:
            results.append({"id": i, "question": q, "options": options, "answer": answer})
    return results


def transform_race(data):
    """RACE: article + question + options + answer (A/B/C/D)"""
    results = []
    for i, row in enumerate(data):
        article = clean_text(row.get("article", ""))
        q = clean_text(row.get("question", ""))
        
        # Truncate article if too long
        if len(article) > 500:
            article = article[:500] + "..."
        
        question = f"{article}\n\n{q}" if article else q
        
        options = row.get("options", [])
        if isinstance(options, list):
            options = [clean_text(o) for o in options if o]
        else:
            continue
        
        answer_key = row.get("answer", "")
        if answer_key and answer_key.isalpha():
            answer = ord(answer_key.upper()) - ord("A")
        else:
            try:
                answer = int(answer_key) if answer_key else -1
            except ValueError:
                continue
        
        if 0 <= answer < len(options) and question and len(options) >= 2:
            results.append({"id": i, "question": question, "options": options, "answer": answer})
    return results


def transform_aqua(data):
    """AQUA-RAT: question + options (list of strings like "A)..." ) + correct"""
    results = []
    for i, row in enumerate(data):
        q = clean_text(row.get("question", ""))
        
        opts_raw = row.get("options", [])
        if isinstance(opts_raw, list):
            # Strip letter prefixes like "A)", "B)", etc.
            options = []
            for o in opts_raw:
                o = clean_text(o)
                o = re.sub(r"^[A-E]\)\s*", "", o)
                if o:
                    options.append(o)
        else:
            continue
        
        correct = row.get("correct", "")
        if isinstance(correct, str) and correct.isalpha():
            answer = ord(correct.upper()) - ord("A")
        else:
            try:
                answer = int(correct) if correct else -1
            except ValueError:
                continue
        
        if 0 <= answer < len(options) and q and len(options) >= 2:
            results.append({"id": i, "question": q, "options": options, "answer": answer})
    return results


# ══════════════════════════════════════════════
#  TRANSFORMER REGISTRY
# ══════════════════════════════════════════════

TRANSFORMERS = {
    "siqa":             transform_siqa,
    "medmcqa":          transform_medmcqa,
    "logiqa":           transform_logiqa,
    "boolq":            transform_boolq,
    "copa":             transform_copa,
    "swag":             transform_swag,
    "qasc":             transform_qasc,
    "gpqa":             transform_gpqa,
    "mmlu_extra":       transform_mmlu,
    "hellaswag_extra":  transform_hellaswag,
    "arc_extra":        transform_arc,
    "sciq_extra":       transform_sciq,
    "piqa_extra":       transform_piqa,
    "commonsense_extra":transform_commonsense,
    "winogrande_extra": transform_winogrande,
    "truthfulqa_extra": transform_truthfulqa,
    "openbookqa_extra": transform_openbookqa,
    "mathqa_extra":     transform_mathqa,
    "race_extra":       transform_race,
    "aqua_extra":       transform_aqua,
}

# Map _extra datasets to their site category for merging
MERGE_MAP = {
    "mmlu_extra":       "mmlu",
    "hellaswag_extra":  "hellaswag",
    "arc_extra":        "arc",
    "sciq_extra":       "sciq",
    "piqa_extra":       "piqa",
    "commonsense_extra":"commonsense",
    "winogrande_extra": "winogrande",
    "truthfulqa_extra": "truthfulqa",
    "openbookqa_extra": "openbook",
    "mathqa_extra":     "mathqa",
    "race_extra":       "race",
    "aqua_extra":       "aqua",
}


def main():
    parser = argparse.ArgumentParser(description="Refactor raw HF data into site format")
    parser.add_argument("--only", type=str, default=None, help="Comma-separated dataset names")
    args = parser.parse_args()
    
    CLEAN_DIR.mkdir(parents=True, exist_ok=True)
    
    targets = TRANSFORMERS
    if args.only:
        names = [n.strip() for n in args.only.split(",")]
        targets = {k: v for k, v in TRANSFORMERS.items() if k in names}
    
    print(f"\n🔧 BENCHMARK REFACTOR")
    print(f"   Datasets to transform: {len(targets)}")
    
    total = 0
    results = {}
    
    for name, transformer in targets.items():
        raw_path = RAW_DIR / f"{name}.json"
        if not raw_path.exists():
            print(f"  ⏭  Skipping {name} — no raw data file found")
            results[name] = 0
            continue
        
        print(f"\n  🔄 Transforming: {name}")
        with open(raw_path, "r", encoding="utf-8") as f:
            raw = json.load(f)
        
        cleaned = transformer(raw)
        # Filter valid entries
        cleaned = [e for e in cleaned if is_valid_entry(e)]
        # Re-assign sequential IDs
        for idx, entry in enumerate(cleaned):
            entry["id"] = idx
        
        # Determine output name (merge _extra into base category)
        out_name = MERGE_MAP.get(name, name)
        out_path = CLEAN_DIR / f"{out_name}.json"
        
        # If this is an _extra dataset and the base clean file exists, append
        if name in MERGE_MAP and out_path.exists():
            with open(out_path, "r", encoding="utf-8") as f:
                existing = json.load(f)
            # De-duplicate by question text
            existing_qs = {e["question"] for e in existing}
            new_entries = [e for e in cleaned if e["question"] not in existing_qs]
            start_id = max(e["id"] for e in existing) + 1 if existing else 0
            for idx, entry in enumerate(new_entries):
                entry["id"] = start_id + idx
            existing.extend(new_entries)
            cleaned = existing
            print(f"     Merged {len(new_entries)} new Qs into {out_name} (total: {len(cleaned)})")
        
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(cleaned, f, ensure_ascii=False)
        
        count = len(cleaned)
        total += count
        results[name] = count
        print(f"  ✅ {out_name}: {count:,} valid questions")
    
    print(f"\n{'='*60}")
    print(f"  🏁 REFACTOR COMPLETE")
    print(f"     Total clean questions: {total:,}")
    for name, count in results.items():
        out_name = MERGE_MAP.get(name, name)
        status = "✅" if count > 0 else "⏭ "
        print(f"     {status} {out_name}: {count:,}")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
