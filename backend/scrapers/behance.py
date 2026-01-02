"""
Behance portfolio scraper using Playwright
"""
import os
import re
import requests
from urllib.parse import urljoin
from playwright.sync_api import sync_playwright, TimeoutError

def extract_username_from_url(url):
    """Extract Behance username from URL"""
    # https://www.behance.net/username
    match = re.search(r'behance\.net/([^/]+)', url)
    return match.group(1) if match else None

def try_behance_api(url):
    """Try to use Behance API as fallback"""
    try:
        username = extract_username_from_url(url)
        if not username:
            return None
        
        print(f"  🔌 Trying Behance API for user: {username}")
        
        # Behance API endpoint (public)
        api_url = f"https://www.behance.net/v2/users/{username}?api_key=u_n_public"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://www.behance.net/',
        }
        
        response = requests.get(api_url, headers=headers, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            user_data = data.get('user', {})
            
            # Get user's projects
            projects_url = f"https://www.behance.net/v2/users/{username}/projects?api_key=u_n_public"
            projects_response = requests.get(projects_url, headers=headers, timeout=15)
            
            project_links = []
            if projects_response.status_code == 200:
                projects_data = projects_response.json()
                projects = projects_data.get('projects', [])
                for project in projects[:20]:  # Limit to 20 projects
                    project_url = project.get('url')
                    if project_url:
                        project_links.append(project_url)
            
            print(f"  ✅ API extracted {len(project_links)} projects")
            
            return {
                'url': url,
                'content': f"Behance Portfolio: {user_data.get('display_name', username)}",
                'links': [],
                'project_links': project_links
            }
        
    except Exception as e:
        print(f"  ⚠️  API fallback failed: {e}")
    
    return None

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
    import time
    print(f"  🎨 Scraping Behance: {url}")
    
    # First, try API approach (faster and less likely to be blocked)
    api_result = try_behance_api(url)
    if api_result and len(api_result.get('project_links', [])) > 0:
        print(f"  ✅ Successfully used API approach")
        return api_result

    # If API fails, fall back to browser scraping
    print(f"  🌐 API failed or returned no projects, trying browser scraping...")

    # Delete any existing storage file to ensure fresh context
    storage_file = "behance_storage.json"
    if os.path.exists(storage_file):
        try:
            os.remove(storage_file)
            print(f"  🗑️  Removed old storage file")
        except Exception as e:
            print(f"  ⚠️  Could not remove storage file: {e}")
            print(f"  🗑️  Removed old storage file")
        except Exception as e:
            print(f"  ⚠️  Could not remove storage file: {e}")

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
                    '--disable-web-security',
                    '--disable-features=IsolateOrigins,site-per-process',
                    '--disable-site-isolation-trials',
                ]
            )
            
            # Create a fresh context with stealth settings (NO storage state)
            context = browser.new_context(
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                viewport={'width': 1920, 'height': 1080},
                locale='en-US',
                timezone_id='America/New_York',
                java_script_enabled=True,
                extra_http_headers={
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Referer': 'https://www.google.com/',
                    'Upgrade-Insecure-Requests': '1',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'cross-site',
                    'Sec-Fetch-User': '?1',
                    'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="131", "Chromium";v="131"',
                    'Sec-Ch-Ua-Mobile': '?0',
                    'Sec-Ch-Ua-Platform': '"Windows"',
                }
            )
            
            page = context.new_page()
            
            # More aggressive stealth scripts
            page.add_init_script("""
                Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
                Object.defineProperty(navigator, 'plugins', {get: () => [1, 2, 3, 4, 5]});
                Object.defineProperty(navigator, 'languages', {get: () => ['en-US', 'en']});
                Object.defineProperty(navigator, 'platform', {get: () => 'Win32'});
                window.chrome = { 
                    runtime: {},
                    loadTimes: function() {},
                    csi: function() {},
                    app: {}
                };
                Object.defineProperty(navigator, 'permissions', {
                    get: () => ({
                        query: () => Promise.resolve({ state: 'granted' })
                    })
                });
                // Override toString to hide automation
                const originalToString = Function.prototype.toString;
                Function.prototype.toString = function() {
                    if (this === navigator.permissions.query) {
                        return 'function query() { [native code] }';
                    }
                    return originalToString.call(this);
                };
            """)

            print(f"  🌐 Loading page...")
            
            # Add random delay before navigation to seem more human
            page.wait_for_timeout(1000 + (hash(url) % 2000))
            
            response = page.goto(url, wait_until="domcontentloaded", timeout=60000)
            print(f"  📡 Response: {response.status if response else 'None'}")
            
            # If we got blocked, wait and try again with different strategy
            if response and response.status == 403:
                print(f"  ⚠️  Got 403, retrying with different approach...")
                page.wait_for_timeout(3000)
                response = page.goto(url, wait_until="load", timeout=60000)
                print(f"  📡 Retry Response: {response.status if response else 'None'}")
            
            # Longer wait for dynamic content + scroll to trigger lazy loading
            print(f"  ⏳ Waiting for page to fully render...")
            page.wait_for_timeout(3000)
            
            # Simulate human-like scrolling
            for _ in range(3):
                page.mouse.wheel(0, 500)
                page.wait_for_timeout(300)
            
            page.wait_for_timeout(2000)
            
            # Check HTML content first
            html_content = page.content()
            print(f"  📄 HTML length: {len(html_content)} chars")
            
            # If HTML is too short, we likely got blocked
            if len(html_content) < 1000:
                print(f"  ⚠️  Page content too short, likely blocked. Trying alternative approach...")
                # Wait longer and try to get past any challenge
                page.wait_for_timeout(5000)
                html_content = page.content()
                print(f"  📄 Retry HTML length: {len(html_content)} chars")

            anchors = page.locator("a")
            count = anchors.count()
            links_list = []
            project_links = []

            print(f"  📊 Found {count} anchor tags")

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

            context.close()
            browser.close()

            print(f"  ✅ Extracted {len(project_links)} projects")
            
            return {
                'url': url,
                'content': full_text[:5000] if full_text else '',
                'links': links_list[:100],
                'project_links': list(set(project_links))
            }

    except Exception as e:
        print(f"  ❌ Behance scraping error: {str(e)}")
        import traceback
        traceback.print_exc()
        return {'url': url, 'content': '', 'links': [], 'project_links': []}
    finally:
        # Clean up: delete storage file after we're done
        if os.path.exists(storage_file):
            try:
                os.remove(storage_file)
                print(f"  🧹 Cleaned up storage file")
            except Exception as e:
                print(f"  ⚠️  Could not clean up storage file: {e}")
