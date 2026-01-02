"""
Analyzes individual case study projects using screenshot + scraping + Gemini
"""
import os
import json
from datetime import datetime

from analysis.screenshot import capture_screenshot
from scrapers.scraper import scrape_project_page
from utils.gemini_api import analyze_content
from utils.gcs_utils import upload_file_to_gcs
from utils.firebase_db import save_project_json, save_screenshot_record
from urllib.parse import urlparse
from bs4 import BeautifulSoup
try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sync_playwright = None


def create_project_slug(url):
    """Create a safe filename from URL."""
    parsed = urlparse(url)
    slug = parsed.netloc.replace(".", "_") + parsed.path.replace("/", "_")
    return slug[:150]


def scrape_designfolio_with_context(project_url, portfolio_url):
    """Scrape Designfolio project page by first loading portfolio for context"""
    print(f"  📱 Scraping Designfolio project with context: {project_url}")
    
    try:
        if not sync_playwright:
            print(f"  ⚠️  Playwright not available, falling back to normal scraper")
            return scrape_project_page(project_url)
        
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            
            # First, load the portfolio page to establish context/session
            print(f"  [DEBUG] Loading portfolio context: {portfolio_url}")
            page.goto(portfolio_url, wait_until="networkidle", timeout=60000)
            
            # Scroll to simulate user interaction
            for _ in range(5):
                page.mouse.wheel(0, 2000)
                page.wait_for_timeout(200)
            
            page.wait_for_timeout(2000)  # Additional wait for page to stabilize
            
            # Now navigate to the project page (with context established)
            print(f"  [DEBUG] Navigating to project page with context: {project_url}")
            page.goto(project_url, wait_until="networkidle", timeout=60000)
            
            # Wait for page to fully load
            page.wait_for_timeout(3000)
            
            # Scroll the project page
            for _ in range(10):
                page.mouse.wheel(0, 3000)
                page.wait_for_timeout(300)
            
            page.wait_for_timeout(2000)  # Final wait
            
            # Get page content
            html_content = page.content()
            browser.close()
            
            # Parse with BeautifulSoup
            soup = BeautifulSoup(html_content, 'html.parser')
            
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
                'url': project_url,
                'title': title,
                'meta_description': meta_desc,
                'headings': headings,
                'text_content': text_content,
                'full_text_length': len(text_content),
                'total_images': image_count
            }
    
    except Exception as e:
        print(f"  ❌ Designfolio context scraping failed: {str(e)}")
        return {
            'url': project_url,
            'title': 'Scraping Failed',
            'meta_description': '',
            'headings': [],
            'text_content': '',
            'full_text_length': 0,
            'total_images': 0
        }


