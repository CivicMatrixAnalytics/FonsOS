# FonsOS Statutory Tamil Nadu Assembly Constituency (AC) Registry
# Contains accurate AC numbers, districts, and Tamil/English town aliases.
# MLA data is kept dynamic/configurable to prevent outdated or inaccurate political claims.

TN_AC_REGISTRY = [
    {
        "ac_number": 197,
        "name": "Usilampatti",
        "district": "Madurai",
        "aliases": ["usilampatti", "உசிலம்பட்டி", "sedapatti", "செடப்பட்டி", "chellampatti"]
    },
    {
        "ac_number": 88,
        "name": "Rasipuram",
        "district": "Namakkal",
        "aliases": ["rasipuram", "ராசிபுரம்", "venandur", "வெண்ணந்தூர்", "namagiripettai"]
    },
    {
        "ac_number": 209,
        "name": "Aruppukkottai",
        "district": "Virudhunagar",
        "aliases": ["aruppukkottai", "அருப்புக்கோட்டை", "kariyapatti", "காரியாபட்டி", "mallankinaru"]
    },
    {
        "ac_number": 18,
        "name": "Harbour",
        "district": "Chennai",
        "aliases": ["harbour", "ஹார்பர்", "george town", "broadway", "பாரீஸ் கார்னர்", "parrys"]
    },
    {
        "ac_number": 25,
        "name": "Mylapore",
        "district": "Chennai",
        "aliases": ["mylapore", "மயிலாப்பூர்", "alwarpet", "mandaveli", "மந்தைவெளி"]
    },
    {
        "ac_number": 26,
        "name": "Velachery",
        "district": "Chennai",
        "aliases": ["velachery", "வேளச்சேரி", "taramani", "தரமணி"]
    },
    {
        "ac_number": 118,
        "name": "Coimbatore South",
        "district": "Coimbatore",
        "aliases": ["coimbatore south", "கோவை தெற்கு", "gandhipuram", "காந்திபுரம்", "rs puram"]
    },
    {
        "ac_number": 191,
        "name": "Madurai Central",
        "district": "Madurai",
        "aliases": ["madurai central", "மதுரை மத்தி", "simmakkal", "சிம்மக்கல்", "goripalayam"]
    },
    {
        "ac_number": 86,
        "name": "Edappadi",
        "district": "Salem",
        "aliases": ["edappadi", "எடப்பாடி", "poolampatti", "கொங்கணாபுரம்"]
    },
    {
        "ac_number": 12,
        "name": "Kolathur",
        "district": "Chennai",
        "aliases": ["kolathur", "கொளத்தூர்", "peravallur", "பெரவள்ளூர்"]
    },
    {
        "ac_number": 169,
        "name": "Nannilam",
        "district": "Tiruvarur",
        "aliases": ["nannilam", "நன்னிலம்", "kudavasal", "குடவாசல்"]
    },
    {
        "ac_number": 44,
        "name": "Madurantakam",
        "district": "Chengalpattu",
        "aliases": ["madurantakam", "மதுராந்தகம்", "achirupakkam", "அச்சிறுப்பாக்கம்"]
    }
]

def resolve_ac_from_text(text: str):
    """
    Scans text for English and Tamil town/constituency keywords.
    Returns matching AC dictionary or None.
    """
    text_lower = text.lower()
    for ac in TN_AC_REGISTRY:
        for alias in ac["aliases"]:
            if alias.lower() in text_lower:
                return {
                    "ac_number": ac["ac_number"],
                    "name": ac["name"],
                    "district": ac["district"]
                }
    return None