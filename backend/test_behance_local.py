#!/usr/bin/env python3
"""
Local test script for Behance scraper
"""
import sys
import os

# Add backend to path
sys.path.insert(0, '/Users/akash/Downloads/work/prev/portfolio_app/backend')

from scrapers.behance import extract
import json

def test_behance():
    print("=" * 80)
    print("🧪 TESTING BEHANCE SCRAPER LOCALLY")
    print("=" * 80)
    
    # Test URL
    test_url = "https://www.behance.net/rohanumashankar"
    print(f"\n📍 Testing with: {test_url}\n")
    
    try:
        result = extract(test_url)
        
        print("\n" + "=" * 80)
        print("✅ SCRAPING RESULT")
        print("=" * 80)
        print(json.dumps(result, indent=2))
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 SUMMARY")
        print("=" * 80)
        print(f"URL: {result.get('url', 'N/A')}")
        print(f"Content length: {len(result.get('content', ''))} chars")
        print(f"Text length: {len(result.get('text', ''))} chars")
        print(f"Links found: {len(result.get('links', []))}")
        print(f"Projects found: {len(result.get('project_links', []))}")
        
        if result.get('project_links'):
            print(f"\n🔗 First 5 project links:")
            for link in result.get('project_links', [])[:5]:
                print(f"   - {link}")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    test_behance()
