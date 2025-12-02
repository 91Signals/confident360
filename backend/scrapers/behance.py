"""
Behance portfolio scraper using Playwright
"""
import os
import json
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright, TimeoutError

def safe_goto(page, url, timeout=60000):
    """Navigate to URL with fallback strategies"""
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=timeout)
        page.wait_for_selector("body", timeout=10000)
    except TimeoutError:
        try:
            page.goto(url, wait_until="load", timeout=timeout)
            page.wait_for_selector("body", timeout=10000)
        except TimeoutError:
            page.goto(url, timeout=timeout)
            page.wait_for_timeout(3000)

def extract(url):
    """Extract content and links from Behance portfolio"""
    print(f"  🎨 Scraping Behance: {url}")

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            storage_file = "behance_storage.json"
            if os.path.exists(storage_file):
                context = browser.new_context(storage_state=storage_file)
            else:
                context = browser.new_context()

            page = context.new_page()
            safe_goto(page, url)
            context.storage_state(path=storage_file)

            anchors = page.locator("a")
            count = anchors.count()
            links_list = []
            project_links = []

            for i in range(min(count, 500)):
                try:
                    text = anchors.nth(i).inner_text().strip()
                    href = anchors.nth(i).get_attribute("href")

                    if not href:
                        continue

                    absolute_url = urljoin(url, href)
                    links_list.append({"text": text, "href": absolute_url})

                    if '/gallery/' in absolute_url:
                        project_links.append(absolute_url)

                except Exception:
                    continue

            try:
                full_text = page.inner_text("body")
            except Exception:
                full_text = ""

            browser.close()

            return {
                'url': url,
                'content': full_text[:5000],
                'links': links_list[:100],
                'project_links': list(set(project_links))
            }

    except Exception as e:
        print(f"  ❌ Behance scraping error: {str(e)}")
        return {'url': url, 'content': '', 'links': [], 'project_links': []}
