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
from urllib.parse import urlparse


def create_project_slug(url):
    """Create a safe filename from URL."""
    parsed = urlparse(url)
    slug = parsed.netloc.replace(".", "_") + parsed.path.replace("/", "_")
    return slug[:150]


def analyze_projects(project_links, parent_url):
    """
    Analyzes each project page using:
      - HTML scraping
      - Screenshot capture
      - Gemini case-study scoring prompt
    """
    count = 0
    print(f"[DEBUG] Starting analysis of {len(project_links)} project links for parent: {parent_url}")

    # Use a unique folder for this analysis (parent_url slug + timestamp)
    from datetime import datetime
    parent_slug = create_project_slug(parent_url)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    gcs_folder = f"{parent_slug}_{timestamp}/projects/"

    for idx, link in enumerate(project_links, 1):
        print(f"\n  [DEBUG] [{idx}/{len(project_links)}] Analyzing project: {link}")
        try:
            print(f"  [DEBUG] Scraping project page: {link}")
            scraped_data = scrape_project_page(link)
            print(f"  [DEBUG] Scraping complete for: {link}")

            print(f"  [DEBUG] Capturing screenshot for: {link}")
            screenshot_path = capture_screenshot(link)
            print(f"  [DEBUG] Screenshot saved at: {screenshot_path}")

            print(f"  [DEBUG] Preparing Gemini prompt for: {link}")
            # --------------------------------------
            # GEMINI CASE-STUDY PROMPT
            # --------------------------------------
            prompt = f"""
You are an expert UX case study reviewer with deep knowledge of design thinking, user research, and best practices in product design.

Analyze the provided case study page according to this comprehensive scoring model:

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

A screenshot of the case study page is also provided for visual assessment.

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
                analysis = analyze_content(prompt, {
                    "scraped_data": scraped_data,
                    "screenshot": screenshot_path
                })
                print(f"  [DEBUG] Gemini analysis complete for: {link}")
            except Exception as e:
                print(f"    ❌ Gemini failed: {e}")
                continue

            # --------------------------------------
            # SAVE REPORT
            # --------------------------------------

            slug = create_project_slug(link)
            report_path = f"backend/reports/{slug}.json"

            report = {
                "generated_at": datetime.now().isoformat(),
                "url": link,
                "parent_portfolio": parent_url,
                "screenshot": screenshot_path,
                "scraped_data": scraped_data,
                "analysis": analysis  # <-- NEW DIRECT STRUCTURE
            }

            print(f"  [DEBUG] Writing report to: {report_path}")
            with open(report_path, "w", encoding="utf-8") as f:
              json.dump(report, f, indent=2, ensure_ascii=False)

            # Upload to GCS
            gcs_path = gcs_folder + os.path.basename(report_path)
            gcs_url = upload_file_to_gcs(report_path, gcs_path)
            print(f"    ✅ Uploaded project report to GCS: {gcs_url}")
            count += 1

        except Exception as e:
            print(f"    ❌ Error analyzing {link}: {e}")
            continue

    print(f"[DEBUG] Finished analyzing all project links. Total successful: {count}")
    return count