def analyze_projects(project_links, parent_url, gcs_folder, report_id=None):
    """
    Analyzes each project page using:
      - HTML scraping
      - Screenshot capture
      - Gemini case-study scoring prompt
    
    Returns:
        tuple: (count, project_timings) where project_timings is a list of timing dicts
    """
    import time
    count = 0
    project_timings = []
    print(f"[DEBUG] Starting analysis of {len(project_links)} project links for parent: {parent_url}")
    
    # Import status updater if report_id provided
    update_status = None
    if report_id:
        try:
            from utils.firebase_db import update_analysis_status
            update_status = update_analysis_status
        except ImportError:
            pass

    # Use provided GCS folder
    gcs_project_folder = gcs_folder + "projects/"

    for idx, link in enumerate(project_links, 1):
        print(f"\n  [DEBUG] [{idx}/{len(project_links)}] Analyzing project: {link}")
        project_start_time = time.perf_counter()
        project_timing = {
            "project_url": link,
            "project_name": link.split('/')[-1] or link,
            "index": idx
        }
        
        try:
            # Scraping - use context-aware scraping for Designfolio
            print(f"  [DEBUG] Scraping project page: {link}")
            scrape_start = time.perf_counter()
            
            # Detect Designfolio project and use context-aware scraper
            if 'designfolio.me/project/' in link:
                scraped_data = scrape_designfolio_with_context(link, parent_url)
            else:
                scraped_data = scrape_project_page(link)
            
            project_timing['scraping_seconds'] = round(time.perf_counter() - scrape_start, 2)
            print(f"  [DEBUG] Scraping complete for: {link} ({project_timing['scraping_seconds']:.2f}s)")
            
            # Update project_name with actual title from scraped data
            # Special handling: Framer sites often have a generic site title.
            # For framer.website, use the URL slug as the case study name.
            try:
              _parsed_link = urlparse(link)
              _is_framer = 'framer.website' in (_parsed_link.netloc or '')
            except Exception:
              _is_framer = False

            if _is_framer:
              # Use last path segment as the case study name
              _slug = (_parsed_link.path or '').strip('/').split('/')[-1] or link
              project_timing['project_name'] = _slug
            elif scraped_data.get('title') and scraped_data['title'] != 'Scraping Failed':
              # Behance/Designfolio have explicit title field
              project_timing['project_name'] = scraped_data['title']
            elif scraped_data.get('content'):
                # Notion projects - extract title from first line of content
                first_line = scraped_data['content'].split('\n')[0].strip()
                if first_line and len(first_line) > 5:  # Ensure it's a meaningful title
                    project_timing['project_name'] = first_line
                else:
                    # Fallback to second line if first is too short
                    lines = [l.strip() for l in scraped_data['content'].split('\n') if l.strip()]
                    if len(lines) > 1 and len(lines[1]) > 5:
                        project_timing['project_name'] = lines[1]

            # Screenshot
            print(f"  [DEBUG] Capturing screenshot for: {link}")
            screenshot_start = time.perf_counter()
            # Pass the gcs_folder to capture_screenshot so it saves in the correct GCS path
            try:
              screenshot_path = capture_screenshot(link, gcs_folder_prefix=gcs_folder)
              if screenshot_path:
                print(f"  [DEBUG] Screenshot saved at: {screenshot_path} ({project_timing.get('screenshot_seconds', 0):.2f}s)")
                # Save screenshot record to DB
                if report_id:
                  try:
                    # try to derive filename from URL
                    import urllib.parse as _u
                    _parsed = _u.urlparse(screenshot_path)
                    filename = _parsed.path.split('/')[-1]
                    save_screenshot_record(report_id, link, screenshot_path, filename)
                  except Exception as _:
                    pass
              else:
                print(f"  ⚠️ Screenshot skipped/failed for: {link} (continuing analysis)")
                screenshot_path = None
            except Exception as screenshot_error:
              print(f"  ⚠️ Screenshot error: {screenshot_error} (continuing analysis)")
              screenshot_path = None
            
            project_timing['screenshot_seconds'] = round(time.perf_counter() - screenshot_start, 2)

            # Update status before analysis
            if update_status and report_id:
                update_status(
                    report_id,
                    status="processing",
                    progress=30 + int((idx / len(project_links)) * 60),
                    message=f"Analyzing case study {idx}/{len(project_links)}...",
                    result_data={
                        "projects_found": len(project_links),
                        "projects_analyzed": count,
                        "current_project_url": link,
                    }
                )

            print(f"  [DEBUG] Preparing Gemini prompt for: {link}")
            # --------------------------------------
            # GEMINI CASE-STUDY PROMPT
            # --------------------------------------
            prompt = f"""
You are an expert UX case study reviewer with deep knowledge of design thinking, user research, and best practices in product design.

Analyze the provided case study page according to this comprehensive scoring model:
Give Marks liniently if certain sections are missing but the overall quality is high.
📊 UX Case Study Scoring Model (100 Points Total)

1. Research & Insights (15 points)
2. Context, Domain & Problem Definition (15 points)
3. Ideation & Design Process (20 points)
4. Visual Design & UX/UI Quality (20 points)
5. Validation & Iteration (15 points)
6. Storytelling (10 points)
7. Bonus Points (5 points)

---------------------------
CASE STUDY PAGE DATA
---------------------------

Title: {scraped_data.get('title', 'N/A')}
URL: {scraped_data.get('url', link)}
Description: {scraped_data.get('meta_description', 'N/A')}
Content Length: {scraped_data.get('full_text_length', 0)} characters
Total Images: {scraped_data.get('total_images', 0)}
Headings Count: {len(scraped_data.get('headings', []))}

TEXT CONTENT (first 5000 chars):
{scraped_data.get('text_content', '')[:5000]}

HEADINGS:
{json.dumps(scraped_data.get('headings', [])[:15], indent=2)}

A screenshot of the case study page is also provided for visual assessment.Give higher priority to deep analysis of the screenshot and overall page structure.

---------------------------
RESPONSE FORMAT (STRICT)
---------------------------
Return ONLY **valid JSON** (no markdown, no commentary).
Use EXACTLY this structure:

{{
  "overall_score": <number 0-100>,

  "phase_scores": [
    {{
      "phase": "Research & Insights",
      "score": <number>,
      "max_score": 15,
      "reasoning": "<detailed explanation>",
      "subsections": [
        {{
          "name": "Secondary research",
          "score": <number>,
          "max_score": 5,
          "reasoning": "<explanation>"
        }},
        {{
          "name": "Primary research",
          "score": <number>,
          "max_score": 5,
          "reasoning": "<explanation>"
        }},
        {{
          "name": "Quality & depth of insights",
          "score": <number>,
          "max_score": 5,
          "reasoning": "<explanation>"
        }}
      ]
    }},

    {{
      "phase": "Context, Domain & Problem Definition",
      "score": <number>,
      "max_score": 15,
      "reasoning": "<detailed explanation>",
      "subsections": [
        {{
          "name": "Problem statement clarity",
          "score": <number>,
          "max_score": 5,
          "reasoning": "<explanation>"
        }},
        {{
          "name": "Business context & target audience",
          "score": <number>,
          "max_score": 5,
          "reasoning": "<explanation>"
        }},
        {{
          "name": "Success metrics defined",
          "score": <number>,
          "max_score": 5,
          "reasoning": "<explanation>"
        }}
      ]
    }},

    {{
      "phase": "Ideation & Design Process",
      "score": <number>,
      "max_score": 20,
      "reasoning": "<detailed explanation>",
      "subsections": [
        {{
          "name": "Brainstorming & ideation",
          "score": <number>,
          "max_score": 5,
          "reasoning": "<explanation>"
        }},
        {{
          "name": "Design iterations",
          "score": <number>,
          "max_score": 5,
          "reasoning": "<explanation>"
        }},
        {{
          "name": "Wireframes/sketches/prototypes",
          "score": <number>,
          "max_score": 5,
          "reasoning": "<explanation>"
        }},
        {{
          "name": "Design decision rationale",
          "score": <number>,
          "max_score": 5,
          "reasoning": "<explanation>"
        }}
      ]
    }},

    {{
      "phase": "Visual Design & UX/UI Quality",
      "score": <number>,
      "max_score": 20,
      "reasoning": "<detailed explanation>",
      "subsections": [
        {{
          "name": "Visual hierarchy & aesthetics",
          "score": <number>,
          "max_score": 5,
          "reasoning": "<explanation>"
        }},
        {{
          "name": "Layout, grids & design system",
          "score": <number>,
          "max_score": 6,
          "reasoning": "<explanation>"
        }},
        {{
          "name": "Accessibility",
          "score": <number>,
          "max_score": 3,
          "reasoning": "<explanation>"
        }},
        {{
          "name": "UX copywriting",
          "score": <number>,
          "max_score": 3,
          "reasoning": "<explanation>"
        }},
        {{
          "name": "Microinteractions & feedback",
          "score": <number>,
          "max_score": 3,
          "reasoning": "<explanation>"
        }}
      ]
    }},

    {{
      "phase": "Validation & Iteration",
      "score": <number>,
      "max_score": 15,
      "reasoning": "<detailed explanation>",
      "subsections": [
        {{
          "name": "Usability testing",
          "score": <number>,
          "max_score": 5,
          "reasoning": "<explanation>"
        }},
        {{
          "name": "Feedback incorporation",
          "score": <number>,
          "max_score": 5,
          "reasoning": "<explanation>"
        }},
        {{
          "name": "Metrics & results",
          "score": <number>,
          "max_score": 5,
          "reasoning": "<explanation>"
        }}
      ]
    }},

    {{
      "phase": "Storytelling & UX Copywriting",
      "score": <number>,
      "max_score": 10,
      "reasoning": "<detailed explanation>",
      "subsections": [
        {{
          "name": "Narrative flow",
          "score": <number>,
          "max_score": 3,
          "reasoning": "<explanation>"
        }},
        {{
          "name": "Presentation & visuals",
          "score": <number>,
          "max_score": 3,
          "reasoning": "<explanation>"
        }},
        {{
          "name": "Writing quality",
          "score": <number>,
          "max_score": 4,
          "reasoning": "<explanation>"
        }}
      ]
    }},

    {{
      "phase": "Bonus Points",
      "score": <number>,
      "max_score": 5,
      "reasoning": "<explanation>",
      "subsections": [
        {{
          "name": "Gamification",
          "score": <number>,
          "max_score": 2,
          "reasoning": "<explanation>"
        }},
        {{
          "name": "Innovation",
          "score": <number>,
          "max_score": 2,
          "reasoning": "<explanation>"
        }},
        {{
          "name": "Systems thinking",
          "score": <number>,
          "max_score": 1,
          "reasoning": "<explanation>"
        }}
      ]
    }}
  ],

  "summary": "<2-3 paragraph summary>",

  "ux_keywords": ["<keyword1>", "<keyword2>", "..."],

  "improvements": [
    {{
      "phase": "<phase>",
      "issue": "<issue>",
      "recommendation": "<action>"
    }}
  ],

  "verdict": "<one-line final verdict>"
}}
"""

            # --------------------------------------
            # RUN GEMINI MODEL
            # --------------------------------------

            try:
                print(f"  [DEBUG] Sending to Gemini for analysis: {link}")
                gemini_start = time.perf_counter()
                analysis = analyze_content(prompt, {
                    "scraped_data": scraped_data,
                    "screenshot": screenshot_path
                })
                project_timing['gemini_seconds'] = round(time.perf_counter() - gemini_start, 2)
                print(f"  [DEBUG] Gemini analysis complete for: {link} ({project_timing['gemini_seconds']:.2f}s)")
            except Exception as e:
                print(f"    ❌ Gemini failed: {e}")
                project_timing['error'] = str(e)
                project_timing['status'] = 'failed'
                project_timings.append(project_timing)
                continue

            # --------------------------------------
            # SAVE REPORT
            # --------------------------------------
            save_start = time.perf_counter()
            slug = create_project_slug(link)
            report_path = f"backend/reports/{slug}.json"

            report = {
                "generated_at": datetime.now().isoformat(),
                "url": link,
                "project_name": project_timing.get('project_name', scraped_data.get('title', link.split('/')[-1])),
                "parent_portfolio": parent_url,
                "screenshot": screenshot_path,
                "scraped_data": scraped_data,
                "analysis": analysis  # <-- NEW DIRECT STRUCTURE
            }

            print(f"  [DEBUG] Writing report to: {report_path}")
            with open(report_path, "w", encoding="utf-8") as f:
              json.dump(report, f, indent=2, ensure_ascii=False)
            
            # Print the case study JSON
            print(f"\n{'='*80}")
            print(f"📊 CASE STUDY ANALYSIS JSON [{idx}/{len(project_links)}]")
            print(f"{'='*80}")
            print(json.dumps(report, indent=2, ensure_ascii=False))
            print(f"{'='*80}\n")

            # Upload to GCS
            gcs_path = gcs_project_folder + os.path.basename(report_path)
            gcs_url = upload_file_to_gcs(report_path, gcs_path)
            project_timing['save_upload_seconds'] = round(time.perf_counter() - save_start, 2)
            project_timing['total_seconds'] = round(time.perf_counter() - project_start_time, 2)
            project_timing['status'] = 'success'
            project_timing['report_url'] = gcs_url
            print(f"    ✅ Uploaded project report to GCS: {gcs_url} (Total: {project_timing['total_seconds']:.2f}s)")

            # Save project JSON in DB
            if report_id:
              try:
                save_project_json(report_id, link, report, gcs_url, screenshot_path)
              except Exception as _:
                pass
            
            project_timings.append(project_timing)
            count += 1
            
            # Update status if available
            if update_status and report_id:
                progress = 40 + int((idx / len(project_links)) * 40)  # 40-80% range
                update_status(
                    report_id, 
                    "processing", 
                    progress=progress,
                    message=f"Analyzed {idx}/{len(project_links)} case studies...",
                    result_data={
                        "projects_found": len(project_links),
                        "projects_analyzed": count
                    }
                )

        except Exception as e:
            print(f"    ❌ Error analyzing {link}: {e}")
            project_timing['error'] = str(e)
            project_timing['status'] = 'failed'
            project_timing['total_seconds'] = round(time.perf_counter() - project_start_time, 2)
            project_timings.append(project_timing)
            continue

    print(f"[DEBUG] Finished analyzing all project links. Total successful: {count}")
    return count, project_timings
