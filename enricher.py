import os
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

_client = None

def get_supabase() -> Client:
    global _client
    if _client is None:
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            raise ValueError("Supabase credentials missing.")
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _client

def get_constituency_incumbent(ac_number: int):
    """
    Fetch statutory incumbent metadata for any AC number.
    Returns: dict with ac_number, ac_name, district, sitting_mla, party
    """
    try:
        sb = get_supabase()
        res = sb.from_("assembly_constituencies")\
            .select("ac_number, ac_name, district, sitting_mla, party")\
            .eq("ac_number", ac_number)\
            .maybe_single()\
            .execute()
        return res.data if res else None
    except Exception as e:
        print(f"Metadata lookup warning for AC {ac_number}: {e}")
        return None

def inject_metadata_to_dataframe(df, ac_number: int):
    """
    Appends statutory metadata columns directly into extracted Pandas DataFrames
    before saving to Excel (.xlsx).
    """
    meta = get_constituency_incumbent(ac_number)
    if meta:
        df["Sitting_MLA"] = meta.get("sitting_mla", "N/A")
        df["Incumbent_Party"] = meta.get("party", "N/A")
        df["District"] = meta.get("district", "N/A")
    return df