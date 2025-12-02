"""
Helper utility functions
"""
import re
from urllib.parse import urlparse

def clean_filename(text, max_length=100):
    """Convert text to safe filename"""
    text = re.sub(r'[^a-zA-Z0-9_-]', '_', text)
    text = re.sub(r'_+', '_', text)
    text = text.strip('_').lower()
    return text[:max_length]

def extract_domain(url):
    """Extract domain from URL"""
    parsed = urlparse(url)
    return parsed.netloc

def is_valid_url(url):
    """Check if URL is valid"""
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False

def truncate_text(text, max_length=500, suffix='...'):
    """Truncate text to max length"""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix
