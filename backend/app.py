from flask import Flask, render_template, request, jsonify, send_from_directory
import os
import json
from main import run_analysis_from_flask

# ---------------------------------------
# PATH SETUP
# ---------------------------------------
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(BACKEND_DIR, "..", "frontend")

UPLOAD_FOLDER = os.path.join(BACKEND_DIR, "uploads")
REPORT_FOLDER = os.path.join(BACKEND_DIR, "reports")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(REPORT_FOLDER, exist_ok=True)
os.makedirs(os.path.join(REPORT_FOLDER, "screenshots"), exist_ok=True)

# ---------------------------------------
# FLASK APP WITH CUSTOM TEMPLATE + STATIC PATHS
# ---------------------------------------
app = Flask(
    __name__,
    template_folder=os.path.join(FRONTEND_DIR, "templates"),
    static_folder=os.path.join(FRONTEND_DIR, "static")
)

# ---------------------------------------
# ROUTES
# ---------------------------------------
@app.route("/")
def home():
    return render_template("index.html")


@app.route("/results")
def results_page():
    return render_template("results.html")


# Serve screenshots from backend/reports/screenshots
@app.route("/reports/screenshots/<path:filename>")
def report_screenshots(filename):
    screenshots_dir = os.path.join(REPORT_FOLDER, "screenshots")
    return send_from_directory(screenshots_dir, filename)


@app.route("/analyze", methods=["POST"])
def analyze():
    portfolio_url = request.form.get("portfolioUrl")
    resume = request.files.get("resume")

    if not portfolio_url:
        return jsonify({"error": "Portfolio URL missing"}), 400
    if not resume:
        return jsonify({"error": "Resume file missing"}), 400

    # Save resume safely
    safe_name = resume.filename.replace(" ", "_")
    resume_path = os.path.join(UPLOAD_FOLDER, safe_name)
    resume.save(resume_path)

    # Clear old reports
    for file in os.listdir(REPORT_FOLDER):
        if file.endswith(".json"):
            os.remove(os.path.join(REPORT_FOLDER, file))

    # Run backend pipeline
    try:
        run_analysis_from_flask(portfolio_url, resume_path)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({"message": "analysis_complete"})


@app.route("/reports")
def get_reports():

    results = []
    report_files = sorted(os.listdir(REPORT_FOLDER))

    for file in report_files:

        if not file.endswith(".json"):
            continue

        file_path = os.path.join(REPORT_FOLDER, file)
        with open(file_path, "r", encoding="utf-8") as f:
            raw = json.load(f)

        # Normalize screenshot path (IMPORTANT FIX)
        screenshot_raw = raw.get("screenshot")
        screenshot_url = None
        if screenshot_raw:
            # Always convert to /reports/screenshots/<file>
            screenshot_url = "backend/reports/screenshots/" + os.path.basename(screenshot_raw)

        # -------------------------
        # MAIN PORTFOLIO REPORT
        # -------------------------
        if "structured_content" in raw and "analysis" in raw:

            structured = raw.get("structured_content", {})
            analysis = raw.get("analysis", {})

            results.append({
                "type": "portfolio",
                "url": raw.get("url", ""),
                "hero": structured.get("hero", ""),
                "about": structured.get("about", ""),
                "skills": structured.get("skills", []),
                "projects": structured.get("projects", []),
                "contact": structured.get("contact", {}),
                "links": structured.get("all_links", []),

                "overall_feedback": analysis.get("overall_feedback", ""),
                "sections": analysis.get("section_wise", [])
            })

        # -------------------------
        # CASE STUDY REPORT
        # -------------------------
        elif "analysis" in raw and "scraped_data" in raw:

            analysis = raw.get("analysis", {})

            results.append({
                "type": "case_study",
                "url": raw.get("url", ""),
                "title": raw.get("scraped_data", {}).get("title", "Untitled Case Study"),

                "overallScore": analysis.get("overall_score", 0),
                "phaseScores": analysis.get("phase_scores", []),

                "summary": analysis.get("summary", ""),
                "ux_keywords": analysis.get("ux_keywords", []),

                "improvements": analysis.get("improvements", []),
                "verdict": analysis.get("verdict", ""),

                "screenshot": screenshot_url
            })

    return jsonify(results)


if __name__ == "__main__":
    app.run(debug=True)
