"""
Handles scraping based on platform type and coordinates Gemini analysis
"""
import os
import json
from urllib.parse import urlparse

from scrapers import behance, designfolio, notion, normal_scraper
from analysis import casestudies
from utils.gemini_api import analyze_content


def get_clean_filename(url):
    """Extract clean filename from URL"""
    parsed = urlparse(url)
    domain = parsed.netloc.replace('.', '_')
    return domain or "portfolio"


def extract_portfolio(url, platform):
    """
    Scrape portfolio → Send to Gemini → Save portfolio JSON → Extract project links → Analyze each project

    Returns:
        {
            "success": True,
            "main_report": "reports/xxx.json",
            "structured_content": {...},
            "analysis": {...},
            "project_links": [...],
            "project_reports_count": 0
        }
    """
    print(f"📥 Extracting portfolio data from {platform}...")

    # --------------------------
    # 1. SCRAPE BASED ON PLATFORM
    # --------------------------
    if platform == "behance":
        scraped_data = behance.extract(url)
    elif platform == "designfolio":
        scraped_data = designfolio.extract(url)
    elif platform == "notion":
        scraped_data = notion.extract(url)
    else:
        scraped_data = normal_scraper.extract(url)

    if not scraped_data:
        return {"success": False, "error": "Failed to scrape portfolio"}

    print("✅ Portfolio data extracted\n")
    print("SCRAPED_DATA : \n\n",scraped_data,"\n\n")

    # --------------------------
    # 2. RUN GEMINI MAIN-PAGE PROMPT
    # --------------------------

    print("🧠 Analyzing portfolio with Gemini...")

    prompt = f"""
You are an expert UI/UX portfolio analyzer.

Analyze this portfolio based on the extracted content and links.

URL: {url}

TEXT CONTENT (first 2000 chars):
{json.dumps(scraped_data.get('content', '')[:2000], indent=2)}

ANCHOR LINKS (first 50):
{json.dumps(scraped_data.get('links', [])[:50], indent=2)}

Return ONLY valid JSON (no markdown, no descriptions). Use EXACTLY this format:

{{
  "url": "{url}",

  "structured_content": {{
    "hero": "",
    "about": "",
    "skills": [],
    "projects": [
      {{
        "name": "",
        "url": ""
      }}
    ],
    "contact": {{
      "email": "",
      "phone": "",
      "socials": [
        {{
          "platform": "",
          "url": ""
        }}
      ]
    }},
    "all_links": [
      {{
        "text": "",
        "href": ""
      }}
    ]
  }},

  "analysis": {{
    "overall score": "xx/100"
    "overall_feedback": "",
    "section_wise": [
      {{
        "section": "",
        "existing": "",
        "suggestion": "",
        "improved_example": ""
      }}
    ]
  }}
}}
"""

    try:
        gemini_response = analyze_content(prompt, scraped_data)
        print("✅ Gemini analysis successful\n")
        print("\n\n",gemini_response,"\n\n")
    except Exception as e:
        print(f"❌ Gemini failed: {e}")
        return {"success": False, "error": "Gemini main analysis failed"}

    # --------------------------
    # 3. SAVE MAIN REPORT
    # --------------------------
    filename = get_clean_filename(url)
    main_json_path = f"backend/reports/{filename}_main_portfolio.json"

    with open(main_json_path, "w", encoding="utf-8") as f:
      json.dump(gemini_response, f, indent=2, ensure_ascii=False)

    print(f"📁 Main portfolio report saved: {main_json_path}\n")

    # Upload main report to GCS
    from utils.gcs_utils import upload_file_to_gcs
    from datetime import datetime
    parent_slug = get_clean_filename(url)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    gcs_folder = f"{parent_slug}_{timestamp}/"
    gcs_main_path = gcs_folder + os.path.basename(main_json_path)
    gcs_main_url = upload_file_to_gcs(main_json_path, gcs_main_path)
    print(f"[GCS] Uploaded main report to: {gcs_main_url}")

    # --------------------------
    # 4. EXTRACT PROJECT LINKS (NEW LOGIC)
    # --------------------------
    print("🔗 Extracting project links from structured_content.projects...")

    structured = gemini_response.get("structured_content", {})
    projects = structured.get("projects", [])

    project_links = [
        p.get("url") for p in projects
        if isinstance(p, dict) and p.get("url")
    ]

    project_links = list(dict.fromkeys(project_links))  # remove duplicates
    print(f"✅ Found {len(project_links)} project links\n")
    print(project_links)
    print("\n\n")

    # --------------------------
    # 5. ANALYZE EACH PROJECT PAGE
    # --------------------------
    project_reports_count = 0

    if project_links:
        print("📊 Analyzing individual projects...\n")
        project_reports_count = casestudies.analyze_projects(project_links, url)
        print(f"🎉 Completed {project_reports_count} project analyses\n")
    else:
        print("⚠️ No project links found to analyze\n")

    # --------------------------
    # 6. RETURN FINAL RESULT
    # --------------------------
    return {
      "success": True,
      "main_report": gcs_main_url,
      "structured_content": gemini_response.get("structured_content", {}),
      "analysis": gemini_response.get("analysis", {}),
      "project_links": project_links,
      "project_reports_count": project_reports_count
    }
