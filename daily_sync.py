import datetime
import os
import time
import urllib.parse
from dateutil import parser as date_parser
import feedparser
from supabase import create_client, Client

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://yqystwfszetkbhwggzrv.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

TN_DISTRICTS = {
    "Ariyalur": {"lat": 11.1401, "lng": 79.0786, "keys": ["அரியலூர்", "ariyalur", "ஜெயங்கொண்டம்"]},
    "Chengalpattu": {"lat": 12.6939, "lng": 79.9757, "keys": ["செங்கல்பட்டு", "chengalpattu", "தாம்பரம்", "பல்லாவரம்", "மறைமலைநகர்"]},
    "Chennai": {"lat": 13.0827, "lng": 80.2707, "keys": ["சென்னை", "chennai", "madras", "அடையாறு", "அண்ணாநகர்", "மயிலாப்பூர்", "ராயப்பேட்டை", "தி.நகர்"]},
    "Coimbatore": {"lat": 11.0168, "lng": 76.9558, "keys": ["கோவை", "கோயம்புத்தூர்", "coimbatore", "பொள்ளாச்சி", "மேட்டுப்பாளையம்"]},
    "Cuddalore": {"lat": 11.7480, "lng": 79.7714, "keys": ["கடலூர்", "cuddalore", "சிதம்பரம்", "விருத்தாசலம்", "நெய்வேலி"]},
    "Dharmapuri": {"lat": 12.1211, "lng": 78.1582, "keys": ["தருமபுரி", "தர்மபுரி", "dharmapuri", "ஹரூர்", "பாலக்கோடு"]},
    "Dindigul": {"lat": 10.3673, "lng": 77.9803, "keys": ["திண்டுக்கல்", "dindigul", "பழனி", "கொடைக்கானல்"]},
    "Erode": {"lat": 11.3410, "lng": 77.7172, "keys": ["ஈரோடு", "erode", "கோபிசெட்டிபாளையம்", "பவானி", "பெருந்துறை"]},
    "Kallakurichi": {"lat": 11.7383, "lng": 78.9639, "keys": ["கள்ளக்குறிச்சி", "kallakurichi", "உளுந்தூர்பேட்டை", "சங்கராபுரம்"]},
    "Kancheepuram": {"lat": 12.8342, "lng": 79.7036, "keys": ["காஞ்சிபுரம்", "காஞ்சி", "kancheepuram", "kanchipuram", "ஸ்ரீபெரும்புதூர்"]},
    "Kanyakumari": {"lat": 8.0883, "lng": 77.5385, "keys": ["கன்னியாகுமரி", "நாகர்கோவில்", "kanyakumari", "nagercoil", "குளச்சல்"]},
    "Karur": {"lat": 10.9601, "lng": 78.0766, "keys": ["கரூர்", "karur", "குளித்தலை", "அரவக்குறிச்சி"]},
    "Krishnagiri": {"lat": 12.5186, "lng": 78.2137, "keys": ["கிருஷ்ணகிரி", "krishnagiri", "ஓசூர்", "hosur", "பர்கூர்"]},
    "Madurai": {"lat": 9.9252, "lng": 78.1198, "keys": ["மதுரை", "madurai", "மேலூர்", "உசிலம்பட்டி", "திருமங்கலம்"]},
    "Mayiladuthurai": {"lat": 11.1075, "lng": 79.6524, "keys": ["மயிலாடுதுறை", "mayiladuthurai", "சீர்காழி", "பூம்புகார்"]},
    "Nagapattinam": {"lat": 10.7672, "lng": 79.8449, "keys": ["நாகப்பட்டினம்", "நாகை", "nagapattinam", "வேதாரண்யம்"]},
    "Namakkal": {"lat": 11.2189, "lng": 78.1674, "keys": ["நாமக்கல்", "namakkal", "திருச்செங்கோடு", "ராசிபுரம்"]},
    "Nilgiris": {"lat": 11.4102, "lng": 76.6950, "keys": ["நீலகிரி", "ஊட்டி", "குன்னூர்", "nilgiris", "ooty", "coonoor", "கூடலூர்"]},
    "Perambalur": {"lat": 11.2342, "lng": 78.8820, "keys": ["பெரம்பலூர்", "perambalur", "வேப்பந்தட்டை"]},
    "Pudukkottai": {"lat": 10.3797, "lng": 78.8208, "keys": ["புதுக்கோட்டை", "pudukkottai", "அறந்தாங்கி", "இலுப்பூர்"]},
    "Ramanathapuram": {"lat": 9.3639, "lng": 78.8395, "keys": ["ராமநாதபுரம்", "இராமநாதபுரம்", "ramanathapuram", "ராமேஸ்வரம்", "பரமக்குடி"]},
    "Ranipet": {"lat": 12.9224, "lng": 79.3326, "keys": ["ராணிப்பேட்டை", "ranipet", "ஆற்காடு", "அரக்கோணம்"]},
    "Salem": {"lat": 11.6643, "lng": 78.1460, "keys": ["சேலம்", "salem", "ஆத்தூர்", "மேட்டூர்", "எடப்பாடி"]},
    "Sivaganga": {"lat": 9.8433, "lng": 78.4809, "keys": ["சிவகங்கை", "sivaganga", "காரைக்குடி", "karaikudi", "தேவகோட்டை"]},
    "Tenkasi": {"lat": 8.9594, "lng": 77.3152, "keys": ["தென்காசி", "tenkasi", "குற்றாலம்", "சங்கரன்கோவில்"]},
    "Thanjavur": {"lat": 10.7870, "lng": 79.1378, "keys": ["தஞ்சாவூர்", "தஞ்சை", "thanjavur", "கும்பகோணம்", "பட்டுக்கோட்டை"]},
    "Theni": {"lat": 10.0104, "lng": 77.4768, "keys": ["தேனி", "theni", "போடி", "பெரியகுளம்", "கம்பம்"]},
    "Thoothukudi": {"lat": 8.7642, "lng": 78.1348, "keys": ["தூத்துக்குடி", "thoothukudi", "tuticorin", "கோவில்பட்டி", "திருச்செந்தூர்"]},
    "Tiruchirappalli": {"lat": 10.7905, "lng": 78.7047, "keys": ["திருச்சி", "திருச்சிராப்பள்ளி", "trichy", "tiruchirappalli", "மணப்பாறை", "துறையூர்"]},
    "Tirunelveli": {"lat": 8.7139, "lng": 77.7567, "keys": ["திருநெல்வேலி", "நெல்லை", "tirunelveli", "அம்பாசமுத்திரம்"]},
    "Tirupathur": {"lat": 12.4960, "lng": 78.5630, "keys": ["திருப்பத்தூர்", "tirupathur", "வாணியம்பாடி", "ஆம்பூர்"]},
    "Tiruppur": {"lat": 11.1085, "lng": 77.3411, "keys": ["திருப்பூர்", "tiruppur", "அவிநாசி", "உடுமலைப்பேட்டை", "பல்லடம்"]},
    "Tiruvallur": {"lat": 13.1432, "lng": 79.9079, "keys": ["திருவள்ளூர்", "tiruvallur", "ஆவடி", "பொன்னேரி", "திருத்தணி"]},
    "Tiruvannamalai": {"lat": 12.2253, "lng": 79.0747, "keys": ["திருவண்ணாமலை", "tiruvannamalai", "ஆரணி", "செய்யாறு"]},
    "Tiruvarur": {"lat": 10.7725, "lng": 79.6365, "keys": ["திருவாரூர்", "tiruvarur", "மன்னார்குடி", "திருத்துறைப்பூண்டி"]},
    "Vellore": {"lat": 12.9165, "lng": 79.1325, "keys": ["வேலூர்", "vellore", "குடியாத்தம்", "காட்பாடி"]},
    "Viluppuram": {"lat": 11.9401, "lng": 79.4861, "keys": ["விழுப்புரம்", "viluppuram", "திண்டிவனம்", "செஞ்சி"]},
    "Virudhunagar": {"lat": 9.5680, "lng": 77.9624, "keys": ["விருதுநகர்", "virudhunagar", "அருப்புக்கோட்டை", "aruppukkottai", "சிவகாசி", "sivakasi", "சாத்தூர்", "ராஜபாளையம்", "rajapalayam"]}
}

