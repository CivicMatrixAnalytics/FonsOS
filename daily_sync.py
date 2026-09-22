import os
import re
import json
import time
import feedparser
from datetime import datetime
from supabase import create_client, Client
from google import genai
from google.genai import types

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing Supabase credentials.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
ai_client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

RSS_FEEDS = [
    {"outlet": "The Hindu TN", "url": "https://www.thehindu.com/news/national/tamil-nadu/feeder/default.rss"},
    {"outlet": "Times of India TN", "url": "https://timesofindia.indiatimes.com/rssfeeds/29498261.cms"},
    {"outlet": "DT Next", "url": "https://www.dtnext.in/feed/"},
]

TN_DISTRICT_COORDS = {
    "Ariyalur": [11.1401, 79.0786], "Chengalpattu": [12.6939, 79.9757], "Chennai": [13.0827, 80.2707],
    "Coimbatore": [11.0168, 76.9558], "Cuddalore": [11.7480, 79.7714], "Dharmapuri": [12.1211, 78.1582],
    "Dindigul": [10.3673, 77.9803], "Erode": [11.3410, 77.7172], "Kallakurichi": [11.7384, 78.9639],
    "Kancheepuram": [12.8342, 79.7036], "Kanyakumari": [8.0883, 77.5385], "Karur": [10.9601, 78.0766],
    "Krishnagiri": [12.5186, 78.2137], "Madurai": [9.9252, 78.1198], "Mayiladuthurai": [11.1075, 79.6524],
    "Nagapattinam": [10.7672, 79.8449], "Namakkal": [11.2189, 78.1674], "Nilgiris": [11.4102, 76.6950],
    "Perambalur": [11.2333, 78.8824], "Pudukkottai": [10.3797, 78.8208], "Ramanathapuram": [9.3639, 78.8395],
    "Ranipet": [12.9274, 79.3330], "Salem": [11.6643, 78.1460], "Sivaganga": [9.8433, 78.4809],
    "Tenkasi": [8.9594, 77.3150], "Thanjavur": [10.7870, 79.1378], "Theni": [10.0104, 77.4768],
    "Thoothukudi": [8.7642, 78.1348], "Tiruchirappalli": [10.7905, 78.7047], "Tirunelveli": [8.7139, 77.7567],
    "Tirupathur": [12.4926, 78.5678], "Tiruppur": [11.1085, 77.3411], "Tiruvallur": [13.1432, 79.9079],
    "Tiruvannamalai": [12.2253, 79.0747], "Tiruvarur": [10.7725, 79.6365], "Vellore": [12.9165, 79.1325],
    "Viluppuram": [11.9401, 79.4861], "Virudhunagar": [9.5872, 77.9514], "Tamil Nadu (General)": [11.1271, 78.6569]
}

# Load master 234 constituencies
TN_AC_LIST = []
if os.path.exists("tn_234_constituencies.json"):
    with open("tn_234_constituencies.json", "r", encoding="utf-8") as f:
        TN_AC_LIST = json.load(f)

def fast_regex_ac(text):
    text_lower = text.lower()
    for ac in TN_AC_LIST:
        for alias in ac.get("aliases", []):
            pattern = r'\b' + re.escape(alias.lower()) + r'\b'
            if re.search(pattern, text_lower) or alias.lower() in text_lower:
                return {
                    "district": ac["district"],
                    "constituency": ac["name"],
                    "ac_number": ac["ac_number"]
                }
    return None

def detect_district_fallback(text):
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
    elif any(k in text_lower for k in ["murder", "assault", "clash", "theft", "gang", "crime", "custodial", "arrested", "கொலை"]):
        return "Law & Order"
    elif any(k in text_lower for k in ["road", "drainage", "bridge", "water supply", "drinking water", "power cut", "pothole"]):
        return "Infrastructure"
    elif any(k in text_lower for k in ["scheme", "pension", "ration", "subsidy", "welfare", "relief"]):
        return "Welfare & Schemes"
    elif any(k in text_lower for k in ["hospital", "doctor", "pollution", "dengue", "fever", "மருத்துவமனை"]):
        return "Health & Environment"
    elif any(k in text_lower for k in ["school", "college", "exam", "teachers", "job", "recruitment", "protest"]):
        return "Education & Jobs"
    return "Governance"

def analyze_intelligence_with_location(title, summary, category, regex_location):
    if not ai_client:
        return {
            "is_actionable": False,
            "strategic_tag": "Routine Ground Feed",
            "attack_angle": None,
            "defense_angle": None,
            "district": regex_location["district"] if regex_location else detect_district_fallback(f"{title} {summary}"),
            "constituency": regex_location["constituency"] if regex_location else None,
            "ac_number": regex_location["ac_number"] if regex_location else None
        }

    # If regex already identified location, pass it in; otherwise instruct AI to resolve town/taluk to AC
    loc_instruction = ""
    if regex_location:
        loc_instruction = f"""
Location already matched: District='{regex_location['district']}', Constituency='{regex_location['constituency']}', AC Number={regex_location['ac_number']}. Keep these intact.
"""
    else:
        loc_instruction = """
You MUST detect the specific Tamil Nadu Location:
- If any village, town, taluk, ward, or city is mentioned anywhere in the Tamil or English text (e.g. Guduvanchery, Sedapatti, Kovilpatti, Guindy, Singanallur, Ooty, etc.):
  Identify the exact Tamil Nadu District, statutory Assembly Constituency Name, and statutory AC Number (1-234).
- If it is a purely state-wide generic policy or general weather update with no specific locality, return constituency=null, ac_number=null, and district='Tamil Nadu (General)'.
"""

    prompt = f"""
You are an expert Political Intelligence and GIS Analyst for Tamil Nadu.
Analyze this incident:
Headline: {title}
Summary: {summary}
Category: {category}

{loc_instruction}

Tactical Rules:
- Routine generic events are not actionable (is_actionable = false).
- Clear public grievances, governance lapses, corruption, civic issues, police inaction are actionable (is_actionable = true).
- If actionable, provide a targeted Tamil attack angle and constructive defense rebuttal.

Return ONLY valid JSON:
{{
  "district": "Tamil Nadu District name (e.g. Madurai, Salem, Chennai)",
  "constituency": "Exact AC Name or null",
  "ac_number": integer AC number (1 to 234) or null,
  "is_actionable": true or false,
  "strategic_tag": "Short 2-4 word tag",
  "attack_angle": "Direct sharp charge in Tamil or null",
  "defense_angle": "Constructive counter in Tamil or null"
}}
"""
    models_to_try = ["gemini-3.5-flash", "gemini-3.5-flash-lite"]
    for model_name in models_to_try:
        for attempt in range(2):
            try:
                response = ai_client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json"
                    )
                )
                parsed = json.loads(response.text.strip())
                # Ensure fallback integrity
                if regex_location:
                    parsed["district"] = regex_location["district"]
                    parsed["constituency"] = regex_location["constituency"]
                    parsed["ac_number"] = regex_location["ac_number"]
                return parsed
            except Exception as e:
                err = str(e)
                if "503" in err or "UNAVAILABLE" in err:
                    time.sleep(3)
                    continue
                break

    return {
        "district": regex_location["district"] if regex_location else detect_district_fallback(f"{title} {summary}"),
        "constituency": regex_location["constituency"] if regex_location else None,
        "ac_number": regex_location["ac_number"] if regex_location else None,
        "is_actionable": False,
        "strategic_tag": "Field Alert",
        "attack_angle": None,
        "defense_angle": None
    }

def process_feed(feed_info):
    feed = feedparser.parse(feed_info["url"])
    print(f"\nIngesting outlet: {feed_info['outlet']} (Found {len(feed.entries)} entries)")

    for entry in feed.entries[:12]:
        title = entry.get("title", "").strip()
        link = entry.get("link", "").strip()
        summary = entry.get("summary", title).strip()
        combined_text = f"{title} {summary}"

        if not title:
            continue

        existing = supabase.from_("incidents").select("id").eq("title", title).execute()
        if existing.data:
            continue

        # Fast Regex Check
        regex_loc = fast_regex_ac(combined_text)

        # AI Tactical & Location Resolution
        ai_data = analyze_intelligence_with_location(title, summary, categorize_incident(combined_text), regex_loc)

        district = ai_data.get("district") or "Tamil Nadu (General)"
        coords = TN_DISTRICT_COORDS.get(district, TN_DISTRICT_COORDS["Tamil Nadu (General)"])
        category = categorize_incident(combined_text)

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
            "defense_angle": ai_data.get("defense_angle"),
            "constituency": ai_data.get("constituency"),
            "ac_number": ai_data.get("ac_number")
        }

        supabase.from_("incidents").insert(incident_payload).execute()
        print(f"-> Inserted: [{category}] AC {ai_data.get('ac_number')} ({ai_data.get('constituency')}) | {title[:35]}...")
        time.sleep(3)

def main():
    print("Starting Automated TN Intelligence Sync (with Hybrid AI Location Resolver)...")
    for feed in RSS_FEEDS:
        try:
            process_feed(feed)
        except Exception as e:
            print(f"Feed error ({feed['outlet']}): {e}")
    print("\nSync completed successfully.")

if __name__ == "__main__":
    main()