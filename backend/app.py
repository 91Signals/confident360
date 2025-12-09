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
import threading

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


@app.route("/api/portfolio-analysis", methods=["GET"])
def portfolio_analysis_seo_page():
        """Public, crawlable landing copy for the portfolio analysis app."""
        html = """<!DOCTYPE html>
<html lang=\"en\">
<head>
    <meta charset=\"UTF-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
    <title>Portfolio Analysis App | Confi360</title>
    <meta name=\"description\" content=\"Analyze UX portfolios in minutes with Confi360. Upload your resume, submit your portfolio URL, and get AI-powered screenshots, UX feedback, and structured reports hosted on Firebase and Cloud Run.\" />
    <meta name=\"keywords\" content=\"portfolio analysis, UX case study review, AI design feedback, Confi360, product design portfolio, resume parser\" />
    <meta name=\"robots\" content=\"index, follow\" />
    <link rel=\"canonical\" href=\"https://confi360-7c790.web.app/\" />
    <meta property=\"og:type\" content=\"website\" />
    <meta property=\"og:title\" content=\"Portfolio Analysis App | Confi360\" />
    <meta property=\"og:description\" content=\"Run a fast UX portfolio teardown with AI: capture screenshots, parse resumes, and get actionable design critiques.\" />
    <meta property=\"og:url\" content=\"https://confi360-7c790.web.app/\" />
    <meta property=\"og:image\" content=\"https://confi360-7c790.web.app/og-image.png\" />
    <meta name=\"twitter:card\" content=\"summary_large_image\" />
    <meta name=\"twitter:title\" content=\"Portfolio Analysis App | Confi360\" />
    <meta name=\"twitter:description\" content=\"AI-powered portfolio analysis with screenshots, UX scoring, and next steps.\" />
    <meta name=\"twitter:image\" content=\"https://confi360-7c790.web.app/og-image.png\" />
    <script type=\"application/ld+json\">{
        \"@context\": \"https://schema.org\",
        \"@type\": \"WebApplication\",
        \"name\": \"Confi360 Portfolio Analysis\",
        \"url\": \"https://confi360-7c790.web.app/\",
        \"applicationCategory\": \"Productivity\",
        \"description\": \"AI-assisted UX portfolio analyzer that captures screenshots, parses resumes, and returns structured UX feedback.\",
        \"operatingSystem\": \"Web\",
        \"publisher\": {\"@type\": \"Organization\", \"name\": \"Confi360\"},
        \"offers\": {\"@type\": \"Offer\", \"price\": \"0\", \"priceCurrency\": \"USD\"}
    }</script>
    <style>
        body { font-family: system-ui, -apple-system, Segoe UI, sans-serif; margin: 0; padding: 0; background: #0b1021; color: #e9ecf5; }
        main { max-width: 900px; margin: 0 auto; padding: 56px 20px 72px; }
        h1 { font-size: 2.4rem; margin-bottom: 0.5rem; }
        h2 { margin-top: 2rem; font-size: 1.3rem; color: #9fb3ff; }
        p { line-height: 1.6; color: #c9d2e9; }
        ul { padding-left: 20px; color: #c9d2e9; }
        .hero { background: linear-gradient(135deg, #1a2240, #0f162e); border: 1px solid #1f2b55; border-radius: 12px; padding: 20px; margin-bottom: 28px; box-shadow: 0 12px 30px rgba(0,0,0,0.35); }
        .cta { display: inline-block; margin-top: 12px; background: #7bd1ff; color: #0b1021; padding: 12px 18px; border-radius: 10px; font-weight: 700; text-decoration: none; }
        .card { border: 1px solid #1f2b55; border-radius: 12px; padding: 18px; margin-top: 18px; background: #111831; }
    </style>
</head>
<body>
    <main>
        <section class=\"hero\">
            <h1>AI Portfolio Analysis for Designers</h1>
            <p>Confi360 analyzes UX portfolios and case studies in minutes. It captures full-page screenshots, parses resumes, scores UX quality, and delivers structured recommendations you can share with recruiters or clients.</p>
            <a class=\"cta\" href=\"https://confi360-7c790.web.app/\">Open the Portfolio Analysis App</a>
        </section>

        <section class=\"card\">
            <h2>How it works</h2>
            <ul>
                <li>Paste your portfolio URL and upload a resume PDF.</li>
                <li>Our Cloud Run backend captures screenshots with Playwright and scrapes project pages for content and structure.</li>
                <li>Gemini summarizes UX strengths, gaps, and suggested improvements.</li>
                <li>Firebase Hosting serves the frontend and proxies API calls to Cloud Run for fast, secure delivery.</li>
            </ul>
        </section>

        <section class=\"card\">
            <h2>What you get</h2>
            <ul>
                <li>Shareable screenshots of your portfolio and case studies.</li>
                <li>UX scoring by phase (research, visual design, validation, storytelling).</li>
                <li>Actionable improvement tips to strengthen your portfolio narrative.</li>
                <li>Downloadable reports hosted on secure Google Cloud Storage.</li>
            </ul>
        </section>

        <section class=\"card\">
            <h2>Call to action</h2>
            <p>Ready to see how your work reads to reviewers? Open the app, run an analysis, and share the report link with hiring managers.</p>
            <a class=\"cta\" href=\"https://confi360-7c790.web.app/\">Analyze my portfolio</a>
        </section>
    </main>
</body>
</html>
"""
        return html, 200, {"Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=3600"}