CATEGORY_MAP = {
    "Corruption": ["ஊழல்", "கைது", "லஞ்சம்", "dvac", "முறைகேடு", "raid", "முறைகேடுகள்", "மோசடி", "வருமான வரி"],
    "Law & Order": ["கொலை", "தாக்குதல்", "போராட்டம்", "கலவரம்", "arrest", "துப்பாக்கி", "வழிப்பறி", "மறியல்", "வெட்டு", "போலீஸ்", "விபத்து"],
    "Infrastructure": ["குடிநீர்", "சாலை", "மின்தடை", "சாக்கடை", "பாலம்", "வெள்ளம்", "பேருந்து", "ரயில்", "மருத்துவமனை"],
    "Governance": ["அரசாணை", "திட்டம்", "விமர்சனம்", "அறிக்கை", "கோரிக்கை", "பட்ஜெட்", "தேர்தல்", "ஆளுநர்", "முதல்வர்", "அமைச்சர்"]
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

def process_feed(feed_url, default_source):
    records = []
    try:
        feed = feedparser.parse(feed_url)
        for item in feed.entries:
            title = getattr(item, "title", "").strip()
            link = getattr(item, "link", "")
            if not title or not link:
                continue

            pub_raw = getattr(item, "published", getattr(item, "updated", ""))
            try:
                pub_dt = date_parser.parse(pub_raw).date()
                inc_date = pub_dt.strftime("%Y-%m-%d")
            except Exception:
                inc_date = datetime.date.today().strftime("%Y-%m-%d")

            dist, lat, lng = detect_district(title)
            cat = detect_category(title)
            source = getattr(item, "source", {}).get("title", default_source)

            records.append({
                "title": title,
                "summary": title,
                "district": dist,
                "latitude": lat,
                "longitude": lng,
                "category": cat,
                "severity": "High" if cat in ["Corruption", "Law & Order"] else "Medium",
                "source_outlet": source if source else default_source,
                "proof_url": link,
                "incident_date": inc_date,
                "status": "approved"
            })
    except Exception as e:
        print(f"[!] Error parsing {default_source}: {e}")
    return records

def run_sync():
    print(f"[*] Ingestion run at: {datetime.datetime.now()}")
    total_added = 0

    sources = [
        ("https://www.dinamalar.com/rss_crime.asp", "Dinamalar Crime"),
        ("https://feeds.feedburner.com/PuthiyathalaimuraiTamilNews", "Puthiyathalaimurai"),
        ("https://tamil.oneindia.com/rss/tamil-news-fb.xml", "OneIndia Tamil"),
        ("https://news.google.com/rss/search?q=%E0%AE%A4%E0%AE%AE%E0%AE%BF%E0%AE%B4%E0%AF%8D%E0%AE%A8%E0%AE%BE%E0%AE%9F%E0%AF%81+%E0%AE%95%E0%AF%88%E0%AE%A4%E0%AF%81+%E0%AE%95%E0%AF%8A%E0%AE%B2%E0%AF%88&hl=ta&gl=IN&ceid=IN:ta", "Google News Crime"),
        ("https://news.google.com/rss/search?q=%E0%AE%A4%E0%AE%AE%E0%AE%BF%E0%AE%B4%E0%AF%8D%E0%AE%A8%E0%AE%BE%E0%AE%9F%E0%AF%81+%E0%AE%8A%E0%AE%B4%E0%AE%B2%E0%AF%8D+DVAC&hl=ta&gl=IN&ceid=IN:ta", "Google News DVAC"),
        ("https://news.google.com/rss/search?q=%E0%AE%A4%E0%AE%AE%E0%AE%BF%E0%AE%B4%E0%AE%95+%E0%AE%AE%E0%AE%BE%E0%AE%B5%E0%AE%9F%E0%AF%8D%E0%AE%9F%E0%AE%99%E0%AF%8D%E0%AE%95%E0%AE%B3%E0%AF%8D+%E0%AE%9A%E0%AF%86%E0%AE%AF%E0%AF%8D%E0%AE%A4%E0%AE%BF%E0%AE%95%E0%AE%B3%E0%AF%8D&hl=ta&gl=IN&ceid=IN:ta", "Google News Districts")
    ]

    for url, src_name in sources:
        items = process_feed(url, src_name)
        if items:
            try:
                res = supabase.table("incidents").upsert(items, on_conflict="proof_url").execute()
                count = len(items)
                total_added += count
                print(f"[✓] Synced {count} records from {src_name}")
            except Exception as e:
                print(f"[!] Upsert error {src_name}: {e}")
        time.sleep(0.5)

    print(f"[★] Completed. Total processed: {total_added}")

if __name__ == "__main__":
    run_sync()