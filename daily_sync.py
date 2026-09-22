import os
import json
import time
import datetime
import urllib.parse
import xml.etree.ElementTree as ET
import requests
from google import genai
from google.genai import types
from google.genai.errors import APIError
from supabase import create_client, Client

# ---------------------------------------------------------
# Environment & Client Setup
# ---------------------------------------------------------
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.")

if not GEMINI_API_KEY:
    raise ValueError("Missing GEMINI_API_KEY in environment variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
ai_client = genai.Client(api_key=GEMINI_API_KEY)

# ---------------------------------------------------------
# Load Master 234 Assembly Constituencies Reference
# ---------------------------------------------------------
AC_REFERENCE_PATH = "tn_234_constituencies.json"
master_acs = []
if os.path.exists(AC_REFERENCE_PATH):
    try:
        with open(AC_REFERENCE_PATH, "r", encoding="utf-8") as f:
            master_acs = json.load(f)
        print(f"Loaded {len(master_acs)} ACs from {AC_REFERENCE_PATH}")
    except Exception as e:
        print(f"Notice loading AC registry: {e}")

DEFAULT_TN_LAT = 11.1271
DEFAULT_TN_LNG = 78.6569

DISTRICT_COORDS = {
    "Ariyalur": (11.1401, 79.0786),
    "Chennai": (13.0827, 80.2707),
    "Coimbatore": (11.0168, 76.9558),
    "Cuddalore": (11.7480, 79.7714),
    "Dharmapuri": (12.1211, 78.1582),
    "Dindigul": (10.3673, 77.9803),
    "Erode": (11.3410, 77.7172),
    "Kallakurichi": (11.7384, 78.9639),
    "Kanchipuram": (12.8342, 79.7036),
    "Kanyakumari": (8.0883, 77.5385),
    "Karur": (10.9601, 78.0766),
    "Krishnagiri": (12.5186, 78.2137),
    "Madurai": (9.9252, 78.1198),
    "Mayiladuthurai": (11.1075, 79.6524),
    "Nagapattinam": (10.7672, 79.8449),
    "Namakkal": (9.2189, 78.1674),
    "Nilgiris": (11.4102, 76.6950),
    "Perambalur": (11.2342, 78.8820),
    "Pudukkottai": (10.3797, 78.8208),
    "Ramanathapuram": (9.3639, 78.8395),
    "Ranipet": (12.9224, 79.3326),
    "Salem": (11.6643, 78.1460),
    "Sivaganga": (9.8433, 78.4809),
    "Tenkasi": (8.9594, 77.3150),
    "Thanjavur": (10.7870, 79.1378),
    "Theni": (10.0104, 77.4768),
    "Thoothukudi": (8.7642, 78.1348),
    "Tiruchirappalli": (10.7905, 78.7047),
    "Tirunelveli": (8.7139, 77.7567),
    "Tirupathur": (12.4950, 78.5678),
    "Tiruppur": (11.1085, 77.3411),
    "Tiruvallur": (13.1432, 79.9079),
    "Tiruvannamalai": (12.2253, 79.0747),
    "Tiruvarur": (10.7725, 79.6365),
    "Vellore": (12.9165, 79.1325),
    "Viluppuram": (11.9401, 79.4861),
    "Virudhunagar": (9.5872, 77.9514),
}

RSS_QUERIES = [
    "தமிழ்நாடு போராட்டம்",
    "தமிழ்நாடு விபத்து சாலை",
    "தமிழ்நாடு குடிநீர் தட்டுப்பாடு",
    "தமிழ்நாடு அரசு மருத்துவமனை புகார்",
    "தமிழ்நாடு மின்தடை போராட்டம்",
    "Tamil Nadu law and order incident"
]

def fetch_rss_articles():
    articles = []
    seen_links = set()

    for q in RSS_QUERIES:
        encoded_q = urllib.parse.quote(q)
        rss_url = f"https://news.google.com/rss/search?q={encoded_q}&hl=ta&gl=IN&ceid=IN:ta"
        try:
            res = requests.get(rss_url, timeout=12)
            if res.status_code == 200:
                root = ET.fromstring(res.content)
                for item in root.findall(".//item")[:10]:
                    title = item.find("title").text if item.find("title") is not None else ""
                    link = item.find("link").text if item.find("link") is not None else ""
                    source = item.find("source").text if item.find("source") is not None else "Public Media"

                    if link and link not in seen_links and title:
                        seen_links.add(link)
                        articles.append({
                            "title": title,
                            "link": link,
                            "source": source
                        })
        except Exception as e:
            print(f"Notice fetching RSS for query '{q}': {e}")
            
    print(f"Collected {len(articles)} unique raw news items for intelligence processing.")
    return articles

# ---------------------------------------------------------
# Batch AI Processing (5 articles per Gemini call)
# ---------------------------------------------------------
def analyze_article_batch_with_gemini(batch_articles):
    formatted_items = []
    for idx, a in enumerate(batch_articles):
        formatted_items.append(f"[{idx}] Title: {a['title']} | Source: {a['source']}")
    
    batch_text = "\n".join(formatted_items)

    prompt = f"""
You are the Chief Intelligence Analyst for FonsOS, an electoral war-room platform for Tamil Nadu.
Analyze the following batch of news items and extract structured tactical intelligence for each item.

News Items:
{batch_text}

Return ONLY a JSON ARRAY containing one object per valid civic/political incident in this batch.
Schema for each item in the array:
{{
  "index": integer matching the item number [0, 1, 2, ...],
  "is_relevant_incident": true/false (true if civic issue, law & order, public grievance, infra, protests in TN),
  "title": "Clear concise headline in English or Tamil",
  "summary": "1-2 sentence contextual factual summary of the incident",
  "district": "Valid Tamil Nadu District name (e.g. Ariyalur, Madurai, Erode, Chennai, or 'Tamil Nadu')",
  "constituency": "Exact Assembly Constituency name if identifiable, else null",
  "ac_number": Integer AC number (1 to 234) if identifiable, else null,
  "category": "One of: Civic Grievance, Law & Order, Infrastructure, Public Health, Transport & Roads, Agriculture, Education, Routine Civic",
  "severity": "High" | "Medium" | "Low",
  "is_actionable": true/false,
  "strategic_tag": "Short tag e.g. 'Road Infrastructure Collapse', 'Water Deficit', 'Power Cut Protest'",
  "attack_angle": "1-2 sharp lines in Tamil for Opposition war-room charging administrative lapse",
  "defense_angle": "1-2 sharp lines in Tamil for Ruling party countering allegations or outlining official action taken",
  "political_sentiment": "anti_incumbency" | "ruling_defense" | "neutral"
}}
"""

    try:
        response = ai_client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2
            )
        )
        data = json.loads(response.text)
        if isinstance(data, list):
            return data
        elif isinstance(data, dict) and "items" in data:
            return data["items"]
        return [data]
    except Exception as e:
        err_str = str(e)
        if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
            print("\n[NOTICE] Daily Gemini API rate quota reached for today.")
            return "QUOTA_EXHAUSTED"
        print(f"Batch AI processing notice: {e}")
        return []

