import os
import re
import json
import feedparser
from datetime import datetime
from supabase import create_client, Client
from google import genai

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing Supabase environment variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Initialize GenAI Client
ai_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

RSS_FEEDS = [
    {"outlet": "The Hindu TN", "url": "https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss"},
    {"outlet": "Times of India TN", "url": "https://timesofindia.indiatimes.com/rssfeeds/29498261.cms"},
    {"outlet": "DT Next", "url": "https://www.dtnext.in/feed/"},
]

TN_DISTRICT_COORDS = {
    "Ariyalur": [11.1401, 79.0786],
    "Chengalpattu": [12.6939, 79.9757],
    "Chennai": [13.0827, 80.2707],
    "Coimbatore": [11.0168, 76.9558],
    "Cuddalore": [11.7480, 79.7714],
    "Dharmapuri": [12.1211, 78.1582],
    "Dindigul": [10.3673, 77.9803],
    "Erode": [11.3410, 77.7172],
    "Kallakurichi": [11.7384, 78.9639],
    "Kancheepuram": [12.8342, 79.7036],
    "Kanyakumari": [8.0883, 77.5385],
    "Karur": [10.9601, 78.0766],
    "Krishnagiri": [12.5186, 78.2137],
    "Madurai": [9.9252, 78.1198],
    "Mayiladuthurai": [11.1075, 79.6524],
    "Nagapattinam": [10.7672, 79.8449],
    "Namakkal": [11.2189, 78.1674],
    "Nilgiris": [11.4102, 76.6950],
    "Perambalur": [11.2333, 78.8824],
    "Pudukkottai": [10.3797, 78.8208],
    "Ramanathapuram": [9.3639, 78.8395],
    "Ranipet": [12.9274, 79.3330],
    "Salem": [11.6643, 78.1460],
    "Sivaganga": [9.8433, 78.4809],
    "Tenkasi": [8.9594, 77.3150],
    "Thanjavur": [10.7870, 79.1378],
    "Theni": [10.0104, 77.4768],
    "Thoothukudi": [8.7642, 78.1348],
    "Tiruchirappalli": [10.7905, 78.7047],
    "Tirunelveli": [8.7139, 77.7567],
    "Tirupathur": [12.4926, 78.5678],
    "Tiruppur": [11.1085, 77.3411],
    "Tiruvallur": [13.1432, 79.9079],
    "Tiruvannamalai": [12.2253, 79.0747],
    "Tiruvarur": [10.7725, 79.6365],
    "Vellore": [12.9165, 79.1325],
    "Viluppuram": [11.9401, 79.4861],
    "Virudhunagar": [9.5872, 77.9514],
    "Tamil Nadu (General)": [11.1271, 78.6569]
}

def detect_district(text):
    for district in TN_DISTRICT_COORDS.keys():
        if district == "Tamil Nadu (General)":
            continue
        if re.search(r'\b' + re.escape(district) + r'\b', text, re.IGNORECASE):
            return district
    return "Tamil Nadu (General)"

def categorize_incident(text):
    text_lower = text.lower()
    if any(k in text_lower for k in ["bribe", "scam", "corruption", "dvac", "cbi raid", "extortion"]):
        return "Corruption"
    elif any(k in text_lower for k in ["murder", "assault", "clash", "theft", "gang", "crime", "custodial", "arrested"]):
        return "Law & Order"
    elif any(k in text_lower for k in ["road", "drainage", "bridge", "water supply", "drinking water", "power cut", "pothole"]):
        return "Infrastructure"
    elif any(k in text_lower for k in ["scheme", "pension", "ration", "subsidy", "welfare", "relief"]):
        return "Welfare & Schemes"
    elif any(k in text_lower for k in ["hospital", "doctor", "pollution", "dengue", "fever", "lake contamination"]):
        return "Health & Environment"
    elif any(k in text_lower for k in ["school", "college", "exam", "teachers", "job", "recruitment", "protest"]):
        return "Education & Jobs"
    return "Governance"

def analyze_strategic_intelligence(title, summary):
    if not ai_client:
        return {
            "is_actionable": False,
            "strategic_tag": "Routine Ground Feed",
            "attack_angle": None,
            "defense_angle": None
        }

    prompt = f"""
You are a political strategic intelligence analyst for Tamil Nadu (2026 setup: TVK is ruling party, DMK and AIADMK are main opposition).
Analyze this incident:
Headline: {title}
Summary: {summary}

Rule 1: Generic routine natural events like simple rainfall, seasonal weather, festival, routine accidents are NOT actionable (is_actionable = false).
Rule 2: If the event reflects administrative failure, delayed disaster relief, waterlogging negligence, corruption, power crisis, police inaction, or public protest against administration, it IS actionable (is_actionable = true).

Return ONLY valid JSON:
{{
  "is_actionable": true or false,
  "strategic_tag": "Short 2-4 word tag (e.g. Relief Mismanagement, Bribery Sting, Civic Gridlock, Routine Weather)",
  "attack_angle": "1-2 lines on how opposition (DMK/AIADMK) can hold administration accountable, or null if false",
  "defense_angle": "1-2 lines on how ruling party (TVK) can address or counter this grievance, or null if false"
}}
"""
    try:
        response = ai_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text.strip())
    except Exception as e:
        print(f"Gemini analysis fallback: {e}")
        return {
            "is_actionable": False,
            "strategic_tag": "Field Alert",
            "attack_angle": None,
            "defense_angle": None
        }

def process_feed(feed_info):
    feed = feedparser.parse(feed_info["url"])
    print(f"Ingesting from: {feed_info['outlet']} (Found {len(feed.entries)} entries)")

    for entry in feed.entries[:15]:
        title = entry.get("title", "")
        link = entry.get("link", "")
        summary = entry.get("summary", title)
        combined_text = f"{title} {summary}"

        district = detect_district(combined_text)
        coords = TN_DISTRICT_COORDS.get(district, TN_DISTRICT_COORDS["Tamil Nadu (General)"])
        category = categorize_incident(combined_text)

        ai_data = analyze_strategic_intelligence(title, summary)

        incident_payload = {
            "title": title,
            "summary": summary[:300] if summary else title,
            "district": district,
            "latitude": coords[0],
            "longitude": coords[1],
            "category": category,
            "severity": "High" if category in ["Corruption", "Law & Order"] else "Medium",
            "source_outlet": feed_info["outlet"],
            "proof_url": link,
            "incident_date": datetime.today().strftime('%Y-%m-%d'),
            "is_actionable": ai_data.get("is_actionable", False),
            "strategic_tag": ai_data.get("strategic_tag", "Ground Report"),
            "attack_angle": ai_data.get("attack_angle"),
            "defense_angle": ai_data.get("defense_angle")
        }

        existing = supabase.from_("incidents").select("id").eq("title", title).execute()
        if not existing.data:
            supabase.from_("incidents").insert(incident_payload).execute()
            print(f"-> Inserted: [{category}] {title[:40]}... (Actionable: {ai_data.get('is_actionable')})")

def main():
    print("Starting Automated TN Intelligence Sync with Strategic AI Enrichment...")
    for feed in RSS_FEEDS:
        try:
            process_feed(feed)
        except Exception as e:
            print(f"Error reading feed {feed['outlet']}: {e}")
    print("Sync complete.")

if __name__ == "__main__":
    main()