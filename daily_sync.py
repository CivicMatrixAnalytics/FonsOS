import os
import json
import time
import datetime
import urllib.parse
import xml.etree.ElementTree as ET
import requests
from dotenv import load_dotenv

# Load local .env credentials
load_dotenv()

from google import genai
from google.genai import types
from google.genai.errors import APIError
from supabase import create_client, Client
from geo_resolver import resolve_constituency

# ---------------------------------------------------------
# Environment & Client Setup
# ---------------------------------------------------------
SUPABASE_URL = os.environ.get("SUPABASE_URL") or "https://yqystwfszetkbhwggzrv.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or "sb_publishable_Z_w1EUQzWNsBV-KQpXMKYg_yRq-anmn"

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.path.join(BASE_DIR, "service_account.json")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

ai_client = genai.Client(
    vertexai=True,
    project="extractos-506408",
    location="us-central1"
)

# ---------------------------------------------------------
# Load Master 234 Assembly Constituencies Reference
# ---------------------------------------------------------
AC_REFERENCE_PATH = os.path.join(BASE_DIR, "tn_234_constituencies.json")
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
    "Chengalpattu": (12.6841, 79.9836),
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

# ---------------------------------------------------------
# COMPREHENSIVE MULTI-OUTLET AGGREGATION NETWORK (MAX COVERAGE)
# ---------------------------------------------------------
def make_rss_url(query, lang="ta"):
    encoded = urllib.parse.quote(query)
    if lang == "en":
        return f"https://news.google.com/rss/search?q={encoded}&hl=en-IN&gl=IN&ceid=IN:en"
    return f"https://news.google.com/rss/search?q={encoded}&hl=ta&gl=IN&ceid=IN:ta"

MULTI_SOURCE_FEEDS = [
    # 1. National English Media (Tamil Nadu Bureau & Ground Events)
    ("The Hindu - Tamil Nadu", make_rss_url("site:thehindu.com Tamil Nadu incident OR protest OR civic OR hospital", "en")),
    ("Times of India - TN", make_rss_url("site:timesofindia.indiatimes.com Tamil Nadu incident OR protest OR civic", "en")),
    ("India Today - TN", make_rss_url("site:indiatoday.in Tamil Nadu protest OR police OR clash OR corruption", "en")),
    ("New Indian Express - TN", make_rss_url("site:newindianexpress.com Tamil Nadu grievance OR accident OR protest", "en")),
    ("Deccan Chronicle - TN", make_rss_url("site:deccanchronicle.com Tamil Nadu road OR water OR rally OR arrest", "en")),
    ("NDTV - Tamil Nadu", make_rss_url("site:ndtv.com Tamil Nadu incident OR protest OR dispute", "en")),
    ("Hindustan Times - TN", make_rss_url("site:hindustantimes.com Tamil Nadu grievance OR protest", "en")),

    # 2. Mainstream Daily Tamil Dailies (District Edition Pulses)
    ("Daily Thanthi", make_rss_url("site:dailythanthi.com தமிழ்நாடு செய்திகள் OR விபத்து OR மறியல்")),
    ("Dinamalar District News", make_rss_url("site:dinamalar.com தமிழ்நாடு மாவட்டம் OR புகார்")),
    ("Dinakaran Local", make_rss_url("site:dinakaran.com தமிழ்நாடு மாவட்டம் OR போராட்டம்")),
    ("Dinamani", make_rss_url("site:dinamani.com தமிழ்நாடு மாவட்டம் OR குற்றச்சாட்டு")),
    ("Hindu Tamil Thisai", make_rss_url("site:hindutamil.in தமிழ்நாடு போராட்டம் OR கோரிக்கை OR அவதி")),

    # 3. Aggressive Political, Investigative & Ground Portals
    ("Nakkheeran Investigative", make_rss_url("site:nakkheeran.in தமிழ்நாடு")),
    ("Junior Vikatan / Vikatan", make_rss_url("site:vikatan.com தமிழ்நாடு அரசு புகார் OR போராட்டம்")),
    ("Oneindia Tamil", make_rss_url("site:tamil.oneindia.com தமிழ்நாடு போராட்டம் OR மறியல்")),
    ("Webdunia Tamil", make_rss_url("site:tamil.webdunia.com தமிழ்நாடு விபத்து OR போராட்டம்")),

    # 4. Regional, Evening Dailies & Southern District Specifics (Chinna Pathirikaigal)
    ("Maalai Malar", make_rss_url("site:maalaimalar.com தமிழ்நாடு போராட்டம் OR விபத்து")),
    ("Malai Murasu", make_rss_url("site:malaimurasu.com தமிழ்நாடு செய்திகள்")),
    ("Thinaboomi (South TN)", make_rss_url("site:thinaboomi.com தமிழ்நாடு OR மதுரை OR நெல்லை")),
    ("Tamil Murasu", make_rss_url("site:tamilmurasu.org தமிழ்நாடு")),
    ("Theekkathir", make_rss_url("site:theekkathir.in தொழிலாளர் OR போராட்டம் OR கோரிக்கை")),
    ("Viduthalai", make_rss_url("site:viduthalai.in தமிழ்நாடு அறிக்கை")),
    ("Makkal Kural", make_rss_url("site:makkalkural.net தமிழ்நாடு")),

    # 5. 24x7 TV News Digital Desks
    ("Puthiyathalaimurai Live", make_rss_url("site:puthiyathalaimurai.com தமிழ்நாடு போராட்டம் OR விபத்து")),
    ("News7 Tamil", make_rss_url("site:news7tamil.live தமிழ்நாடு")),
    ("Polimer News", make_rss_url("site:polimernews.com தமிழ்நாடு செய்திகள்")),
    ("Thanthi TV Digital", make_rss_url("site:thanthitv.com தமிழ்நாடு")),
    ("Sun News Desk", make_rss_url("site:sunnews.in தமிழ்நாடு")),
    ("News18 Tamil Nadu", make_rss_url("site:tamil.news18.com தமிழ்நாடு மாவட்டம்")),
    ("ABP Nadu", make_rss_url("site:tamil.abplive.com தமிழ்நாடு புகார் OR போராட்டம்")),
    ("Samayam Tamil", make_rss_url("site:tamil.samayam.com தமிழ்நாடு செய்தி OR அவதி")),

    # 6. High-Priority Tactical Trigger Searches (Govt lapses & Spot Protests)
    ("DVAC & Anti-Corruption", make_rss_url("தமிழ்நாடு ஊழல் OR DVAC OR லஞ்சம் OR சோதனை")),
    ("Civic Crisis & Road Blocks", make_rss_url("தமிழ்நாடு சாலை மறியல் OR குடிநீர் தட்டுப்பாடு OR கழிவுநீர்")),
    ("Power Shutdown & Farmers Protest", make_rss_url("தமிழ்நாடு மின்தடை போராட்டம் OR விவசாயிகள் கோரிக்கை")),
    ("Government Hospital Complaints", make_rss_url("தமிழ்நாடு அரசு மருத்துவமனை புகார் OR சிகிச்சை குறைபாடு")),
    ("Law & Order Flashpoints", make_rss_url("தமிழ்நாடு துப்பாக்கிச்சூடு OR மோதல் OR கைது கலவரம்"))
]

