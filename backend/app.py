from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import os
import json
import uuid
from google.cloud import storage
from main import run_analysis_from_flask
from utils.gcs_utils import upload_file_to_gcs
from utils.resume_parser import parse_resume
from utils.firebase_db import save_user_profile, get_user_profile, update_user_profile_partial
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
CORS(app)

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
    user_id = request.form.get("userId")  # Firebase user ID

    if not portfolio_url:
        return jsonify({"error": "Portfolio URL missing"}), 400
    if not resume:
        return jsonify({"error": "Resume file missing"}), 400

    # Save resume locally
    safe_name = resume.filename.replace(" ", "_")
    resume_path = os.path.join(UPLOAD_FOLDER, safe_name)
    resume.save(resume_path)

    # Extract resume details
    resume_data = parse_resume(resume_path)
    
    # Save to Firestore if user_id provided
    if user_id:
        save_user_profile(user_id, portfolio_url, resume_data)

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
        result = run_analysis_from_flask(portfolio_url, resume_path, report_id)
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
        "time_report_url": time_report_url,
        "resume_data": resume_data  # Return extracted data to frontend
    })


# ---------------------------------------
# SERVE SCREENSHOTS (PROXY)
# ---------------------------------------

# -------  ----
# USER PROFILE API
# -------  ----

@app.route("/api/extract-resume", methods=["POST"])
def extract_resume_endpoint():
    """
    Extract resume details without full analysis
    Used for prefilling user profile form
    """
    resume = request.files.get("resume")
    
    if not resume:
        return jsonify({"error": "Resume file missing"}), 400
    
    try:
        # Save resume temporarily
        safe_name = resume.filename.replace(" ", "_")
        resume_path = os.path.join(UPLOAD_FOLDER, safe_name)
        resume.save(resume_path)
        
        # Extract details
        resume_data = parse_resume(resume_path)
        
        # Clean up temp file
        if os.path.exists(resume_path):
            os.remove(resume_path)
        
        return jsonify({
            "success": True,
            "data": resume_data
        })
    except Exception as e:
        print(f"[ERROR] Resume extraction failed: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/user-profile", methods=["GET"])
def get_user_profile_endpoint():
    """
    Get user profile for authenticated user
    """
    user_id = request.args.get("userId")
    
    if not user_id:
        return jsonify({"error": "userId parameter missing"}), 400
    
    try:
        profile = get_user_profile(user_id)
        
        if profile:
            return jsonify({
                "success": True,
                "profile": profile
            })
        else:
            return jsonify({
                "success": False,
                "message": "No profile found"
            }), 404
    except Exception as e:
        print(f"[ERROR] Failed to get user profile: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/user-profile", methods=["POST"])
def save_user_profile_endpoint():
    """
    Save or update user profile
    """
    user_id = request.form.get("userId")
    portfolio_url = request.form.get("portfolioUrl")
    
    if not user_id:
        return jsonify({"error": "userId missing"}), 400
    
    try:
        updates = {}
        if request.form.get("name"):
            updates["name"] = request.form.get("name")
        if request.form.get("email"):
            updates["email"] = request.form.get("email")
        if request.form.get("phone"):
            updates["phone"] = request.form.get("phone")
        if request.form.get("linkedinUrl"):
            updates["linkedinUrl"] = request.form.get("linkedinUrl")
        if portfolio_url:
            updates["portfolioUrl"] = portfolio_url
        
        if updates:
            update_user_profile_partial(user_id, updates)
        
        return jsonify({
            "success": True,
            "message": "Profile saved"
        })
    except Exception as e:
        print(f"[ERROR] Failed to save user profile: {e}")
        return jsonify({"error": str(e)}), 500


# -------  ----

@app.route("/reports/<report_id>/screenshots/<filename>")
def serve_screenshot(report_id, filename):
    try:
        bucket = storage_client.bucket(BUCKET_NAME)
        # Try to find the file in GCS
        gcs_path = f"{report_id}/screenshots/{filename}"
        blob = bucket.blob(gcs_path)
        
        if not blob.exists():
            # Try alternative extension
            if filename.endswith(".png"):
                alt_gcs_path = f"{report_id}/screenshots/{filename.replace('.png', '.webp')}"
                blob = bucket.blob(alt_gcs_path)
            elif filename.endswith(".webp"):
                alt_gcs_path = f"{report_id}/screenshots/{filename.replace('.webp', '.png')}"
                blob = bucket.blob(alt_gcs_path)
            else:
                return jsonify({"error": "Screenshot not found"}), 404
                
            if blob.exists():
                blob = bucket.blob(alt_gcs_path)
            else:
                return jsonify({"error": "Screenshot not found"}), 404
            
        # Download to memory and serve
        content = blob.download_as_bytes()
        mimetype = 'image/webp' if blob.name.endswith('.webp') else 'image/png'
        return send_file(
            io.BytesIO(content),
            mimetype=mimetype
        )
    except Exception as e:
        print(f"Error serving screenshot: {e}")
        return jsonify({"error": str(e)}), 500


# ---------------------------------------
# FETCH REPORTS FROM GCS
# ---------------------------------------

@app.route("/reports")
def get_reports():
    report_id_param = request.args.get('report_id')
    bucket = storage_client.bucket(BUCKET_NAME)
    
    if report_id_param:
        blobs = list(bucket.list_blobs(prefix=f"{report_id_param}/"))
    else:
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
                "jsons": [],
                "screenshots": []
            }

        # Main JSON file
        if blob.name.endswith(".json"):
            try:
                content = blob.download_as_text()
                reports[report_id]["jsons"].append(json.loads(content))
            except Exception as e:
                print("Error parsing JSON:", blob.name, e)

        # Screenshots
        # Look for screenshots in the report_id folder
        if "screenshots" in blob.name and blob.name.lower().endswith((".webp", ".png", ".jpg", ".jpeg")):
            filename = os.path.basename(blob.name)
            # Use proxy URL to ensure access without public bucket
            proxy_url = f"{request.host_url}reports/{report_id}/screenshots/{filename}"
            reports[report_id]["screenshots"].append(proxy_url)

    # Final formatted output
    final_output = []

    for rep in reports.values():
        ss = rep["screenshots"]
        
        for raw in rep["jsons"]:
            if not raw:
                continue

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
                
                # Use the screenshot URL directly from the report JSON
                screenshot_url = raw.get("screenshot")
                
                if screenshot_url:
                     filename = os.path.basename(screenshot_url)
                     # Force proxy URL to ensure access
                     screenshot_url = f"{request.host_url}reports/{rep['id']}/screenshots/{filename}"

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
                    "screenshot": screenshot_url, # Specific screenshot for this project
                    "screenshots": ss # All screenshots as backup
                })

    return jsonify(final_output)


# ---------------------------------------
# RUN
# ---------------------------------------
if __name__ == "__main__":
    app.run(debug=True)
