# Portfolio Analyzer

Complete backend system to analyze design portfolios and case studies using web scraping and AI analysis.

## 🚀 Quick Start

### Installation
```bash
pip install -r requirements.txt
playwright install chromium
```

### Usage
```bash
python main.py
```

Enter a portfolio URL when prompted (Behance, Designfolio, Notion, or any website).

## 📁 Structure

- `main.py` - Entry point
- `main_page.py` - Platform detection
- `final.py` - Orchestration
- `scrapers/` - Platform-specific scrapers
- `analysis/` - Analysis modules
- `utils/` - Helper utilities
- `reports/` - Generated JSON reports

## 🔑 Optional: Real Gemini Analysis

Set API key for real analysis:
```bash
export GEMINI_API_KEY="your-key"
```

Without key, uses mock analysis.

## 📊 Output

All reports saved in `/reports`:
- Main portfolio analysis
- Individual project analyses
- Screenshots

## 🛠️ Customization

Easy to extend with new platforms or modify analysis prompts.

See README for full documentation.
