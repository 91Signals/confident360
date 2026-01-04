from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import os
import json
import uuid
import io

from google.cloud import storage
from PIL import Image

from main import run_analysis_from_flask
import threading
from utils.gcs_utils import upload_file_to_gcs
from utils.resume_parser import parse_resume
from utils.firebase_db import (
    save_user_profile,
    get_user_profile,
    update_user_profile_partial,
    update_analysis_status,
    get_analysis_status,
    save_analysis_resume,
)

# ---------------------------------------
# FLASK + FOLDER SETUP
# ---------------------------------------

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))

UPLOAD_FOLDER = os.path.join(BACKEND_DIR, "uploads")
REPORT_FOLDER = os.path.join(BACKEND_DIR, "reports")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(REPORT_FOLDER, exist_ok=True)

BUCKET_NAME = "portfolio-reports-confi360"
_storage_client = None

def get_storage_client():
    global _storage_client
    if _storage_client is None:
        _storage_client = storage.Client()
    return _storage_client

app = Flask(__name__)
CORS(app)

# ---------------------------------------
# ROUTES (STATIC)
# ---------------------------------------

@app.route("/")
def home():
    return jsonify({"status": "backend_running"})

# ---------------------------------------
# ANALYZE → RUN PIPELINE (SYNC)
# ---------------------------------------

@app.route("/analyze", methods=["POST"])
def analyze():
    portfolio_url = request.form.get("portfolioUrl")
    resume = request.files.get("resume")
    user_id = request.form.get("userId")
    user_name = request.form.get("userName")
    job_role = request.form.get("jobRole", "Product Designer")

    if not portfolio_url:
        return jsonify({"error": "Portfolio URL missing"}), 400
    if not resume:
        return jsonify({"error": "Resume file missing"}), 400

    # ---------------------------------------
    # PREPARE JOB (FAST)
    # ---------------------------------------

    report_id = str(uuid.uuid4())
    gcs_folder = f"{report_id}/"

    # Save resume locally (job-scoped)
    safe_name = resume.filename.replace(" ", "_")
    resume_path = os.path.join(UPLOAD_FOLDER, f"{report_id}_{safe_name}")
    resume.save(resume_path)

    # Parse resume just for display name
    resume_data = parse_resume(resume_path)
    display_name = (
        (resume_data or {}).get("name")
        or (resume_data or {}).get("full_name")
        or user_name
        or "Designer"
    )

    # Save profile if logged in (non-blocking firestore write)
    if user_id:
        save_user_profile(user_id, portfolio_url, resume_data)

    # Upload resume to GCS (quick)
    gcs_pdf_url = upload_file_to_gcs(resume_path, gcs_folder + safe_name)

    # Save resume record in DB
    try:
        save_analysis_resume(report_id, safe_name, gcs_pdf_url, resume_data, user_id)
    except Exception as _:
        pass

    # Initialize Firestore status
    update_analysis_status(
        report_id,
        status="processing",
        progress=5,
        message="Starting analysis...",
        user_id=user_id,
        portfolio_url=portfolio_url,
        result_data={
            "userName": display_name,
            "jobRole": job_role,
        },
    )

    # ---------------------------------------
    # START BACKGROUND ANALYSIS THREAD
    # ---------------------------------------

    def run_analysis_background():
        try:
            result = run_analysis_from_flask(
                portfolio_url,
                resume_path=resume_path,
                report_id=report_id,
                user_id=user_id,
            )

            projects_found = len(result.get("project_links", []) or [])
            projects_analyzed = result.get("project_reports_count", 0)

            update_analysis_status(
                report_id,
                status="completed",
                progress=100,
                message="Analysis complete",
                result_data={
                    "resume_pdf_url": gcs_pdf_url,
                    "projects_found": projects_found,
                    "projects_analyzed": projects_analyzed,
                    "time_report_url": result.get("time_report_url"),
                },
            )
        except Exception as e:
            import traceback
            traceback.print_exc()
            update_analysis_status(
                report_id,
                status="failed",
                progress=0,
                message=str(e),
            )

    threading.Thread(target=run_analysis_background, daemon=True).start()

    # Return immediately to satisfy Cloud Run/Hosting first-byte requirement
    return jsonify({
        "report_id": report_id,
        "status": "processing",
    })



# ---------------------------------------
# STATUS POLLING
# ---------------------------------------