# ---------------------------------------
# ANALYZE → RUN PIPELINE → UPLOAD TO GCS
# ---------------------------------------

# In-memory status tracker
analysis_status = {}

def process_analysis_async(portfolio_url, resume_path, report_id, user_id, safe_name):
    """Background task to run analysis"""
    try:
        analysis_status[report_id] = {"status": "processing", "progress": 0, "current_step": "Initializing..."}
        
        # Clear stale local reports
        for f in os.listdir(REPORT_FOLDER):
            if f.endswith(".json"):
                os.remove(os.path.join(REPORT_FOLDER, f))
        
        analysis_status[report_id]["progress"] = 5
        analysis_status[report_id]["current_step"] = "Analyzing portfolio projects..."
        
        # Run pipeline
        result = run_analysis_from_flask(portfolio_url, resume_path, report_id)
        
        analysis_status[report_id]["progress"] = 70
        analysis_status[report_id]["current_step"] = "Processing screenshots..."
        
        # Convert and upload local screenshots
        uploaded_screenshots = []
        folder = f"{report_id}/"
        screenshot_files = [f for f in os.listdir(SCREENSHOT_FOLDER) if f.lower().endswith((".png", ".jpg", ".jpeg"))]
        total_screenshots = len(screenshot_files)
        
        for idx, file in enumerate(screenshot_files):
            local_path = os.path.join(SCREENSHOT_FOLDER, file)
            gcs_path = f"{folder}screenshots/{file.replace('.png','.webp')}"
            final_url = compress_and_upload_screenshot(local_path, gcs_path)
            uploaded_screenshots.append(final_url)
            
            # Update progress for screenshot processing
            screenshot_progress = 70 + (20 * (idx + 1) / max(total_screenshots, 1))
            analysis_status[report_id]["progress"] = int(screenshot_progress)
            analysis_status[report_id]["current_step"] = f"Processing screenshots... ({idx + 1}/{total_screenshots})"
        
        analysis_status[report_id]["progress"] = 90
        analysis_status[report_id]["current_step"] = "Finalizing upload..."
        
        # Extract time report URL from result
        time_report_url = result.get('time_report_url') if result and isinstance(result, dict) else None
        
        # Upload resume PDF to GCS
        gcs_pdf_path = folder + safe_name
        gcs_pdf_url = upload_file_to_gcs(resume_path, gcs_pdf_path)
        
        analysis_status[report_id] = {
            "status": "complete",
            "progress": 100,
            "current_step": "Complete!",
            "resume_pdf_url": gcs_pdf_url,
            "uploaded_screenshots": uploaded_screenshots,
            "time_report_url": time_report_url
        }
        
    except Exception as e:
        analysis_status[report_id] = {
            "status": "error",
            "error": str(e),
            "progress": 0
        }

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

    # Generate report ID
    report_id = str(uuid.uuid4())
    
    # Start background processing
    thread = threading.Thread(
        target=process_analysis_async,
        args=(portfolio_url, resume_path, report_id, user_id, safe_name)
    )
    thread.daemon = True
    thread.start()
    
    # Return immediately with report_id
    return jsonify({
        "message": "analysis_started",
        "report_id": report_id,
        "resume_data": resume_data
    })

@app.route("/analyze/status/<report_id>", methods=["GET"])
def analyze_status(report_id):
    """Check analysis status"""
    if report_id not in analysis_status:
        return jsonify({"error": "Report not found"}), 404
    
    return jsonify(analysis_status[report_id])


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
