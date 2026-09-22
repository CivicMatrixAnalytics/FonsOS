import os
import json
import re
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("Missing Supabase credentials. Make sure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Load dynamic 234 Assembly Constituencies from JSON
with open("tn_234_constituencies.json", "r", encoding="utf-8") as f:
    TN_AC_LIST = json.load(f)

print(f"Loaded {len(TN_AC_LIST)} Assembly Constituencies from JSON master.")

def resolve_ac(text):
    text_lower = text.lower()
    for ac in TN_AC_LIST:
        for alias in ac.get("aliases", []):
            # Check whole word match or substring in Tamil/English
            pattern = r'\b' + re.escape(alias.lower()) + r'\b'
            if re.search(pattern, text_lower) or alias.lower() in text_lower:
                return ac
    return None

def main():
    print("Fetching existing incidents from Supabase...")
    response = supabase.from_("incidents").select("id, title, summary, district").execute()
    rows = response.data or []
    print(f"Total incidents found in database: {len(rows)}")

    matched_count = 0
    for row in rows:
        combined = f"{row.get('title', '')} {row.get('summary', '')}"
        match = resolve_ac(combined)

        if match:
            matched_count += 1
            payload = {
                "constituency": match["name"],
                "ac_number": match["ac_number"],
                "district": match["district"]
            }
            supabase.from_("incidents").update(payload).eq("id", row["id"]).execute()
            print(f"[{matched_count}] Matched AC {match['ac_number']}: {match['name']} ({match['district']}) -> {row.get('title', '')[:45]}")

    print(f"\nCompleted! Successfully enriched {matched_count} incidents with statutory Assembly Constituencies.")

if __name__ == "__main__":
    main()