import os
import re
import json
import urllib.request
from bs4 import BeautifulSoup
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing SUPABASE credentials in environment variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
AC_FILE = "tn_234_constituencies.json"

def load_master_acs():
    if not os.path.exists(AC_FILE):
        return {}
    with open(AC_FILE, "r", encoding="utf-8") as f:
        return {item["ac_number"]: item for item in json.load(f)}

def fetch_live_mla(ac_name, ac_num):
    # Standardize slugs
    clean = re.sub(r'\(|\)', '', ac_name).strip().lower()
    slug = re.sub(r'\s+', '-', clean)
    
    # Common slug variations on tnmla.in
    slug_candidates = [
        slug,
        slug.replace("thoothukkudi", "thoothukudi"),
        slug.replace("shozhinganallur", "sholinganallur"),
        slug.replace("tiruppattur-sivaganga", "tiruppattur"),
        f"ac-{ac_num}"
    ]

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
    }

    for s in slug_candidates:
        url = f"https://tnmla.in/constituency/{s}/"
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=6) as resp:
                soup = BeautifulSoup(resp.read().decode("utf-8", errors="ignore"), "html.parser")
                text = soup.get_text()

                m = re.search(r'Winner:\s*([^·\n\(]+)\s*\(\s*([A-Za-z0-9_\(\)]+)\s*\)', text, re.IGNORECASE)
                if m:
                    return m.group(1).strip(), m.group(2).strip().upper()

                m2 = re.search(r'Elected MLA:\s*([^·\n\(]+)\s*\(\s*([A-Za-z0-9_\(\)]+)\s*\)', text, re.IGNORECASE)
                if m2:
                    return m2.group(1).strip(), m2.group(2).strip().upper()
        except Exception:
            continue

    return None, None

def run_purge_and_sync():
    print("=== Scanning Supabase for Corrupted / Duplicate Records ===")
    master_acs = load_master_acs()
    
    # Fetch all records
    res = supabase.from_("assembly_constituencies").select("ac_number, ac_name, sitting_mla, party").execute()
    data = res.data or []

    # Identify records where sitting_mla is 'V S Babu' or 'V.S. Babu' EXCEPT Kolathur (AC 13)
    corrupted = [
        r for r in data 
        if r["ac_number"] != 13 and "babu" in r.get("sitting_mla", "").lower()
    ]

    print(f"Found {len(corrupted)} constituencies corrupted with duplicate Babu data.")

    for r in corrupted:
        num = r["ac_number"]
        name = r["ac_name"]
        district = master_acs.get(num, {}).get("district", "Tamil Nadu")

        print(f"Purging & fetching ground truth for AC {num:03d}: {name}...", end=" ", flush=True)
        mla, party = fetch_live_mla(name, num)

        if mla and party:
            payload = {
                "ac_number": num,
                "ac_name": name,
                "district": district,
                "sitting_mla": mla,
                "party": party
            }
            supabase.from_("assembly_constituencies").upsert(payload).execute()
            print(f"FIXED -> {mla} ({party})")
        else:
            print("Failed to resolve from web.")

    print("\nPurge and auto-correction sweep complete!")

if __name__ == "__main__":
    run_purge_and_sync()