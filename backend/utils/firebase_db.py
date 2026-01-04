"""
Firebase Firestore integration

Includes:
- User profiles (existing)
- Analysis job status tracking (existing)
- Portfolio analysis artifacts (resume, main report, projects, screenshots, time report)
"""

import os
from typing import Dict, Optional
from datetime import datetime

try:
    from firebase_admin import initialize_app, credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    print("[WARNING] firebase-admin not installed. User profile storage will be disabled.")

db = None


def init_firebase():
    """Initialize Firebase Admin SDK"""
    global db
    
    if not FIREBASE_AVAILABLE:
        return False
    
    try:
        # Check if already initialized
        import firebase_admin
        if firebase_admin._apps:
            db = firestore.client()
            return True
        
        # Try to initialize with default credentials
        cred = credentials.ApplicationDefault()
        initialize_app(cred)
        db = firestore.client()
        print("[INFO] Firebase initialized successfully")
        return True
    except Exception as e:
        print(f"[WARNING] Failed to initialize Firebase: {e}")
        return False


def save_user_profile(user_id: str, portfolio_url: str, resume_data: Dict) -> bool:
    """
    Save user profile to Firestore
    
    Args:
        user_id: Firebase user ID
        portfolio_url: Portfolio URL provided by user
        resume_data: Dictionary with extracted resume data
                    {name, email, phone, linkedin_url}
    
    Returns:
        bool: True if successful, False otherwise
    """
    global db
    
    if not db:
        if not init_firebase():
            print("[WARNING] Firestore not available, skipping profile save")
            return False
    
    try:
        profile_data = {
            'userId': user_id,
            'portfolioUrl': portfolio_url,
            'name': resume_data.get('name'),
            'email': resume_data.get('email'),
            'phone': resume_data.get('phone'),
            'linkedinUrl': resume_data.get('linkedin_url'),
            'updatedAt': datetime.now().isoformat(),
            'createdAt': datetime.now().isoformat()
        }
        
        # Save to Firestore
        db.collection('user_profiles').document(user_id).set(profile_data, merge=True)
        print(f"[INFO] User profile saved for {user_id}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to save user profile: {e}")
        return False


def get_user_profile(user_id: str) -> Optional[Dict]:
    """
    Retrieve user profile from Firestore
    
    Args:
        user_id: Firebase user ID
    
    Returns:
        dict: User profile data or None if not found
    """
    global db
    
    if not db:
        if not init_firebase():
            print("[WARNING] Firestore not available, skipping profile retrieval")
            return None
    
    try:
        doc = db.collection('user_profiles').document(user_id).get()
        if doc.exists:
            print(f"[INFO] User profile retrieved for {user_id}")
            return doc.to_dict()
        else:
            print(f"[INFO] No profile found for {user_id}")
            return None
    except Exception as e:
        print(f"[ERROR] Failed to retrieve user profile: {e}")
        return None


def update_user_profile_partial(user_id: str, updates: Dict) -> bool:
    """
    Partially update user profile
    
    Args:
        user_id: Firebase user ID
        updates: Dictionary with fields to update
    
    Returns:
        bool: True if successful, False otherwise
    """
    global db
    
    if not db:
        if not init_firebase():
            return False
    
    try:
        updates['updatedAt'] = datetime.now().isoformat()
        db.collection('user_profiles').document(user_id).update(updates)
        print(f"[INFO] User profile updated for {user_id}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to update user profile: {e}")
        return False


def update_analysis_status(
    report_id: str, 
    status: str, 
    progress: int = 0, 
    message: str = "",
    user_id: str = None,
    portfolio_url: str = None,
    result_data: Dict = None
) -> bool:
    """
    Update analysis job status in Firestore
    
    Args:
        report_id: Unique job ID
        status: Job status (queued, processing, completed, failed)
        progress: Progress percentage (0-100)
        message: Status message
        user_id: Optional user ID
        portfolio_url: Optional portfolio URL
        result_data: Optional result data when completed
    
    Returns:
        bool: True if successful
    """
    global db
    
    if not db:
        if not init_firebase():
            return False
    
    try:
        status_data = {
            'status': status,
            'progress': progress,
            'message': message,
            'updatedAt': datetime.now().isoformat()
        }
        
        # Add optional fields
        if user_id:
            status_data['userId'] = user_id
        if portfolio_url:
            status_data['portfolioUrl'] = portfolio_url
        if result_data:
            # Merge result_data to preserve existing fields like userName and jobRole
            doc_ref = db.collection('analysis_jobs').document(report_id)
            doc = doc_ref.get()
            if doc.exists and 'resultData' in doc.to_dict():
                existing_result_data = doc.to_dict()['resultData']
                # Merge new data with existing, removing None values
                merged_data = {**existing_result_data}
                for key, value in result_data.items():
                    if value is not None:
                        merged_data[key] = value
                status_data['resultData'] = merged_data
            else:
                # Filter out None values from result_data
                status_data['resultData'] = {k: v for k, v in result_data.items() if v is not None}
        
        # If this is the first update, set createdAt
        doc_ref = db.collection('analysis_jobs').document(report_id)
        doc = doc_ref.get()
        if not doc.exists:
            status_data['createdAt'] = datetime.now().isoformat()
        
        doc_ref.set(status_data, merge=True)
        print(f"[INFO] Analysis status updated: {report_id} -> {status} ({progress}%)")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to update analysis status: {e}")
        return False


