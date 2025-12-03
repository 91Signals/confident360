from flask import Flask, render_template, request, jsonify
import os
import json
import uuid
from google.cloud import storage
from main import run_analysis_from_flask
from utils.gcs_utils import upload_file_to_gcs
from PIL import Image
import io

# ---------------------------------------
# FLASK + FOLDER SETUP
# ---------------------------------------
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))

UPLOAD_FOLDER = os.path.join(BACKEND_DIR, "uploads")
REPORT_FOLDER = os.path.join(BACKEND_DIR, "reports")
SCREENSHOT_FOLDER = os.path.join(REPORT_FOLDER, "screenshots")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(REPORT_FOLDER, exist_ok=True)
os.makedirs(SCREENSHOT_FOLDER, exist_ok=True)

BUCKET_NAME = "portfolio-reports-confi360"
storage_client = storage.Client()

app = Flask(
    __name__,
    template_folder=os.path.join(BACKEND_DIR, "templates"),
    static_folder=os.path.join(BACKEND_DIR, "static")
)

# ---------------------------------------
# IMAGE OPTIMIZATION (Screenshot Compression)
# ---------------------------------------

def compress_image(input_path, output_path, quality=55):
    """
    Compress image into WEBP (best for screenshots)
    Reduces size 60–80%.
    """
    try:
        with Image.open(input_path) as img:
            img = img.convert("RGB")
            img.save(output_path, "WEBP", quality=quality, method=6)
        return output_path
    except Exception as e:
        print("Image compression failed:", e)
        return input_path


def compress_and_upload_screenshot(local_path, gcs_path):
    """
    Compress screenshot then upload to Google Cloud Storage.
    """
    compressed_local = local_path.replace(".png", ".webp")
    compress_image(local_path, compressed_local)

    gcs_url = upload_file_to_gcs(compressed_local, gcs_path)
    return gcs_url


# ---------------------------------------
# ROUTES
# ---------------------------------------

@app.route("/")
def home():
    return render_template("index.html")


@app.route("/results")
def results_page():
    return render_template("results.html")


# ---------------------------------------
# ANALYZE → RUN PIPELINE → UPLOAD TO GCS
# ---------------------------------------

@app.route("/analyze", methods=["POST"])
def analyze():
    portfolio_url = request.form.get("portfolioUrl")
    resume = request.files.get("resume")

    if not portfolio_url:
        return jsonify({"error": "Portfolio URL missing"}), 400
    if not resume:
        return jsonify({"error": "Resume file missing"}), 400

    # Save resume locally
    safe_name = resume.filename.replace(" ", "_")
    resume_path = os.path.join(UPLOAD_FOLDER, safe_name)
    resume.save(resume_path)

    # Upload resume PDF to GCS
    report_id = str(uuid.uuid4())
    folder = f"{report_id}/"

    gcs_pdf_path = folder + safe_name
    gcs_pdf_url = upload_file_to_gcs(resume_path, gcs_pdf_path)

    # Clear stale local reports
    for f in os.listdir(REPORT_FOLDER):
        if f.endswith(".json"):
            os.remove(os.path.join(REPORT_FOLDER, f))

    # Run pipeline
    try:
        result = run_analysis_from_flask(portfolio_url, resume_path)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # Convert and upload local screenshots
    uploaded_screenshots = []
    for file in os.listdir(SCREENSHOT_FOLDER):
        if file.lower().endswith((".png", ".jpg", ".jpeg")):
            local_path = os.path.join(SCREENSHOT_FOLDER, file)
            gcs_path = f"{folder}screenshots/{file.replace('.png','.webp')}"
            final_url = compress_and_upload_screenshot(local_path, gcs_path)
            uploaded_screenshots.append(final_url)

    # Extract time report URL from result if available
    time_report_url = result.get('time_report_url') if result and isinstance(result, dict) else None
    
    return jsonify({
        "message": "analysis_complete",
        "report_id": report_id,
        "resume_pdf_url": gcs_pdf_url,
        "uploaded_screenshots": uploaded_screenshots,
        "time_report_url": time_report_url
    })


# ---------------------------------------
# FETCH REPORTS FROM GCS
# ---------------------------------------

@app.route("/reports")
def get_reports():

    bucket = storage_client.bucket(BUCKET_NAME)
    blobs = list(bucket.list_blobs())

    reports = {}

    for blob in blobs:
        parts = blob.name.split("/")
        if len(parts) < 2:
            continue

        report_id = parts[0]

        if report_id not in reports:
            reports[report_id] = {
                "id": report_id,
                "json": None,
                "screenshots": []
            }

        # Main JSON file
        if blob.name.endswith(".json"):
            try:
                content = blob.download_as_text()
                reports[report_id]["json"] = json.loads(content)
            except Exception as e:
                print("Error parsing JSON:", blob.name, e)

        # Screenshots
        if "screenshots" in blob.name and blob.name.endswith(".webp"):
            reports[report_id]["screenshots"].append(blob.public_url)

    # Final formatted output
    final_output = []

    for rep in reports.values():
        raw = rep["json"]
        if not raw:
            continue

        ss = rep["screenshots"]

        # Portfolio Report
        if "structured_content" in raw:
            sc = raw["structured_content"]
            analysis = raw["analysis"]

            final_output.append({
                "id": rep["id"],
                "type": "portfolio",
                "url": raw.get("url", ""),
                "hero": sc.get("hero"),
                "about": sc.get("about"),
                "skills": sc.get("skills", []),
                "projects": sc.get("projects", []),
                "contact": sc.get("contact", {}),
                "links": sc.get("all_links", []),

                "overall_feedback": analysis.get("overall_feedback", ""),
                "sections": analysis.get("section_wise", []),
                "screenshots": ss
            })

        # Case Study Report
        elif "scraped_data" in raw and "analysis" in raw:
            analysis = raw["analysis"]

            final_output.append({
                "id": rep["id"],
                "type": "case_study",
                "url": raw.get("url", ""),
                "title": raw["scraped_data"].get("title", ""),
                "overallScore": analysis.get("overall_score", 0),
                "phaseScores": analysis.get("phase_scores", []),
                "summary": analysis.get("summary", ""),
                "improvements": analysis.get("improvements", []),
                "verdict": analysis.get("verdict", ""),
                "ux_keywords": analysis.get("ux_keywords", []),
                "screenshots": ss
            })

    return jsonify(final_output)


# ---------------------------------------
# RUN
# ---------------------------------------
if __name__ == "__main__":
    app.run(debug=True)
