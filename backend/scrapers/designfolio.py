"""
Designfolio portfolio scraper using Playwright
"""
import json
from playwright.sync_api import sync_playwright

def find_projects_recursive(obj):
    """Recursively search for 'projects' key in nested JSON"""
    if isinstance(obj, dict):
        for key, value in obj.items():
            if key == "projects" and isinstance(value, list):
                return value
            result = find_projects_recursive(value)
            if result:
                return result
    elif isinstance(obj, list):
        for item in obj:
            result = find_projects_recursive(item)
            if result:
                return result
    return None

def extract(url):
    """Extract projects from Designfolio portfolio"""
    print(f"  📱 Scraping Designfolio: {url}")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url, wait_until="domcontentloaded", timeout=60000)

            for _ in range(10):
                page.mouse.wheel(0, 3000)
                page.wait_for_timeout(300)

            try:
                script_data = page.locator("script#__NEXT_DATA__").inner_text()
                next_json = json.loads(script_data)
                projects = find_projects_recursive(next_json)

                project_links = []
                if projects:
                    for proj in projects:
                        if "_id" in proj:
                            project_url = f"{url.rstrip('/')}/project/{proj['_id']}"
                            project_links.append(project_url)

                content = page.inner_text("body")
                browser.close()

                return {
                    'url': url,
                    'content': content[:5000],
                    'links': [],
                    'project_links': project_links
                }

            except Exception as e:
                print(f"  ⚠️  Could not parse __NEXT_DATA__: {e}")
                browser.close()
                return {'url': url, 'content': '', 'links': [], 'project_links': []}

    except Exception as e:
        print(f"  ❌ Designfolio scraping error: {str(e)}")
        return {'url': url, 'content': '', 'links': [], 'project_links': []}
