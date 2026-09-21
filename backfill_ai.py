import os
import json
import time
from supabase import create_client, Client
from google import genai
from google.genai import types

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY or not GEMINI_API_KEY:
    raise ValueError("Missing environment variables. Check SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
ai_client = genai.Client(api_key=GEMINI_API_KEY)

def analyze_incident(title, summary, category):
    prompt = f"""
You are a political strategic intelligence analyst for Tamil Nadu (2026 scenario: TVK is ruling party, DMK and AIADMK are opposition).
Analyze this incident:
Headline: {title}
Summary: {summary}
Category: {category}

Rule 1: Generic routine natural events (weather forecast, routine rain, festival, routine accidents, car insurance, college coaching launch) are NOT actionable (is_actionable = false).
Rule 2: If the event reflects administrative lapse, hospital medicine shortage, delayed flood relief, corruption, power shutdown mismanagement, police inaction, or public grievance against administration, it IS actionable (is_actionable = true).
Rule 3: Give concise Tamil attack angle for opposition and defense rebuttal for ruling TVK.

Return ONLY valid JSON:
{{
  "is_actionable": true or false,
  "strategic_tag": "Short 2-4 word tag (e.g. Power Crisis, Medicine Shortage, Welfare Launch, Routine Notice)",
  "attack_angle": "Direct sharp charge in Tamil on administrative lapse",
  "defense_angle": "Constructive counter/rebuttal response in Tamil"
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
                return json.loads(response.text.strip())
            except Exception as e:
                err_str = str(e)
                if "503" in err_str or "UNAVAILABLE" in err_str:
                    print(f"503 Spike on {model_name}. Retrying in 3s...")
                    time.sleep(3)
                    continue
                else:
                    break
    return None

def main():
    print("Fetching top 35 recent incidents needing strategic AI enrichment...")
    
    response = (
        supabase.from_("incidents")
        .select("id, title, summary, category")
        .is_("attack_angle", "null")
        .order("incident_date", desc=True)
        .limit(35)
        .execute()
    )
    
    rows = response.data or []
    print(f"Found {len(rows)} recent priority incidents.")

    for i, row in enumerate(rows, 1):
        title = row.get("title", "")
        summary = row.get("summary", title)
        cat = row.get("category", "Governance")
        row_id = row.get("id")

        print(f"\n[{i}/{len(rows)}] Analyzing: {title[:50]}...")
        ai_res = analyze_incident(title, summary, cat)

        if ai_res:
            update_payload = {
                "is_actionable": ai_res.get("is_actionable", False),
                "strategic_tag": ai_res.get("strategic_tag", "Ground Feed"),
                "attack_angle": ai_res.get("attack_angle"),
                "defense_angle": ai_res.get("defense_angle")
            }
            supabase.from_("incidents").update(update_payload).eq("id", row_id).execute()
            print(f"-> SUCCESS: Actionable={ai_res.get('is_actionable')} | Tag={ai_res.get('strategic_tag')}")
        else:
            print("-> Skipped due to API availability")

        # 4s safe interval for free tier limits
        time.sleep(4)

    print("\nPriority incidents processed cleanly!")

if __name__ == "__main__":
    main()