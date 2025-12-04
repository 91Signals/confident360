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


def extract_portfolio(url, platform, report_id=None):
    """
    Scrape portfolio → Send to Gemini → Save portfolio JSON → Extract project links → Analyze each project

    Returns:
        {
            "success": True,
            "main_report": "reports/xxx.json",
            "structured_content": {...},
            "analysis": {...},
            "project_links": [...],
            "project_reports_count": 0,
            "time_report": {...}
        }
    """
    import time
    from datetime import datetime
    
    # Comprehensive time tracking
    timings = {
        "pipeline_start": datetime.now().isoformat(),
        "portfolio_url": url,
        "platform": platform,
        "report_id": report_id
    }
    pipeline_start_time = time.perf_counter()

    print(f"📥 Extracting portfolio data from {platform}...")
    stage_start = time.perf_counter()
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
    timings['scraping_time_seconds'] = round(time.perf_counter() - stage_start, 2)
    print(f"⏱️ Scraping completed in {timings['scraping_time_seconds']:.2f}s")

    if not scraped_data:
      return {"success": False, "error": "Failed to scrape portfolio"}

    print("✅ Portfolio data extracted\n")
    print("SCRAPED_DATA : \n\n",scraped_data,"\n\n")

    # --------------------------
    # 2. SCREENSHOT STAGE (if needed)
    # --------------------------
    if hasattr(scraped_data, 'screenshot_path') or scraped_data.get('screenshot_path'):
      shot_start = time.perf_counter()
      # If screenshot logic is triggered here, add timing
      timings['screenshot_time_seconds'] = round(time.perf_counter() - shot_start, 2)
      print(f"⏱️ Screenshot taken in {timings['screenshot_time_seconds']:.2f}s")
    else:
      timings['screenshot_time_seconds'] = 0

    # --------------------------
    # 3. RUN GEMINI MAIN-PAGE PROMPT
    # --------------------------
    print("🧠 Analyzing portfolio with Gemini...")
    gemini_start = time.perf_counter()

    prompt = f"""
You are an expert UI/UX portfolio analyzer.

Analyze this portfolio based on the extracted content and links.

URL: {url}

TEXT CONTENT (first 2000 chars):
{json.dumps(scraped_data.get('content', '')[:2000], indent=2)}

DETECTED PROJECT LINKS:
{json.dumps(scraped_data.get('project_links', []), indent=2)}

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
      timings['gemini_portfolio_analysis_seconds'] = round(time.perf_counter() - gemini_start, 2)
      print(f"✅ Gemini analysis successful in {timings['gemini_portfolio_analysis_seconds']:.2f}s\n")
      print("\n\n",gemini_response,"\n\n")
    except Exception as e:
      print(f"❌ Gemini failed: {e}")
      return {"success": False, "error": "Gemini main analysis failed", "time_report": timings}

    # --------------------------
    # 3. SAVE MAIN REPORT
    # --------------------------
    save_start = time.perf_counter()
    filename = get_clean_filename(url)
    main_json_path = f"backend/reports/{filename}_main_portfolio.json"

    with open(main_json_path, "w", encoding="utf-8") as f:
      json.dump(gemini_response, f, indent=2, ensure_ascii=False)

    print(f"📁 Main portfolio report saved: {main_json_path}\n")

    # Upload main report to GCS
    from utils.gcs_utils import upload_file_to_gcs
    
    if report_id:
        gcs_folder = f"{report_id}/"
    else:
        parent_slug = get_clean_filename(url)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        gcs_folder = f"{parent_slug}_{timestamp}/"
        
    gcs_main_path = gcs_folder + os.path.basename(main_json_path)
    gcs_main_url = upload_file_to_gcs(main_json_path, gcs_main_path)
    timings['save_and_upload_main_report_seconds'] = round(time.perf_counter() - save_start, 2)
    print(f"[GCS] Uploaded main report to: {gcs_main_url}")

    # --------------------------
    # 4. EXTRACT PROJECT LINKS (NEW LOGIC)
    # --------------------------
    extract_start = time.perf_counter()
    print("🔗 Extracting project links from structured_content.projects...")

    structured = gemini_response.get("structured_content", {})
    projects = structured.get("projects", [])

    project_links = [
        p.get("url") for p in projects
        if isinstance(p, dict) and p.get("url")
    ]

    project_links = list(dict.fromkeys(project_links))  # remove duplicates
    timings['project_links_extraction_seconds'] = round(time.perf_counter() - extract_start, 2)
    timings['total_project_links_found'] = len(project_links)
    print(f"✅ Found {len(project_links)} project links\n")
    print(project_links)
    print("\n\n")

    # --------------------------
    # 5. ANALYZE EACH PROJECT PAGE
    # --------------------------
    project_reports_count = 0
    project_timings = []

    if project_links:
        print("📊 Analyzing individual projects...\n")
        projects_start = time.perf_counter()
        project_reports_count, project_timings = casestudies.analyze_projects(project_links, url, gcs_folder)
        timings['total_project_analysis_seconds'] = round(time.perf_counter() - projects_start, 2)
        timings['projects_analyzed'] = project_reports_count
        timings['per_project_timings'] = project_timings
        print(f"🎉 Completed {project_reports_count} project analyses\n")
    else:
        print("⚠️ No project links found to analyze\n")
        timings['total_project_analysis_seconds'] = 0
        timings['projects_analyzed'] = 0
        timings['per_project_timings'] = []

    # --------------------------
    # 6. CALCULATE TOTAL TIME & GENERATE REPORT
    # --------------------------
    total_pipeline_time = time.perf_counter() - pipeline_start_time
    timings['total_pipeline_time_seconds'] = round(total_pipeline_time, 2)
    timings['pipeline_end'] = datetime.now().isoformat()
    
    # Add user identifier from URL
    timings['user_identifier'] = get_clean_filename(url)
    
    # Print comprehensive time report
    print("\n" + "="*70)
    print("⏱️  COMPREHENSIVE TIME REPORT")
    print("="*70)
    print(f"Portfolio URL: {url}")
    print(f"Platform: {platform}")
    print(f"User: {timings['user_identifier']}")
    print(f"Started: {timings['pipeline_start']}")
    print(f"Completed: {timings['pipeline_end']}")
    print("-"*70)
    print(f"1. Scraping Time:                {timings['scraping_time_seconds']:.2f}s")
    print(f"2. Screenshot Time:              {timings['screenshot_time_seconds']:.2f}s")
    print(f"3. Gemini Portfolio Analysis:    {timings['gemini_portfolio_analysis_seconds']:.2f}s")
    print(f"4. Save & Upload Main Report:    {timings['save_and_upload_main_report_seconds']:.2f}s")
    print(f"5. Extract Project Links:        {timings['project_links_extraction_seconds']:.2f}s")
    print(f"6. Total Project Analysis:       {timings['total_project_analysis_seconds']:.2f}s")
    print(f"   - Projects Found:             {timings['total_project_links_found']}")
    print(f"   - Projects Analyzed:          {timings['projects_analyzed']}")
    
    if project_timings:
        print("\n   Per-Project Breakdown:")
        for i, pt in enumerate(project_timings, 1):
            print(f"   {i}. {pt['project_name'][:50]}")
            print(f"      - Scraping:    {pt['scraping_seconds']:.2f}s")
            print(f"      - Screenshot:  {pt['screenshot_seconds']:.2f}s")
            print(f"      - Gemini:      {pt['gemini_seconds']:.2f}s")
            print(f"      - Save/Upload: {pt['save_upload_seconds']:.2f}s")
            print(f"      - Total:       {pt['total_seconds']:.2f}s")
    
    print("-"*70)
    print(f"🏁 TOTAL PIPELINE TIME:          {timings['total_pipeline_time_seconds']:.2f}s")
    print(f"   ({timings['total_pipeline_time_seconds']/60:.2f} minutes)")
    print("="*70 + "\n")
    
    # --------------------------
    # 7. SAVE TIME REPORT TO GCS
    # --------------------------
    time_report_filename = f"{timings['user_identifier']}_time_report.json"
    time_report_path = f"backend/reports/{time_report_filename}"
    
    with open(time_report_path, "w", encoding="utf-8") as f:
        json.dump(timings, f, indent=2, ensure_ascii=False)
    
    gcs_time_report_path = gcs_folder + time_report_filename
    gcs_time_report_url = upload_file_to_gcs(time_report_path, gcs_time_report_path)
    print(f"📊 Time report saved to GCS: {gcs_time_report_url}\n")

    # --------------------------
    # 8. RETURN FINAL RESULT
    # --------------------------
    return {
      "success": True,
      "main_report": gcs_main_url,
      "structured_content": gemini_response.get("structured_content", {}),
      "analysis": gemini_response.get("analysis", {}),
      "project_links": project_links,
      "project_reports_count": project_reports_count,
      "time_report": timings,
      "time_report_url": gcs_time_report_url
    }