def fetch_rss_articles():
    articles = []
    seen_links = set()
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

    for source_label, rss_url in MULTI_SOURCE_FEEDS:
        try:
            res = requests.get(rss_url, headers=headers, timeout=12)
            if res.status_code == 200:
                root = ET.fromstring(res.content)
                for item in root.findall(".//item")[:10]:
                    title = item.find("title").text if item.find("title") is not None else ""
                    link = item.find("link").text if item.find("link") is not None else ""
                    outlet = item.find("source").text if item.find("source") is not None else source_label

                    if link and link not in seen_links and title:
                        seen_links.add(link)
                        articles.append({
                            "title": title.strip(),
                            "link": link.strip(),
                            "source": outlet.strip()
                        })
        except Exception as e:
            pass
            
    print(f"Collected {len(articles)} unique raw news items across all Tamil & English media outlets.")
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
You are the Chief Intelligence Analyst for FonsOS, an electoral war-room platform for Tamil Nadu (2026 Scenario: TVK is ruling party, DMK and AIADMK are opposition).
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
            model="gemini-2.5-flash",
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

    unprocessed_articles = [a for a in articles if a["link"] not in existing_urls]
    print(f"{len(unprocessed_articles)} new articles to analyze across 32+ channels.")

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

            title_text = intel.get("title") or orig_item.get("title", "")
            summary_text = intel.get("summary") or orig_item.get("title", "")
            full_text = f"{title_text} {summary_text}".strip()

            # PRIMARY STEP: Dynamic GeoHierarchyResolver (Zero Hardcoding)
            geo_res = resolve_constituency(district=district, raw_text=full_text)
            
            if geo_res and geo_res.get("constituency"):
                ac_name = geo_res["constituency"]
                print(f"   [GeoResolver Dynamic Match] AC: '{ac_name}' via status '{geo_res.get('status')}'")
            else:
                ac_name = intel.get("constituency")

            ac_num = intel.get("ac_number")

            if ac_name and master_acs:
                ac_name_clean = ac_name.strip().lower()
                match = next(
                    (ac for ac in master_acs if ac.get("name", "").strip().lower() in [ac_name_clean, ac_name_clean.replace(" ", "")]),
                    None
                )
                if not match and ac_name_clean in ["villupuram", "viluppuram"]:
                    match = next((ac for ac in master_acs if ac.get("name", "").strip().lower() in ["viluppuram", "villupuram"]), None)

                if match:
                    ac_num = match.get("ac_number")

            payload = {
                "title": title_text,
                "summary": summary_text,
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
                print(f"-> [SUCCESS] Ingested: {payload['title'][:40]} | [{payload['political_sentiment']}] | AC: {payload['ac_number'] or 'N/A'} ({payload['constituency'] or 'Unassigned'})")
                inserted_count += 1
            except Exception as e:
                print(f"-> [ERROR] Supabase insert notice: {e}")

        time.sleep(3)

    print(f"\n=======================================================")
    print(f"Sync complete! Successfully ingested {inserted_count} new verified incidents.")
    print(f"=======================================================")

if __name__ == "__main__":
    run_daily_sync()