@app.route("/api/status/<report_id>", methods=["GET"])
def get_status(report_id):
    try:
        status_data = get_analysis_status(report_id)

        if not status_data:
            return jsonify({"error": "Job not found"}), 404

        return jsonify({
            "success": True,
            "reportId": report_id,
            "status": status_data.get("status"),
            "progress": status_data.get("progress", 0),
            "message": status_data.get("message", ""),
            "resultData": status_data.get("resultData"),
            "updatedAt": status_data.get("updatedAt"),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------------------------------------
# USER PROFILE APIs
# ---------------------------------------

@app.route("/api/extract-resume", methods=["POST"])
def extract_resume():
    resume = request.files.get("resume")
    if not resume:
        return jsonify({"error": "Resume missing"}), 400

    try:
        temp_path = os.path.join(UPLOAD_FOLDER, resume.filename)
        resume.save(temp_path)
        data = parse_resume(temp_path)
        os.remove(temp_path)
        return jsonify({"success": True, "data": data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/user-profile", methods=["GET"])
def get_profile():
    user_id = request.args.get("userId")
    if not user_id:
        return jsonify({"error": "userId missing"}), 400

    profile = get_user_profile(user_id)
    if not profile:
        return jsonify({"error": "Profile not found"}), 404

    return jsonify({"success": True, "profile": profile})


@app.route("/api/user-profile", methods=["POST"])
def save_profile():
    user_id = request.form.get("userId")
    if not user_id:
        return jsonify({"error": "userId missing"}), 400

    updates = {}
    for field in ["name", "email", "phone", "linkedinUrl"]:
        if request.form.get(field):
            updates[field] = request.form.get(field)

    success = update_user_profile_partial(user_id, updates)
    if not success:
        return jsonify({"error": "Failed to update profile"}), 500

    return jsonify({"success": True})


# ---------------------------------------
# REPORTS FETCH
# ---------------------------------------

@app.route("/reports")
def get_reports():
    report_id = request.args.get("report_id")
    if not report_id:
        return jsonify({"error": "Missing report_id"}), 400

    bucket = get_storage_client().bucket(BUCKET_NAME)
    prefix = f"{report_id}/"

    blobs = list(bucket.list_blobs(prefix=prefix))

    if not blobs:
        return jsonify({
            "status": "not_found",
            "portfolio": None,
            "case_studies": []
        })

    portfolio = None
    case_studies = []

    for blob in blobs:
        if not blob.name.endswith(".json"):
            continue

        try:
            content = json.loads(blob.download_as_text())
        except Exception:
            continue

        # Detect main portfolio file
        if blob.name.endswith("_main_portfolio.json"):
            # Ensure type field for frontend
            if isinstance(content, dict):
                content.setdefault("type", "portfolio")
            portfolio = content

        # Detect project case studies
        elif "/projects/" in blob.name:
            # Normalize structure for frontend consumption
            if isinstance(content, dict):
                analysis = content.get("analysis", {})
                scraped = content.get("scraped_data", {})
                # Prefer project_name saved in report; fallback to title or URL
                project_name = content.get("project_name") or scraped.get("title") or (content.get("url") or "").split("/")[-1]
                normalized = {
                    "type": "case_study",
                    "url": content.get("url"),
                    "project_name": project_name,
                    "category": "UX/UI",
                    # map snake_case to camelCase expected by frontend
                    "overallScore": analysis.get("overall_score", 0) or 0,
                    "phase_scores": analysis.get("phase_scores", []) or [],
                    "ux_keywords": analysis.get("ux_keywords", []) or [],
                    "improvements": analysis.get("improvements", []) or [],
                    "verdict": analysis.get("verdict", "") or "",
                    "summary": analysis.get("overall_feedback", "") or "",
                }
                case_studies.append(normalized)
            else:
                case_studies.append(content)

    return jsonify({
        "status": "ok",
        "portfolio": portfolio,
        "case_studies": case_studies
    })



# ---------------------------------------
# SCREENSHOT PROXY
# ---------------------------------------

@app.route("/reports/<report_id>/screenshots/<filename>")
def serve_screenshot(report_id, filename):
    try:
        blob = get_storage_client().bucket(BUCKET_NAME).blob(
            f"{report_id}/screenshots/{filename}"
        )
        if not blob.exists():
            return "Not found", 404

        return send_file(
            io.BytesIO(blob.download_as_bytes()),
            mimetype="image/webp",
        )
    except Exception as e:
        return str(e), 500


# ---------------------------------------
# RUN
# ---------------------------------------

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
