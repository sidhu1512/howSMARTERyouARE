# How Smart Are You?

[**Launch Benchmark**](https://sidhu1512.github.io/howSMARTERyouARE/)

A web-based intelligence benchmark that evaluates human reasoning against state-of-the-art AI models (GPT-4, Claude 3, Llama 3) using official research datasets.

## Overview

This project provides a minimalist interface to take simplified versions of the actual tests used to evaluate Large Language Models (LLMs). It covers 12 distinct domains ranging from logic and physics to general knowledge and reading comprehension.

The application runs entirely on the client side (GitHub Pages) using a static sharding architecture, ensuring privacy and speed without a backend server.

## Benchmarks Included

The evaluation suite consists of 12 official datasets categorized into four core domains:

### Logic & Reasoning
* **HellaSwag:** Commonsense sentence completion.
* **Winogrande:** Resolving ambiguous language.
* **PIQA:** Physical interaction logic.
* **ARC:** Complex grade-school science reasoning.

### General Knowledge
* **MMLU:** Massive multitask knowledge across 57 subjects.
* **CommonsenseQA:** Questions requiring prior world knowledge.
* **TruthfulQA:** Measuring mimicry of human falsehoods.
* **OpenBookQA:** Open-resource exams.

### STEM
* **MathQA:** Mathematical reasoning and problem solving.
* **AQUA-RAT:** Algebra word problems with rationales.
* **SciQ:** Scientific exam questions.

### Language
* **RACE:** Large-scale reading comprehension.

## Technical Architecture

To serve over 10,000 questions efficiently without a database:
1.  **Data Pipeline:** A Python script downloads datasets from Hugging Face.
2.  **Sharding:** Data is cleaned, shuffled, and split into small JSON shards (50 questions each).
3.  **Client-Side Fetching:** The frontend requests specific shards on-demand based on a manifest file.


## Credits

**Built by Siddharth Bhadu**

Datasets provided by Hugging Face.
Comparison data sourced from official model technical reports (OpenAI, Anthropic, Meta, Google).
