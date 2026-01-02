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
            # Launch with stealth options to bypass detection
            browser = p.chromium.launch(
                headless=True,
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                ]
            )
            
            # Create context with stealth settings
            context = browser.new_context(
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080},
                locale='en-US',
                extra_http_headers={
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Cache-Control': 'max-age=0',
                    'DNT': '1',
                    'Connection': 'keep-alive',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'none',
                    'Sec-Fetch-User': '?1',
                    'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="131", "Chromium";v="131"',
                    'Sec-Ch-Ua-Mobile': '?0',
                    'Sec-Ch-Ua-Platform': '"macOS"',
                }
            )
            
            page = context.new_page()
            
            # Add stealth scripts
            page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {get: () => false});
                Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
                Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']});
                window.chrome = { runtime: {} };
            """)

            try:
                print(f"  🌐 Loading Notion page...")
                response = page.goto(url, wait_until="domcontentloaded", timeout=60000)
                print(f"  📡 Response: {response.status if response else 'None'}")
            except TimeoutError:
                print("  ⚠️  Timeout during load, continuing...")

            # Wait longer for dynamic content to fully load
            print(f"  ⏳ Waiting for page to fully render...")
            time.sleep(5)
            
            # Scroll to trigger lazy loading
            page.evaluate("window.scrollBy(0, window.innerHeight)")
            time.sleep(2)
            page.evaluate("window.scrollBy(0, -window.innerHeight)")
            time.sleep(2)
            
            # Check HTML content
            html_content = page.content()
            print(f"  📄 HTML length: {len(html_content)} chars")
            
            content = page.inner_text("body")
            all_links = extract_links(page)
            db_links = [l["href"] for l in all_links if "?v=" in l["href"] or "?p=" in l["href"]]

            print(f"  📊 Found {len(all_links)} links, {len(db_links)} database links")

            project_links = []
            if db_links:
                try:
                    print(f"  🗂️ Loading database view...")
                    page.goto(db_links[0], wait_until="domcontentloaded", timeout=60000)
                    time.sleep(3)
                    db_page_links = extract_links(page)

                    for link in db_page_links:
                        href = link["href"]
                        if href.startswith("https") and "-" in href.split("/")[-1]:
                            if len(href.split("/")[-1].split("-")[-1]) >= 12:
                                project_links.append(href)
                    
                    print(f"  ✅ Extracted {len(project_links)} project links from database")
                except Exception as e:
                    print(f"  ⚠️  Could not load database: {e}")

            context.close()
            browser.close()

            print(f"  ✅ Total projects extracted: {len(project_links)}")

            return {
                'url': url,
                'content': content[:5000],
                'links': all_links[:100],
                'project_links': list(set(project_links))
            }

    except Exception as e:
        print(f"  ❌ Notion scraping error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {'url': url, 'content': '', 'links': [], 'project_links': []}
