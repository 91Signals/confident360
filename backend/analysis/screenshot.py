import os
import io
import hashlib
from datetime import datetime
from PIL import Image
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

from utils.gcs_utils import upload_file_to_gcs, download_file_from_gcs, get_bucket


# ---------------------------
# Utils
# ---------------------------

def safe_filename(url: str) -> str:
    return (
        url.replace("https://", "")
        .replace("http://", "")
        .replace("/", "_")
        .replace("?", "_")
        .replace("&", "_")
        .replace("=", "_")
        [:50]
    )


def file_hash(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            h.update(chunk)
    return h.hexdigest()


def compress_image(
    path: str,
    target_size: int = 3 * 1024 * 1024,  # 3 MB
):
    """Compress image and print before/after sizes."""
    before = os.path.getsize(path)
    print(f"🖼️ Screenshot size BEFORE compression: {before / 1024 / 1024:.2f} MB")

    img = Image.open(path).convert("RGB")
    w, h = img.size
    img = img.resize((w // 2, h // 2), Image.Resampling.LANCZOS)

    quality = 85
    buffer = io.BytesIO()

    while quality >= 40:
        buffer.seek(0)
        buffer.truncate()
        img.save(buffer, format="JPEG", quality=quality)
        if buffer.tell() <= target_size:
            break
        quality -= 5

    with open(path, "wb") as f:
        f.write(buffer.getvalue())

    after = os.path.getsize(path)
    print(f"🖼️ Screenshot size AFTER compression: {after / 1024 / 1024:.2f} MB")


# ---------------------------
# Main Function
# ---------------------------

def capture_screenshot(
    url: str,
    output_dir: str = "backend/reports/screenshots",
    gcs_folder_prefix: str = "",
):
    """
    FULL-PAGE screenshot with size logging and safe compression.
    Runtime: 10–20s max.
    """

    os.makedirs(output_dir, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{safe_filename(url)}_{timestamp}.jpg"
    screenshot_path = os.path.join(output_dir, filename)

    gcs_path = (
        f"{gcs_folder_prefix}screenshots/{filename}"
        if gcs_folder_prefix
        else f"screenshots/{filename}"
    )

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=["--disable-dev-shm-usage", "--no-sandbox", "--disable-gpu"],
            )

            page = browser.new_page(
                viewport={"width": 1920, "height": 1080},
                user_agent=(
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/120.0 Safari/537.36"
                ),
            )

            try:
                page.goto(url, wait_until="domcontentloaded", timeout=30000)
            except PlaywrightTimeout:
                print("⚠️ Navigation timeout — continuing.")

            # Controlled scrolling
            for _ in range(10):
                page.mouse.wheel(0, 3000)
                page.wait_for_timeout(600)

            page.wait_for_timeout(1000)

            # Cap page height (critical)
            page_height = page.evaluate(
                "() => Math.min(document.body.scrollHeight, 20000)"
            )
            page.set_viewport_size({"width": 1920, "height": page_height})

            try:
                page.screenshot(
                    path=screenshot_path,
                    type="jpeg",
                    quality=90,   # intentionally high before compression
                    full_page=True,
                    timeout=20000,
                )
            except PlaywrightTimeout:
                print("⚠️ Full-page failed — fallback to tall viewport.")
                page.screenshot(
                    path=screenshot_path,
                    type="jpeg",
                    quality=85,
                    full_page=False,
                )

            browser.close()

        # ---- Compression + size logs ----
        compress_image(screenshot_path)

        # ---- GCS deduplication ----
        bucket = get_bucket()
        blob = bucket.blob(gcs_path)

        if blob.exists():
            tmp_old = screenshot_path + ".old"
            download_file_from_gcs(gcs_path, tmp_old)

            if file_hash(tmp_old) == file_hash(screenshot_path):
                os.remove(screenshot_path)
                os.remove(tmp_old)
                print("🟡 Screenshot unchanged — reused existing.")
                return blob.public_url
            else:
                os.remove(tmp_old)

        url = upload_file_to_gcs(screenshot_path, gcs_path)
        print(f"✅ Screenshot uploaded to GCS: {url}")
        return url

    except Exception as e:
        print(f"❌ Screenshot failed safely: {e}")
        return None
