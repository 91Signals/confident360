"""
Notion portfolio scraper using Playwright
"""
from playwright.sync_api import sync_playwright, TimeoutError
import time

def extract_links(page):
    """Extract all anchor links from page"""
    return page.evaluate("""
        () => [...document.querySelectorAll("a")].map(a => ({
            text: a.innerText.trim(),
            href: a.href
        }))
    """)

def extract(url):
    """Extract content from Notion portfolio page"""
    print(f"  📝 Scraping Notion: {url}")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            try:
                page.goto(url, wait_until="domcontentloaded", timeout=60000)
            except TimeoutError:
                print("  ⚠️  Timeout during load, continuing...")

            time.sleep(3)
            content = page.inner_text("body")
            all_links = extract_links(page)
            db_links = [l["href"] for l in all_links if "?v=" in l["href"] or "?p=" in l["href"]]

            project_links = []
            if db_links:
                try:
                    page.goto(db_links[0], wait_until="domcontentloaded", timeout=60000)
                    time.sleep(3)
                    db_page_links = extract_links(page)

                    for link in db_page_links:
                        href = link["href"]
                        if href.startswith("https") and "-" in href.split("/")[-1]:
                            if len(href.split("/")[-1].split("-")[-1]) >= 12:
                                project_links.append(href)
                except Exception as e:
                    print(f"  ⚠️  Could not load database: {e}")

            browser.close()

            return {
                'url': url,
                'content': content[:5000],
                'links': all_links[:100],
                'project_links': list(set(project_links))
            }

    except Exception as e:
        print(f"  ❌ Notion scraping error: {str(e)}")
        return {'url': url, 'content': '', 'links': [], 'project_links': []}
