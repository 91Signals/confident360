import os
import time
from datetime import datetime
from playwright.sync_api import sync_playwright

def wait_for_full_load(page, timeout=15000):
    """Wait until the page has no active network connections for 500ms."""
    page.wait_for_load_state("domcontentloaded")

    start_time = time.time()
    last_activity = time.time()

    while True:
        activity = page.evaluate("() => window.performance.getEntriesByType('resource').length")
        
        # If no new network activity for 500ms → assume stable
        if activity == 0:
            if time.time() - last_activity >= 0.5:
                break
        else:
            last_activity = time.time()

        if time.time() - start_time > timeout / 1000:
            print("⏳ Timed out waiting for resource stability.")
            break

        time.sleep(0.1)

    # Extra wait for layout finishing
    time.sleep(0.5)


def scroll_to_bottom(page):
    """Scroll gradually to let all lazy content render."""
    page.evaluate("""
        async () => {
            await new Promise(resolve => {
                let totalHeight = 0;
                const distance = 800;
                const timer = setInterval(() => {
                    window.scrollBy(0, distance);
                    totalHeight += distance;

                    if (totalHeight >= document.body.scrollHeight - window.innerHeight) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 150);
            });
        }
    """)
    time.sleep(1)


def capture_screenshot(url, output_dir="backend/reports/screenshots"):
    """Capture full-page screenshot with full load + Notion-safe logic."""

    os.makedirs(output_dir, exist_ok=True)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    clean_url = url.replace('https://', '').replace('http://', '').replace('/', '_')[:50]
    filename = f"{clean_url}_{timestamp}.png"
    screenshot_path = os.path.join(output_dir, filename)

    is_notion = "notion.so" in url or "notion.site" in url

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={'width': 1920, 'height': 1080})

            if is_notion:
                page.goto(url, wait_until="domcontentloaded", timeout=45000)
            else:
                page.goto(url, wait_until="networkidle", timeout=60000)

            # Ensure full content load
            scroll_to_bottom(page)
            wait_for_full_load(page)

            page.screenshot(path=screenshot_path, full_page=True)
            browser.close()

        print(f"✅ Screenshot saved: {screenshot_path}")
        return screenshot_path

    except Exception as e:
        print(f"⚠️ Primary screenshot failed: {e}")

        # FALLBACK
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(headless=True)
                page = browser.new_page(viewport={'width': 1280, 'height': 720})
                page.goto(url, wait_until="domcontentloaded", timeout=30000)

                scroll_to_bottom(page)
                wait_for_full_load(page)

                page.screenshot(path=screenshot_path, full_page=True)
                browser.close()

            print(f"✅ Screenshot saved (fallback): {screenshot_path}")
            return screenshot_path

        except Exception as e2:
            print(f"❌ Fallback screenshot failed: {e2}")
            return None
