"""
Resume Parser - Extract key information from PDF resumes
Extracts: name, email, phone, linkedin URL
"""

import pdfplumber
import re
from typing import Dict, Optional


def extract_phone_number(text: str) -> Optional[str]:
    """Extract phone number from text"""
    # Common phone number patterns
    patterns = [
        r'\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b',  # US format
        r'\b\+?[1-9]\d{1,14}\b',  # International format
        r'\b(?:Phone|Mobile|Tel|Ph)[:\s]+([+\d\-\(\)\s]+)',  # Label + number
    ]
    
    for pattern in patterns:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            # Clean up the match
            phone = re.sub(r'[^\d+]', '', match.group())
            if len(phone) >= 10:
                return phone
    
    return None


def extract_linkedin_url(text: str) -> Optional[str]:
    """Extract LinkedIn URL from text"""
    patterns = [
        r'linkedin\.com/in/[\w\-]+',
        r'linkedin\.com/company/[\w\-]+',
        r'linkedin\.com/profile/[\w\-]+',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            url = match.group()
            if not url.startswith('http'):
                url = 'https://' + url
            return url
    
    return None


def extract_email(text: str) -> Optional[str]:
    """Extract email address from text"""
    pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    match = re.search(pattern, text)
    return match.group() if match else None


def extract_name(text: str) -> Optional[str]:
    """
    Extract name from resume (usually at the top)
    This is a heuristic approach - gets the first meaningful line
    """
    lines = text.strip().split('\n')
    
    for line in lines[:10]:  # Check first 10 lines
        line = line.strip()
        
        # Skip empty lines and common headers
        if not line or len(line) < 2:
            continue
        
        skip_words = ['resume', 'cv', 'curriculum', 'vitae', 'phone', 'email', 
                      'linkedin', 'portfolio', 'website', 'contact', 'phone:',
                      'email:', 'mobile:', 'tel:', 'www', 'http', '|', '/', '-']
        
        if any(word in line.lower() for word in skip_words):
            continue
        
        # If line has multiple words and looks like a name
        if len(line.split()) >= 1 and len(line) <= 100:
            # Remove trailing punctuation and unwanted characters
            name = re.sub(r'[^a-zA-Z\s\-\.\'&]', '', line)
            name = name.strip()
            
            if name and len(name) >= 2:
                return name
    
    return None


def parse_resume(pdf_path: str) -> Dict[str, Optional[str]]:
    """
    Parse resume PDF and extract key information
    
    Args:
        pdf_path: Path to the PDF resume file
    
    Returns:
        Dictionary with extracted information:
        {
            'name': str or None,
            'email': str or None,
            'phone': str or None,
            'linkedin_url': str or None
        }
    """
    result = {
        'name': None,
        'email': None,
        'phone': None,
        'linkedin_url': None
    }
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            full_text = ''
            
            # Extract text from all pages
            for page in pdf.pages:
                full_text += page.extract_text() + '\n'
        
        # Extract information
        result['name'] = extract_name(full_text)
        result['email'] = extract_email(full_text)
        result['phone'] = extract_phone_number(full_text)
        result['linkedin_url'] = extract_linkedin_url(full_text)
        
        print(f"[DEBUG] Resume parsing results:")
        print(f"  Name: {result['name']}")
        print(f"  Email: {result['email']}")
        print(f"  Phone: {result['phone']}")
        print(f"  LinkedIn: {result['linkedin_url']}")
        
    except Exception as e:
        print(f"[ERROR] Failed to parse resume: {e}")
    
    return result