def get_analysis_status(report_id: str) -> Optional[Dict]:
    """
    Get analysis job status from Firestore
    
    Args:
        report_id: Unique job ID
    
    Returns:
        dict: Status data or None if not found
    """
    global db
    
    if not db:
        if not init_firebase():
            return None
    
    try:
        doc = db.collection('analysis_jobs').document(report_id).get()
        if doc.exists:
            return doc.to_dict()
        else:
            return None
    except Exception as e:
        print(f"[ERROR] Failed to get analysis status: {e}")
        return None


# ------------------------------------------------------------
# Portfolio Analysis Artifacts Save Helpers
# ------------------------------------------------------------

def _get_db():
    """Ensure firestore db is initialized, return client or None."""
    global db
    if not db:
        if not init_firebase():
            return None
    return db


def _get_user_doc(user_id: str):
    """Return (and lazily create) the user document handle."""
    client = _get_db()
    if not client or not user_id:
        return None
    try:
        doc_ref = client.collection('user').document(user_id)
        doc = doc_ref.get()
        if not doc.exists:
            doc_ref.set({
                'userId': user_id,
                'createdAt': datetime.now().isoformat(),
            }, merge=True)
        return doc_ref
    except Exception as e:
        print(f"[ERROR] Failed to access user document for {user_id}: {e}")
        return None


def save_analysis_resume(report_id: str, file_name: str, gcs_url: str, parsed_resume: Optional[Dict], user_id: Optional[str] = None) -> bool:
    """Attach resume info to analysis job document and mirror to user doc."""
    client = _get_db()
    if not client:
        return False
    try:
        doc_ref = client.collection('analysis_jobs').document(report_id)
        doc_ref.set({
            'resume': {
                'fileName': file_name,
                'gcsUrl': gcs_url,
                'parsed': parsed_resume or {},
                'savedAt': datetime.now().isoformat(),
            },
            'updatedAt': datetime.now().isoformat()
        }, merge=True)
        print(f"[INFO] Resume saved for job {report_id}")

        if user_id:
            user_doc = _get_user_doc(user_id)
            if user_doc:
                user_doc.set({
                    'userId': user_id,
                    'storageId': report_id,
                    'resume': {
                        'fileName': file_name,
                        'gcsUrl': gcs_url,
                        'parsed': parsed_resume or {},
                        'savedAt': datetime.now().isoformat(),
                    },
                    'updatedAt': datetime.now().isoformat(),
                }, merge=True)
        return True
    except Exception as e:
        print(f"[ERROR] Failed to save resume for job {report_id}: {e}")
        return False


def save_portfolio_main_json(report_id: str, portfolio_json: Dict, gcs_url: str, user_id: Optional[str] = None) -> bool:
    """Save main portfolio JSON (compact) under analysis job + user doc."""
    client = _get_db()
    if not client:
        return False
    try:
        doc_ref = client.collection('analysis_jobs').document(report_id).collection('portfolio').document('main')
        data = {
            'gcsUrl': gcs_url,
            'url': portfolio_json.get('url'),
            'generatedAt': portfolio_json.get('generated_at') or datetime.now().isoformat(),
            'json': portfolio_json,  # store as-is; keep frontend reading from GCS for heavy use
            'savedAt': datetime.now().isoformat(),
        }
        doc_ref.set(data, merge=True)
        print(f"[INFO] Main portfolio JSON saved in DB for job {report_id}")

        if user_id:
            user_doc = _get_user_doc(user_id)
            if user_doc:
                user_portfolio = user_doc.collection('portfolio').document('main')
                user_portfolio.set({
                    'storageId': report_id,
                    'gcsUrl': gcs_url,
                    'url': portfolio_json.get('url'),
                    'json': portfolio_json,
                    'savedAt': datetime.now().isoformat(),
                }, merge=True)
                user_doc.set({
                    'userId': user_id,
                    'storageId': report_id,
                    'updatedAt': datetime.now().isoformat(),
                }, merge=True)
        return True
    except Exception as e:
        print(f"[ERROR] Failed to save portfolio JSON for job {report_id}: {e}")
        return False


