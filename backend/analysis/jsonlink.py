"""
Extracts project/case study links from JSON data
"""
import json

def extract_links_from_data(data):
    """Extract all HTTP links from various JSON structures"""
    links = set()

    def extract_recursive(obj):
        """Recursively search for URLs"""
        if isinstance(obj, str):
            if obj.startswith('http'):
                links.add(obj)
        elif isinstance(obj, dict):
            for key, value in obj.items():
                if key in ['project_links', 'links', 'href', 'url']:
                    if isinstance(value, list):
                        for item in value:
                            extract_recursive(item)
                    else:
                        extract_recursive(value)
                else:
                    extract_recursive(value)
        elif isinstance(obj, list):
            for item in obj:
                extract_recursive(item)

    extract_recursive(data)
    return list(links)

def extract_links_from_file(json_path):
    """Extract links from a JSON file"""
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return extract_links_from_data(data)
    except Exception as e:
        print(f"Error reading {json_path}: {e}")
        return []
