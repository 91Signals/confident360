"""
Main entry point for Portfolio Analyzer (Flask version)
This version exposes a function that receives URL + resume path
and runs the complete analysis pipeline without input() or prints.
"""

from main_page import process_main_url

def run_analysis_from_flask(url, resume_path=None, report_id=None):
    """
    This function replaces the old CLI workflow.
    
    Parameters:
        url (str): Portfolio URL given by Flask
        resume_path (str): Path to uploaded resume (optional)
        report_id (str): UUID for GCS folder
    
    Returns:
        dict: result of processing, same structure as before
    """

    # Normalize URL
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    # You can pass resume_path to downstream functions if needed
    # For example — if Gemini API uses the resume for context:
    # result = process_main_url(url, resume_path=resume_path)

    result = process_main_url(url, report_id)

    return result


# OPTIONAL:
# Keep CLI mode ONLY if someone runs python main.py directly
if __name__ == "__main__":
    print("❌ This version is designed for Flask. Use app.py instead.")
