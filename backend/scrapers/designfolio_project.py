"""
Designfolio project page scraper using Playwright
"""
import json
from playwright.sync_api import sync_playwright

def scrape_designfolio_project(url):
    """Scrape content from a Designfolio project page using Playwright"""
    print(f"  📱 Scraping Designfolio project page: {url}")
    
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            # Navigate to the page
            page.goto(url, wait_until="domcontentloaded", timeout=60000)
            
            # Scroll to load lazy-loaded images and content
            for _ in range(10):
                page.mouse.wheel(0, 3000)
                page.wait_for_timeout(300)
            
            # Extract title
            title = ""
            try:
                title_element = page.locator("h1").first
                if title_element.count() > 0:
                    title = title_element.inner_text()
                else:
                    # Fallback to page title
                    title = page.title()
            except:
                title = page.title()
            
            # Extract meta description
            meta_desc = ""
            try:
                meta_element = page.locator('meta[name="description"]')
                if meta_element.count() > 0:
                    meta_desc = meta_element.get_attribute("content") or ""
            except:
                pass
            
            # Extract headings
            headings = []
            try:
                for tag in ['h1', 'h2', 'h3', 'h4']:
                    elements = page.locator(tag).all()
                    for element in elements:
                        try:
                            text = element.inner_text()
                            if text.strip():
                                headings.append({'level': tag, 'text': text.strip()})
                        except:
                            pass
            except:
                pass
            
            # Extract all text content
            text_content = ""
            try:
                text_content = page.inner_text("body")
            except:
                pass
            
            # Count images
            image_count = 0
            try:
                image_count = page.locator("img").count()
            except:
                pass
            
            browser.close()
            
            return {
                'url': url,
                'title': title if title else 'Designfolio Project',
                'meta_description': meta_desc,
                'headings': headings,
                'text_content': text_content,
                'full_text_length': len(text_content),
                'total_images': image_count
            }
    
    except Exception as e:
        print(f"  ❌ Designfolio project scraping error: {str(e)}")
        return {
            'url': url,
            'title': 'Scraping Failed',
            'meta_description': '',
            'headings': [],
            'text_content': '',
            'full_text_length': 0,
            'total_images': 0
        }
