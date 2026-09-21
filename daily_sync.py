import datetime
import os
import time
import urllib.parse
from dateutil import parser as date_parser
import feedparser
from supabase import create_client, Client

# Environment variables-ல் இருந்து எடுக்கப்படும் (Local-ல் fallback)
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://yqystwfszetkbhwggzrv.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

TN_DISTRICTS = {
    "Chennai": {"lat": 13.0827, "lng": 80.2707, "keys": ["சென்னை", "chennai", "madras"]},
    "Coimbatore": {"lat": 11.0168, "lng": 76.9558, "keys": ["கோவை", "கோயம்புத்தூர்", "coimbatore"]},
    "Madurai": {"lat": 9.9252, "lng": 78.1198, "keys": ["மதுரை", "madurai"]},
    "Salem": {"lat": 11.6643, "lng": 78.1460, "keys": ["சேலம்", "salem"]},
    "Tiruchirappalli": {"lat": 10.7905, "lng": 78.7047, "keys": ["திருச்சி", "trichy", "tiruchirappalli"]},
    "Tirunelveli": {"lat": 8.7139, "lng": 77.7567, "keys": ["திருநெல்வேலி", "நெல்லை", "tirunelveli"]},
    "Kallakurichi": {"lat": 11.7383, "lng": 78.9639, "keys": ["கள்ளக்குறிச்சி", "kallakurichi"]},
    "Erode": {"lat": 11.3410, "lng": 77.7172, "keys": ["ஈரோடு", "erode"]},
    "Vellore": {"lat": 12.9165, "lng": 79.1325, "keys": ["வேலூர்", "vellore"]},
    "Tiruppur": {"lat": 11.1085, "lng": 77.3411, "keys": ["திருப்பூர்", "tiruppur"]},
    "Virudhunagar": {"lat": 9.5680, "lng": 77.9624, "keys": ["விருதுநகர்", "அருப்புக்கோட்டை", "virudhunagar", "aruppukkottai"]}
}

CATEGORY_MAP = {
    "Corruption": ["ஊழல்", "கைது", "லஞ்சம்", "dvac", "முறைகேடு", "raid", "முறைகேடுகள்"],
    "Law & Order": ["கொலை", "தாக்குதல்", "போராட்டம்", "கலவரம்", "arrest", "துப்பாக்கி"],
    "Infrastructure": ["குடிநீர்", "சாலை", "மின்தடை", "சாக்கடை", "பாலம்", "வெள்ளம்"],
    "Governance": ["அரசாணை", "திட்டம்", "விமர்சனம்", "அறிக்கை", "கோரிக்கை"]
}

def detect_district(text):
    t = text.lower()
    for dist, data in TN_DISTRICTS.items():
        for k in data["keys"]:
            if k in t:
                return dist, data["lat"], data["lng"]
    return "Tamil Nadu (General)", 11.1271, 78.6569

def detect_category(text):
    t = text.lower()
    for cat, words in CATEGORY_MAP.items():
        for w in words:
            if w in t:
                return cat
    return "Governance"

def run_daily_sync():
    # கடந்த 2 நாட்களுக்கான செய்திகளை எடுத்து unique proof_url அடிப்படையில் சேர்க்கும்
    start_date = datetime.date.today() - datetime.timedelta(days=2)
    print(f"[*] Daily Sync Triggered: Range [{start_date} to {datetime.date.today()}]")

    search_queries = [
        "தமிழ்நாடு ஊழல்",
        "தமிழ்நாடு கைது",
        "DVAC raid தமிழ்நாடு",
        "சட்டம் ஒழுங்கு தமிழ்நாடு",
        "அரசு மருத்துவமனை தமிழ்நாடு",
        "சாலை மறியல் போராட்டம் தமிழ்நாடு"
    ]

    total_synced = 0
    for q in search_queries:
        query_str = f"{q} after:{start_date.strftime('%Y-%m-%d')}"
        encoded = urllib.parse.quote(query_str)
        rss_url = f"https://news.google.com/rss/search?q={encoded}&hl=ta&gl=IN&ceid=IN:ta"

        feed = feedparser.parse(rss_url)
        batch = []

        for item in feed.entries:
            title = getattr(item, "title", "").strip()
            link = getattr(item, "link", "")
            pub_raw = getattr(item, "published", "")

            try:
                pub_dt = date_parser.parse(pub_raw).date()
                if pub_dt < start_date:
                    continue
                inc_date = pub_dt.strftime("%Y-%m-%d")
            except Exception:
                inc_date = datetime.date.today().strftime("%Y-%m-%d")

            dist, lat, lng = detect_district(title)
            cat = detect_category(title)
            source = getattr(item, "source", {}).get("title", "Tamil News")

            batch.append({
                "title": title,
                "summary": title,
                "district": dist,
                "latitude": lat,
                "longitude": lng,
                "category": cat,
                "severity": "High" if cat in ["Corruption", "Law & Order"] else "Medium",
                "source_outlet": source,
                "proof_url": link,
                "incident_date": inc_date,
                "status": "approved"
            })

        if batch:
            try:
                supabase.table("incidents").upsert(batch, on_conflict="proof_url").execute()
                total_synced += len(batch)
                print(f"[✓] Synced {len(batch)} records for query: '{q}'")
            except Exception as e:
                print(f"[!] Sync error: {e}")
        time.sleep(1)

    print(f"[★] Daily Sync Completed. Processed: {total_synced} records.")

if __name__ == "__main__":
    run_daily_sync()