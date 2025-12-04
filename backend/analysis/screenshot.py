
import os
import time
from datetime import datetime
from playwright.sync_api import sync_playwright
from PIL import Image
import io
import hashlib
from utils.gcs_utils import upload_file_to_gcs, download_file_from_gcs, bucket

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


def capture_screenshot(url, output_dir="backend/reports/screenshots", gcs_folder_prefix=""):
    """Capture full-page screenshot with full load + Notion-safe logic."""


    os.makedirs(output_dir, exist_ok=True)

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    clean_url = url.replace('https://', '').replace('http://', '').replace('/', '_')[:50]
    filename = f"{clean_url}_{timestamp}.png"
    screenshot_path = os.path.join(output_dir, filename)
    
    # Use the provided prefix if available, otherwise fallback to default
    if gcs_folder_prefix:
        gcs_path = f"{gcs_folder_prefix}screenshots/{filename}"
    else:
        gcs_path = f"screenshots/{filename}"

    is_notion = "notion.so" in url or "notion.site" in url

    def compress_image_to_target_size(input_path, target_size=3*1024*1024):
        # Print initial size
        initial_size = os.path.getsize(input_path)
        print(f"🖼️Initial screenshot size: {initial_size/1024/1024:.2f} MB")
        # Compress PNG to JPEG if needed, reduce quality until < target_size
        img = Image.open(input_path)
        quality = 95
        buffer = io.BytesIO()
        img = img.convert("RGB")
        while True:
            buffer.seek(0)
            buffer.truncate()
            img.save(buffer, format="JPEG", quality=quality)
            size = buffer.tell()
            if size < target_size or quality < 30:
                break
            quality -= 5
        with open(input_path, "wb") as f:
            f.write(buffer.getvalue())
        final_size = size
        percent_reduced = 100 * (initial_size - final_size) / initial_size if initial_size > 0 else 0
        print(f"🖼️ The Screenshot size after compression: {final_size/1024/1024:.2f} MB")
        print(f"🔻 Size reduced: {percent_reduced:.1f}%")
        return final_size

    def file_hash(path):
        h = hashlib.sha256()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                h.update(chunk)
        return h.hexdigest()

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page(viewport={'width': 1920, 'height': 1080})

            if is_notion:
                page.goto(url, wait_until="domcontentloaded", timeout=45000)
            else:
                page.goto(url, wait_until="networkidle", timeout=60000)

            scroll_to_bottom(page)
            wait_for_full_load(page)

            page.screenshot(path=screenshot_path, full_page=True)
            browser.close()

        # Compress to <3MB
        final_size = compress_image_to_target_size(screenshot_path)
        print(f"🖼️ Screenshot size after compression: {final_size/1024/1024:.2f} MB")

        # Check if screenshot already exists in GCS
        blob = bucket.blob(gcs_path)
        if blob.exists():
            # Download existing screenshot
            tmp_old = screenshot_path + ".old"
            download_file_from_gcs(gcs_path, tmp_old)
            old_hash = file_hash(tmp_old)
            new_hash = file_hash(screenshot_path)
            if old_hash == new_hash:
                print("🟡 Screenshot already exists and is identical. Keeping one copy.")
                os.remove(screenshot_path)
                return upload_file_to_gcs(tmp_old, gcs_path)
            else:
                print("🟠 Screenshot exists but is different. Replacing with latest.")
                upload_file_to_gcs(screenshot_path, gcs_path)
                os.remove(tmp_old)
                return upload_file_to_gcs(screenshot_path, gcs_path)
        else:
            # Upload new screenshot
            url = upload_file_to_gcs(screenshot_path, gcs_path)
            print(f"✅ Screenshot uploaded to GCS: {url}")
            return url

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
            final_size = compress_image_to_target_size(screenshot_path)
            print(f"🖼️ Screenshot size after compression: {final_size/1024/1024:.2f} MB (fallback)")
            url = upload_file_to_gcs(screenshot_path, gcs_path)
            print(f"✅ Screenshot uploaded to GCS (fallback): {url}")
            return url
        except Exception as e2:
            print(f"❌ Fallback screenshot failed: {e2}")
            return None
