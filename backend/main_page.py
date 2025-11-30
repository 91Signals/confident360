"""
Identifies platform type and routes to appropriate scraper
Updated to support new portfolio-level JSON structure (structured_content + analysis)
"""

import os
from final import extract_portfolio


def identify_platform(url):
    """
    Determine the platform type from URL.

    Args:
        url (str): Portfolio URL

    Returns:
        str: Platform type (behance, designfolio, notion, or other)
    """
    url_lower = url.lower()

    if "behance.net" in url_lower:
        return "behance"
    elif "designfolio" in url_lower:
        return "designfolio"
    elif "notion.site" in url_lower or "notion.so" in url_lower:
        return "notion"
    else:
        return "other"


def process_main_url(url):
    """
    Main processing function:
    - Identify platform
    - Route to appropriate scraper via final.py
    - Save portfolio-level report (structured_content + analysis)
    - Send extracted project URLs back for per-project analysis

    Args:
        url (str): Portfolio URL to analyze

    Returns:
        dict: {
            "success": bool,
            "main_report": "path/to/json",
            "structured_content": {...},
            "analysis": {...},
            "project_links": [...],
            "project_reports_count": int
        }
    """

    print(f"🔍 Identifying platform type...")
    platform = identify_platform(url)
    print(f"✅ Platform detected: {platform.upper()}\n")

    # Ensure report folders exist
    os.makedirs("backend/reports", exist_ok=True)
    os.makedirs("backend/reports/screenshots", exist_ok=True)

    # Call final.py (your main orchestrator)
    print("📥 Extracting portfolio data...")
    result = extract_portfolio(url, platform)

    # result must now return:
    # {
    #   "success": True,
    #   "main_report": "...",
    #   "structured_content": {...},
    #   "analysis": {...},
    #   "project_links": [...],
    #   "project_reports_count": 0
    # }

    if not result.get("success"):
        print(f"❌ Portfolio extraction failed: {result.get('error')}")
        return result

    print("✅ Portfolio data extracted\n")

    # Show summary to console
    print(f"📊 Structured Content Keys: {list(result.get('structured_content', {}).keys())}")
    print(f"🔗 Project Links Found: {len(result.get('project_links', []))}")
    print(f"📝 Portfolio Main Report: {result.get('main_report')}")

    return result