def save_time_report(report_id: str, timings: Dict, gcs_url: str) -> bool:
    """Save timing report JSON and its GCS URL under subcollection 'reports'."""
    client = _get_db()
    if not client:
        return False
    try:
        doc_ref = client.collection('analysis_jobs').document(report_id).collection('reports').document('time_report')
        doc_ref.set({
            'gcsUrl': gcs_url,
            'json': timings,
            'savedAt': datetime.now().isoformat(),
        }, merge=True)
        print(f"[INFO] Time report saved in DB for job {report_id}")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to save time report for job {report_id}: {e}")
        return False


def save_screenshot_record(report_id: str, project_url: str, screenshot_url: str, filename: Optional[str] = None, user_id: Optional[str] = None) -> bool:
    """Save a screenshot record under 'screenshots' and mirror to user doc."""
    client = _get_db()
    if not client:
        return False
    try:
        coll = client.collection('analysis_jobs').document(report_id).collection('screenshots')
        doc_ref = coll.document()
        payload = {
            'projectUrl': project_url,
            'screenshotUrl': screenshot_url,
            'fileName': filename,
            'savedAt': datetime.now().isoformat(),
        }
        doc_ref.set(payload)

        if user_id:
            user_doc = _get_user_doc(user_id)
            if user_doc:
                shot_ref = user_doc.collection('screenshots').document()
                shot_ref.set({
                    **payload,
                    'storageId': report_id,
                })
                user_doc.set({
                    'userId': user_id,
                    'storageId': report_id,
                    'updatedAt': datetime.now().isoformat(),
                }, merge=True)
        return True
    except Exception as e:
        print(f"[ERROR] Failed to save screenshot record for job {report_id}: {e}")
        return False


def save_project_json(report_id: str, project_url: str, project_json: Dict, gcs_url: str, screenshot_url: Optional[str] = None, user_id: Optional[str] = None) -> bool:
    """Save per-project JSON and metadata under 'projects' and user doc."""
    client = _get_db()
    if not client:
        return False
    try:
        # Use a deterministic doc id based on URL (safe slug)
        from urllib.parse import urlparse
        parsed = urlparse(project_url)
        doc_id = (parsed.netloc + parsed.path).replace('/', '_').replace('.', '_')[:200]

        analysis = project_json.get('analysis', {}) if isinstance(project_json, dict) else {}
        scraped = project_json.get('scraped_data', {}) if isinstance(project_json, dict) else {}

        data = {
            'url': project_url,
            'gcsUrl': gcs_url,
            'screenshotUrl': screenshot_url,
            'title': scraped.get('title') or project_url.split('/')[-1],
            'scraped': {
                'title': scraped.get('title'),
                'meta_description': scraped.get('meta_description'),
                'full_text_length': scraped.get('full_text_length'),
                'total_images': scraped.get('total_images'),
                'headings': (scraped.get('headings') or [])[:20],
                'excerpt': (scraped.get('text_content') or '')[:1000],
            },
            'analysis': {
                'overall_score': analysis.get('overall_score'),
                'phase_scores': analysis.get('phase_scores'),
                'ux_keywords': analysis.get('ux_keywords'),
                'improvements': analysis.get('improvements'),
                'verdict': analysis.get('verdict'),
                'summary': analysis.get('summary') or analysis.get('overall_feedback'),
            },
            'json': project_json,  # as-is
            'savedAt': datetime.now().isoformat(),
        }

        doc_ref = client.collection('analysis_jobs').document(report_id).collection('projects').document(doc_id)
        doc_ref.set(data, merge=True)
        print(f"[INFO] Project saved in DB for job {report_id}: {project_url}")

        if user_id:
            user_doc = _get_user_doc(user_id)
            if user_doc:
                user_project = user_doc.collection('case_studies').document(doc_id)
                user_project.set({
                    'storageId': report_id,
                    'url': project_url,
                    'gcsUrl': gcs_url,
                    'screenshotUrl': screenshot_url,
                    'title': data.get('title'),
                    'json': project_json,
                    'savedAt': datetime.now().isoformat(),
                }, merge=True)
                user_doc.set({
                    'userId': user_id,
                    'storageId': report_id,
                    'updatedAt': datetime.now().isoformat(),
                }, merge=True)
        return True
    except Exception as e:
        print(f"[ERROR] Failed to save project for job {report_id}: {e}")
        return False