# ---------------------------------------------------------
# Main Execution Pipeline
# ---------------------------------------------------------
def run_daily_sync():
    print(f"=== Starting FonsOS Automated Daily Ingestion Engine ===")
    articles = fetch_rss_articles()
    
    existing_urls = set()
    try:
        res = supabase.from_("incidents").select("proof_url").execute()
        if res.data:
            existing_urls = {row["proof_url"] for row in res.data if row.get("proof_url")}
        print(f"Loaded {len(existing_urls)} existing incident URLs from Supabase.")
    except Exception as e:
        print(f"Notice querying existing incidents: {e}")

    # Filter out already ingested articles
    unprocessed_articles = [a for a in articles if a["link"] not in existing_urls]
    print(f"{len(unprocessed_articles)} new articles to analyze.")

    inserted_count = 0
    today_str = datetime.date.today().isoformat()
    BATCH_SIZE = 5

    for i in range(0, len(unprocessed_articles), BATCH_SIZE):
        batch = unprocessed_articles[i:i + BATCH_SIZE]
        print(f"\nProcessing batch {i//BATCH_SIZE + 1} ({len(batch)} articles)...")
        
        batch_results = analyze_article_batch_with_gemini(batch)

        if batch_results == "QUOTA_EXHAUSTED":
            print("Stopping sync safely due to API daily quota. All prior records are saved in Supabase.")
            break

        for intel in batch_results:
            if not intel or not intel.get("is_relevant_incident"):
                continue

            idx = intel.get("index", 0)
            orig_item = batch[idx] if idx < len(batch) else batch[0]

            district = intel.get("district") or "Tamil Nadu"
            coords = DISTRICT_COORDS.get(district, (DEFAULT_TN_LAT, DEFAULT_TN_LNG))

            ac_name = intel.get("constituency")
            ac_num = intel.get("ac_number")
            if ac_name and not ac_num and master_acs:
                match = next((ac for ac in master_acs if ac["name"].lower() == ac_name.lower()), None)
                if match:
                    ac_num = match["ac_number"]

            payload = {
                "title": intel.get("title") or orig_item["title"],
                "summary": intel.get("summary") or orig_item["title"],
                "district": district,
                "latitude": coords[0],
                "longitude": coords[1],
                "category": intel.get("category", "Civic Grievance"),
                "severity": intel.get("severity", "Medium"),
                "source_outlet": orig_item["source"],
                "proof_url": orig_item["link"],
                "incident_date": today_str,
                "is_actionable": bool(intel.get("is_actionable", True)),
                "strategic_tag": intel.get("strategic_tag", "Local Issue"),
                "attack_angle": intel.get("attack_angle", ""),
                "defense_angle": intel.get("defense_angle", ""),
                "constituency": ac_name,
                "ac_number": ac_num,
                "political_sentiment": intel.get("political_sentiment", "anti_incumbency")
            }

            try:
                supabase.from_("incidents").insert(payload).execute()
                print(f"-> [SUCCESS] Ingested: {payload['title'][:40]} | [{payload['political_sentiment']}] | AC: {payload['ac_number'] or 'N/A'}")
                inserted_count += 1
            except Exception as e:
                print(f"-> [ERROR] Supabase insert notice: {e}")

        # Pacing between batches to prevent 503 spikes
        time.sleep(3)

    print(f"\n=======================================================")
    print(f"Sync complete! Successfully ingested {inserted_count} new verified incidents.")
    print(f"=======================================================")

if __name__ == "__main__":
    run_daily_sync()