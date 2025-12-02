"""
Generic web scraper for non-specific platforms
"""
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

def extract(url):
    """Extract content from generic webpage using BeautifulSoup"""
    print(f"  🌐 Scraping generic website: {url}")

    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        for script in soup(["script", "style", "meta", "link"]):
            script.decompose()

        text = soup.get_text()
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        text_content = ' '.join(chunk for chunk in chunks if chunk)

        links = []
        for link in soup.find_all('a'):
            href = link.get('href')
            if href:
                absolute_url = urljoin(url, href)
                if absolute_url.startswith('http'):
                    links.append({'text': link.get_text(strip=True), 'href': absolute_url})

        return {
            'url': url,
            'content': text_content[:5000],
            'links': links[:100],
            'project_links': []
        }

    except Exception as e:
        print(f"  ❌ Generic scraping error: {str(e)}")
        return {'url': url, 'content': '', 'links': [], 'project_links': []}
