"""
Generic content scraper for project pages
"""
import requests
from bs4 import BeautifulSoup

def scrape_project_page(url):
    """Scrape content from a project/case study page"""
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')

        title = ""
        if soup.find('title'):
            title = soup.find('title').get_text(strip=True)
        elif soup.find('h1'):
            title = soup.find('h1').get_text(strip=True)

        meta_desc = ""
        meta_tag = soup.find('meta', attrs={'name': 'description'})
        if meta_tag and meta_tag.get('content'):
            meta_desc = meta_tag['content']

        headings = []
        for tag in ['h1', 'h2', 'h3', 'h4']:
            for heading in soup.find_all(tag):
                headings.append({'level': tag, 'text': heading.get_text(strip=True)})

        for element in soup(['script', 'style', 'nav', 'footer', 'header']):
            element.decompose()

        text_content = soup.get_text(separator=' ', strip=True)
        images = soup.find_all('img')
        image_count = len(images)

        return {
            'url': url,
            'title': title,
            'meta_description': meta_desc,
            'headings': headings,
            'text_content': text_content,
            'full_text_length': len(text_content),
            'total_images': image_count
        }

    except Exception as e:
        print(f"    ⚠️  Scraping failed for {url}: {str(e)}")
        return {
            'url': url, 'title': 'Scraping Failed', 'meta_description': '',
            'headings': [], 'text_content': '', 'full_text_length': 0, 'total_images': 0
        }
