"""
Gemini API integration for content analysis
Mock implementation with option for real API
"""
import os
import json
import re
# GEMINI_API_KEY= None
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'AIzaSyDSsiJ8AzebMg2qv7khpnqWyZFp49W4QJU')
# AIzaSyCXh44QZP1Dv5iPeZue2Z0SH9jhKILY3m8
#AIzaSyDSsiJ8AzebMg2qv7khpnqWyZFp49W4QJU
USE_REAL_API = bool(GEMINI_API_KEY)

if USE_REAL_API:
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        print("✅ Gemini API configured")
    except ImportError:
        print("⚠️  google-generativeai not installed, using mock mode")
        USE_REAL_API = False

def analyze_content(prompt, data):
    """Analyze content using Gemini API (or mock)"""
    if USE_REAL_API:
        return analyze_with_real_api(prompt, data)
    else:
        return analyze_with_mock(prompt, data)

def analyze_with_real_api(prompt, data):
    """Use actual Gemini API for analysis"""
    try:
        model = genai.GenerativeModel('models/gemini-2.0-flash-exp')
        full_prompt = f"{prompt}\n\nData: {json.dumps(data, indent=2)[:10000]}"
        response = model.generate_content(full_prompt)
        response_text = response.text.strip()
        return parse_json_response(response_text)
    except Exception as e:
        print(f"  ⚠️  Gemini API error: {e}")
        return analyze_with_mock(prompt, data)

def parse_json_response(text):
    """Extract JSON from Gemini response that might contain markdown"""
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)

    try:
        return json.loads(text)
    except:
        pass

    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except:
            pass

    return {'error': 'Could not parse JSON', 'raw_response': text[:500]}

def analyze_with_mock(prompt, data):
    """Generate mock analysis when API is not available"""
    print("  🔧 Using mock analysis (set GEMINI_API_KEY for real analysis)")

    if 'project_name' in prompt or 'case study' in prompt.lower():
        return {
            'project_name': data.get('scraped_data', {}).get('title', 'Mock Project'),
            'score': 75,
            'strengths': [
                'Clear project structure',
                'Good visual presentation',
                'Problem statement defined'
            ],
            'weaknesses': [
                'Could show more user research',
                'Missing validation metrics',
                'Limited iteration examples'
            ],
            'summary': 'This is a mock analysis. The project demonstrates solid UX practices with room for improvement in research documentation.',
            'has_user_research': True,
            'has_iterations': True,
            'has_visuals': True,
            'recommendation': 'Add more detailed user research methodology and testing results.'
        }
    else:
        return {
            'portfolio_summary': 'This is a mock analysis. Portfolio shows professional work across multiple projects.',
            'project_links': [],
            'skills_detected': ['UI/UX Design', 'Prototyping', 'User Research', 'Visual Design'],
            'overall_quality': 'Good'
        }
