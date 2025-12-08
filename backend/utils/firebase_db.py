"""
Firebase Firestore integration for user profiles
Stores and retrieves user profile data
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
