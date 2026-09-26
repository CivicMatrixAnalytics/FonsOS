"""
FonsOS Master Intelligence Taxonomy Engine v1.0
Exhaustive 20-Category & 46-Section Keyword Matrix for Tamil Nadu Ground & Political Intelligence.
Zero keywords omitted.
"""

import re
from typing import Dict, List, Any

# 1. 20 Master Categories Definition
MASTER_CATEGORIES = {
    "POL": "Politics & Political Activity",
    "GOV": "Government & Administration",
    "ELE": "Elections & Electoral Process",
    "COR": "Corruption & Misconduct",
    "LOR": "Law & Order / Crime",
    "WOM": "Crimes Against Women & Women Safety",
    "CHI": "Crimes Against Children & Child Welfare",
    "EDU": "Education",
    "HEA": "Healthcare",
    "AGR": "Agriculture & Rural",
    "FIS": "Fishermen & Coastal Issues",
    "EMP": "Employment & Labour",
    "INF": "Infrastructure & Public Works",
    "ENV": "Environment & Natural Resources",
    "WEL": "Welfare & Social Security",
    "SOC": "Social / Community Conflicts & Atrocities",
    "YTH": "Youth & Students",
    "DIG": "Digital / Social Media Signals",
    "JUS": "Judiciary & Legal",
    "PUB": "Public Grievance & Ground Mobilisation",
}

# 2. Exhaustive Keyword Matrix directly mapped from your master taxonomy
TAXONOMY_KEYWORDS: Dict[str, Dict[str, Any]] = {
    "POL": {
        "subcategories": [
            "POL-01: Leadership & Party Organisation",
            "POL-02: Political Statement & Controversy",
            "POL-03: Meetings & Rallies",
            "POL-04: Internal Conflict & Factionalism",
            "POL-05: Defection & Resignation",
            "POL-06: Alliance & Seat Sharing",
            "POL-07: Election Campaign Signals"
        ],
        "keywords": [
            # 1. Core Political
            "அரசியல்", "அரசியல் கட்சி", "அரசியல் தலைவர்", "கட்சி", "கட்சித் தலைவர்", "தலைமை",
            "அரசியல் கூட்டணி", "கூட்டணி", "எதிர்க்கட்சி", "ஆளும் கட்சி", "அரசு", "ஆட்சி",
            "அரசியல் நிலவரம்", "அரசியல் களம்", "அரசியல் பரபரப்பு", "அரசியல் மாற்றம்", "அரசியல் சூழல்",
            "அரசியல் நடவடிக்கை", "அரசியல் அறிவிப்பு", "அரசியல் முடிவு", "அரசியல் விமர்சனம்",
            "அரசியல் குற்றச்சாட்டு", "தலைமை கழகம்", "மாநில தலைவர்", "மாவட்ட தலைவர்", "தலைமை",
            # 2. Party / Leader Specific
            "திமுக", "தி.மு.க", "DMK", "திராவிட முன்னேற்றக் கழகம்", "திமுக அரசு", "திமுக ஆட்சி",
            "திமுக தலைவர்", "திமுக நிர்வாகி", "திமுக மாவட்ட செயலாளர்", "திமுக எம்எல்ஏ", "திமுக எம்பி",
            "அதிமுக", "அ.தி.மு.க", "AIADMK", "அண்ணா திராவிட முன்னேற்றக் கழகம்", "அதிமுக தலைவர்",
            "அதிமுக நிர்வாகி", "அதிமுக மாவட்ட செயலாளர்", "அதிமுக எம்எல்ஏ", "அதிமுக எம்பி",
            "BJP", "பாஜக", "Congress", "காங்கிரஸ்", "PMK", "பாமக", "VCK", "விசிக", "TVK", "தவெக",
            "தமிழக வெற்றிக் கழகம்", "NTK", "நாம் தமிழர்", "நாம் தமிழர் கட்சி", "CPI", "சிபிஐ",
            "CPI(M)", "சிபிஎம்", "மார்க்சிஸ்ட்", "MDMK", "மதிமுக", "DMDK", "தேமுதிக", "IUML",
            "முஸ்லிம் லீக்", "AMMK", "அமமுக", "MNM", "மநீம", "மக்கள் நீதி மய்யம்",
            "முதல்வர்", "முதலமைச்சர்", "CM", "Chief Minister", "தமிழக முதல்வர்", "தமிழக முதலமைச்சர்",
            "முன்னாள் முதல்வர்", "எதிர்க்கட்சி தலைவர்",
            # 3. Positive News
            "வெற்றி", "ஆதரவு", "வரவேற்பு", "பாராட்டு", "பாராட்டினார்", "பாராட்டுகள்", "சாதனை",
            "சிறப்பான செயல்பாடு", "முக்கிய சாதனை", "முன்னேற்றம்", "வளர்ச்சி", "கட்சியில் இணைவு",
            "ஆதரவு தெரிவித்தார்", "ஆதரவு பெருகுகிறது", "பிரமாண்ட கூட்டம்", "திரண்ட மக்கள்",
            "தொண்டர்கள் உற்சாகம்", "தொண்டர்கள் வரவேற்பு",
            # 8. Party Internal Conflict
            "கட்சிக்குள் மோதல்", "கட்சிக்குள் அதிருப்தி", "உள்கட்சி பிரச்சனை", "உள்கட்சி மோதல்",
            "கோஷ்டி மோதல்", "கோஷ்டி பூசல்", "கோஷ்டி அரசியல்", "நிர்வாகிகள் அதிருப்தி",
            "தொண்டர்கள் அதிருப்தி", "தொண்டர்கள் எதிர்ப்பு", "நிர்வாகிகள் எதிர்ப்பு",
            "மாவட்ட செயலாளர் எதிர்ப்பு", "பதவி நீக்கம்", "பதவி மாற்றம்", "பொறுப்பு மாற்றம்",
            "கட்சி நடவடிக்கை", "கட்சியிலிருந்து நீக்கம்", "கட்சியில் இருந்து விலகல்", "கட்சி விலகல்",
            "கட்சியில் இருந்து வெளியேறினார்", "ராஜினாமா", "பதவி ராஜினாமா", "கட்சிக்குள் சர்ச்சை", "கட்சிக்குள் குழப்பம்",
            # 9. Defection / Party Switching
            "கட்சி மாறினார்", "கட்சித் தாவல்", "கட்சியில் இணைந்தார்", "புதிய கட்சியில் இணைந்தார்",
            "விலகினார்", "விலகல்", "ஆதரவு வாபஸ்", "ஆதரவு மாற்றம்", "கட்சித் தலைமைக்கு எதிர்ப்பு",
            "மாற்றுக் கட்சியில் இணைவு", "முக்கிய நிர்வாகி இணைவு", "முக்கிய தலைவர் இணைவு",
            "தொண்டர்கள் இணைவு", "நிர்வாகிகள் கூண்டோடு",
            # 10. Alliance / Coalition
            "கூட்டணி பேச்சு", "கூட்டணி பேச்சுவார்த்தை", "கூட்டணி முடிவு", "கூட்டணி அறிவிப்பு",
            "தொகுதி பங்கீடு", "தொகுதி பங்கீட்டு பேச்சு", "தொகுதி பங்கீடு பேச்சுவார்த்தை", "இருக்கை பங்கீடு",
            "கூட்டணி கட்சிகள்", "கூட்டணி கட்சி", "கூட்டணி மாற்றம்", "கூட்டணி முறிவு",
            "கூட்டணியில் இருந்து விலகல்", "கூட்டணியில் இணைவு", "நிபந்தனையுடன் ஆதரவு",
            # 14. Controversy & 15. Statements
            "சர்ச்சை", "பரபரப்பு", "சர்ச்சைக்குரிய பேச்சு", "சர்ச்சைக்குரிய கருத்து", "சர்ச்சை பேச்சு",
            "விமர்சனத்துக்கு உள்ளான", "கடும் விமர்சனம்", "கடும் கண்டனம்", "பரபரப்பு பேச்சு",
            "அதிர்ச்சி தகவல்", "அதிர்ச்சி குற்றச்சாட்டு", "வாய்ச்சண்டை", "வார்த்தைப் போர்", "கடும் மோதல்",
            "பதிலடி", "பதிலடி கருத்து", "கடும் பதிலடி", "விளக்கம் அளித்தார்", "மறுப்பு", "மறுப்பு தெரிவித்தார்",
            "விளக்கம்", "பேச்சு", "உரை", "அறிக்கை", "பேட்டி", "செய்தியாளர் சந்திப்பு", "கருத்து",
            "கருத்து தெரிவித்தார்", "கூறினார்", "தெரிவித்தார்", "எச்சரிக்கை", "கண்டனம்", "குற்றம்சாட்டினார்",
            "விமர்சித்தார்", "சவால்", "சவால் விடுத்தார்", "பதிலளித்தார்",
            # 23. Leadership Crisis & 24. Campaign Ground
            "ராஜினாமா செய்தார்", "பதவியில் இருந்து விலகல்", "பதவி விலகல்", "தலைமை மாற்றம்",
            "புதிய தலைவர்", "புதிய நிர்வாகம்", "நிர்வாக மாற்றம்", "பொறுப்பு நீக்கம்", "பொறுப்பு வழங்கல்",
            "பதவி வழங்கல்", "பிரசாரம்", "வீடு வீடாக பிரசாரம்", "வாக்கு சேகரிப்பு", "வாக்கு கேட்டு",
            "பொதுக்கூட்டம்", "தெருமுனை பிரசாரம்", "பிரச்சார வாகனம்", "தொண்டர்கள் திரண்டனர்",
            "ஆதரவாளர்கள் திரண்டனர்", "மக்கள் சந்திப்பு", "களப்பணி", "களப்பயணம்", "தொகுதி பயணம்",
            "தொண்டர் சந்திப்பு", "ஆலோசனை கூட்டம்", "நிர்வாகிகள் கூட்டம்", "கருப்புக்கொடி",
            # English
            "politics", "political leader", "party leader", "leadership", "state leadership",
            "district leadership", "party headquarters", "statement", "interview", "speech",
            "remark", "comment", "criticism", "condemnation", "response", "clarification", "counter",
            "meeting", "public meeting", "party meeting", "executive meeting", "consultation",
            "internal party", "faction", "factionalism", "internal conflict", "dissent", "discontent",
            "disciplinary action", "defection", "switched party", "joined party", "resigned",
            "quit party", "crossed over", "joined alliance", "alliance", "seat sharing", "alliance talks",
            "coalition", "seat allocation", "black flag", "campaign"
        ]
    },
    "GOV": {
        "subcategories": [
            "GOV-01: Government Announcement",
            "GOV-02: Policy",
            "GOV-03: Administration",
            "GOV-04: Official Action",
            "GOV-05: Government Performance",
            "GOV-06: Local Administration"
        ],
        "keywords": [
            "அரசு அறிவிப்பு", "அரசாணை", "அறிவிப்பு", "உத்தரவு", "திட்டம் அறிவிப்பு", "கொள்கை",
            "புதிய கொள்கை", "கொள்கை மாற்றம்", "விதிமுறை", "சட்ட விதி", "மாவட்ட நிர்வாகம்",
            "மாவட்ட ஆட்சியர்", "ஆட்சியர்", "தாசில்தார்", "வருவாய்", "அதிகாரி", "அதிகாரிகள்",
            "நடவடிக்கை", "சோதனை", "ஆய்வு", "விசாரணை", "அறிவுறுத்தல்", "தடை", "அனுமதி",
            "செயல்பாடு", "நிறைவேற்றப்பட்டது", "தாமதம்", "தோல்வி", "முடக்கம்", "அமலாக்கம்",
            "மாநகராட்சி", "நகராட்சி", "பேரூராட்சி", "ஊராட்சி", "பஞ்சாயத்து", "வார்டு",
            "அரசு அலுவலகம்", "அதிகாரிகள் நடவடிக்கை இல்லை", "அதிகாரிகள் அலட்சியம்", "நிர்வாக அலட்சியம்", "அரசு அலட்சியம்",
            "government order", "district collector", "collectorate", "tahsildar", "revenue department",
            "official action", "policy change", "corporation", "municipality", "town panchayat"
        ]
    },
    "ELE": {
        "subcategories": [
            "ELE-01: Election Process",
            "ELE-02: Electoral Roll & EPIC",
            "ELE-03: Booths & Polling Stations",
            "ELE-04: Election Violations & Cash",
            "ELE-05: Candidate & Nomination",
            "ELE-06: Voting & Counting"
        ],
        "keywords": [
            "தேர்தல்", "சட்டமன்ற தேர்தல்", "மக்களவை தேர்தல்", "நாடாளுமன்ற தேர்தல்", "இடைத்தேர்தல்",
            "உள்ளாட்சி தேர்தல்", "தேர்தல் ஆணையம்", "வாக்காளர்", "வாக்காளர் பட்டியல்", "பெயர் சேர்ப்பு",
            "பெயர் நீக்கம்", "பெயர் திருத்தம்", "வாக்காளர் அட்டை", "EPIC", "வாக்குச்சாவடி", "பூத்",
            "Polling station", "Booth level", "BLO", "தேர்தல் விதிமுறை மீறல்", "பணம் விநியோகம்",
            "பரிசு", "வாக்குக்கு பணம்", "தேர்தல் புகார்", "வேட்பாளர்", "வேட்புமனு", "வேட்புமனு தாக்கல்",
            "வேட்புமனு நிராகரிப்பு", "வேட்பாளர் பட்டியல்", "சின்னம்", "தேர்தல் அறிக்கை", "வாக்குறுதி",
            "தேர்தல் வாக்குறுதி", "தேர்தல் வியூகம்", "தேர்தல் வியூகக் குழு", "வாக்குப்பதிவு",
            "வாக்கு எண்ணிக்கை", "வாக்குப்பதிவு சதவீதம்", "மறுவாக்குப்பதிவு",
            "election", "electoral roll", "booth", "candidate", "nomination", "polling", "counting"
        ]
    },
    "COR": {
        "subcategories": [
            "COR-01: Corruption Allegation",
            "COR-02: Bribery & Extortion",
            "COR-03: Financial Irregularity & Embezzlement",
            "COR-04: Tender / Contract Scams",
            "COR-05: Investigation & Raids"
        ],
        "keywords": [
            "ஊழல்", "ஊழல் குற்றச்சாட்டு", "முறைகேடு", "முறைகேடு புகார்", "மோசடி", "பண மோசடி",
            "நிதி மோசடி", "லஞ்சம்", "லஞ்ச புகார்", "கையூட்டு", "லஞ்சம் வாங்கிய", "லஞ்சம் கொடுத்த",
            "லஞ்சம் பெற்றதாக", "லஞ்சம் கேட்டதாக", "பணம் பெற்றதாக புகார்", "பணம் கையாடல்", "கணக்கு முறைகேடு",
            "போலி ஆவணம்", "போலி பில்", "டெண்டர்", "டெண்டர் முறைகேடு", "ஒப்பந்த முறைகேடு", "ஒப்பந்தம்",
            "கமிஷன்", "கமிஷன் புகார்", "சொத்து குவிப்பு", "வருமானத்திற்கு அதிகமான சொத்து",
            "அதிகார துஷ்பிரயோகம்", "பதவி துஷ்பிரயோகம்", "நிதி முறைகேடு", "அரசு நிதி முறைகேடு",
            "அமலாக்கத்துறை", "ED", "CBI", "லஞ்ச ஒழிப்புத்துறை", "DVAC", "வருமான வரித்துறை",
            "IT ரெய்டு", "சோதனை", "ரெய்டு", "அராஜகம்", "அதிகார அத்துமீறல்",
            "corruption", "corruption allegation", "irregularity", "fraud", "bribery", "embezzlement",
            "tender scam", "kickbacks", "disproportionate assets", "abuse of power", "dvac", "cbi raid", "ed raid"
        ]
    },
    "LOR": {
        "subcategories": [
            "LOR-01: Murder & Homicide",
            "LOR-02: Assault & Violence",
            "LOR-03: Theft & Robbery",
            "LOR-04: Kidnapping & Missing",
            "LOR-05: Narcotics & Drugs",
            "LOR-06: Cyber Crime",
            "LOR-07: Police Action",
            "LOR-08: Police Accountability"
        ],
        "keywords": [
            "குற்றம்", "குற்றச்செயல்", "குற்றவாளி", "கொலை", "கொலை முயற்சி", "படுகொலை", "மரணம்",
            "தாக்குதல்", "காயம்", "கத்திக்குத்து", "வெட்டுக்காயம்", "துப்பாக்கிச்சூடு", "வெடிகுண்டு",
            "குண்டுவெடிப்பு", "திருட்டு", "கொள்ளை", "வழிப்பறி", "செயின் பறிப்பு", "நகை பறிப்பு",
            "வீடு புகுந்து கொள்ளை", "வாகன திருட்டு", "பைக் திருட்டு", "கார் திருட்டு", "கடத்தல்",
            "கடத்தப்பட்டார்", "கடத்தப்பட்ட", "மீட்கப்பட்டார்", "மீட்பு", "தேடுதல்", "தேடுதல் பணி",
            "போலீசார் தேடல்", "போதைப்பொருள்", "போதைப்பொருள் கடத்தல்", "போதைப்பொருள் விற்பனை",
            "போதைப்பொருள் பறிமுதல்", "கஞ்சா", "கஞ்சா கடத்தல்", "கஞ்சா விற்பனை", "கஞ்சா பறிமுதல்",
            "மெத்தாம்பெட்டமைன்", "மெத்", "ஹெராயின்", "கோகெயின்", "போதை மாத்திரை", "போதை ஊசி",
            "போதை கும்பல்", "போதைப்பொருள் கும்பல்", "போதைப்பொருள் வழக்கு", "NDPS", "NDPS Act",
            "சைபர் குற்றம்", "சைபர் மோசடி", "ஆன்லைன் மோசடி", "ஆன்லைன் பண மோசடி", "UPI மோசடி",
            "வங்கி மோசடி", "OTP மோசடி", "டிஜிட்டல் மோசடி", "போலி கணக்கு", "போலி சமூக ஊடக கணக்கு",
            "ஆன்லைன் மிரட்டல்", "சைபர் மிரட்டல்", "ஆன்லைன் துன்புறுத்தல்", "காவல்துறை", "போலீசார்",
            "காவல் நிலையம்", "போலீஸ் நிலையம்", "FIR", "வழக்குப்பதிவு", "வழக்குப்பதிவு செய்தனர்",
            "கைது", "கைது செய்யப்பட்டார்", "கைது செய்யப்பட்டனர்", "காவலில்", "விசாரணை", "போலீஸ் விசாரணை",
            "தேடுதல் வேட்டை", "பறிமுதல்", "ரிமாண்ட்", "சிறையில் அடைப்பு", "போலீஸ் அலட்சியம்",
            "காவல்துறை அலட்சியம்", "போலீஸ் நடவடிக்கை இல்லை", "நடவடிக்கை எடுக்கவில்லை", "புகார் ஏற்கவில்லை",
            "புகார் மீது நடவடிக்கை இல்லை", "FIR பதிவு செய்யவில்லை", "போலீஸ் மீது புகார்", "காவல்துறை மீது புகார்",
            "போலீஸ் அதிகாரி மீது குற்றச்சாட்டு", "காவல் நிலையத்தில் புகார்", "காவல் நிலையத்தில் தகராறு",
            "காவல் மரணம்", "காவல் சித்திரவதை", "போலீஸ் அத்துமீறல்", "காவல்துறை அத்துமீறல்",
            "crime", "murder", "assault", "robbery", "chain snatching", "narcotics", "ganja", "meth",
            "cybercrime", "police arrest", "custodial death", "police brutality", "fir"
        ]
    },
    "WOM": {
        "subcategories": [
            "WOM-01: Violence Against Women",
            "WOM-02: Sexual Crime & Rape",
            "WOM-03: Domestic Violence",
            "WOM-04: Dowry Harassment & Death",
            "WOM-05: Women Safety & Protection",
            "WOM-06: Women Institutions & Welfare"
        ],
        "keywords": [
            # 26. Crimes Against Women
            "பெண்களுக்கு எதிரான குற்றம்", "பெண்களுக்கு எதிரான வன்முறை", "பெண்கள் மீதான வன்முறை",
            "பெண்கள் பாதுகாப்பு", "பெண்கள் பாதுகாப்பு கேள்விக்குறி", "பெண்கள் பாதுகாப்பு இல்லை",
            "பெண் பாதுகாப்பு", "பெண் மீது தாக்குதல்", "பெண் மீது கொலைவெறி தாக்குதல்", "பெண் கொலை",
            "பெண் கொலை செய்யப்பட்டார்", "பெண் மரணம்", "பெண் தற்கொலை", "பெண்ணை தாக்கிய",
            "பெண்ணை கொடுமைப்படுத்திய", "பெண்ணை மிரட்டிய", "பெண்ணை துன்புறுத்திய", "பெண்ணுக்கு தொல்லை",
            "பெண்ணிடம் அத்துமீறல்", "பெண்ணிடம் பாலியல் அத்துமீறல்", "பாலியல் வன்முறை", "பாலியல் குற்றம்",
            "பாலியல் தொல்லை", "பாலியல் துன்புறுத்தல்", "பாலியல் சீண்டல்", "பாலியல் தாக்குதல்",
            "பெண்கள் மீதான பாலியல் வன்முறை", "பெண்களை துன்புறுத்தல்", "பெண்ணை அவமதித்த", "பெண்ணை மிரட்டல்",
            "பெண்ணை பின்தொடர்ந்த", "பெண்ணை கடத்தல்", "பெண் கடத்தல்", "பெண் காணவில்லை", "பெண் மாயம்",
            "பெண் மாயமானார்", "வரதட்சணை கொடுமை", "வரதட்சணை புகார்", "குடும்ப வன்முறை", "கணவர் கொடுமை",
            "மாமியார் கொடுமை", "குடும்ப தகராறு", "திருமண கொடுமை",
            # 27. Sexual Crime / Rape
            "பாலியல் வன்கொடுமை", "பாலியல் பலாத்காரம்", "பாலியல் வல்லுறவு", "பலாத்காரம்", "வன்கொடுமை",
            "பெண்ணை பலாத்காரம்", "பெண் பாலியல் வன்கொடுமை", "பாலியல் குற்றச்சாட்டு", "பாலியல் புகார்",
            "பாலியல் குற்ற வழக்கு", "பாலியல் குற்றத்தில் கைது", "பாலியல் வழக்கில் கைது",
            # 28. Domestic Violence
            "குடும்ப வன்முறை புகார்", "கணவர் தாக்குதல்", "கணவர் மிரட்டல்", "கணவர் கைது",
            "மனைவி மீது தாக்குதல்", "மனைவியை தாக்கிய", "மனைவி கொலை", "மனைவி தற்கொலை", "மனைவிக்கு கொடுமை",
            "வரதட்சணை தகராறு", "வரதட்சணை மரணம்", "திருமண பிரச்சனை", "குடும்ப பிரச்சனை",
            # 33. Institutions
            "மகளிர் காவல் நிலையம்", "அனைத்து மகளிர் காவல் நிலையம்", "மகளிர் போலீஸ்", "பெண்கள் உதவி மையம்",
            "பெண்கள் பாதுகாப்பு மையம்", "பெண்கள் நலத்துறை", "One Stop Centre", "Sakhi Centre", "181", "1091",
            "பெண்களுக்கு ஆன்லைன் தொல்லை", "பெண் மீது ஆன்லைன் அவதூறு",
            "violence against women", "crimes against women", "sexual assault", "rape", "molestation",
            "dowry death", "domestic violence", "women safety"
        ]
    },
    "CHI": {
        "subcategories": [
            "CHI-01: Child Abuse & Violence",
            "CHI-02: POCSO & Sexual Crimes",
            "CHI-03: Missing Children & Kidnapping",
            "CHI-04: Child Labour",
            "CHI-05: Child Marriage",
            "CHI-06: School & Student Safety"
        ],
        "keywords": [
            # 29. Crimes Against Children
            "குழந்தைகளுக்கு எதிரான குற்றம்", "குழந்தைகள் மீதான வன்முறை", "குழந்தை பாதுகாப்பு",
            "குழந்தைகள் பாதுகாப்பு", "குழந்தை மீது தாக்குதல்", "குழந்தையை தாக்கிய", "குழந்தை கொலை",
            "குழந்தை மரணம்", "குழந்தை காணவில்லை", "குழந்தை மாயம்", "குழந்தை கடத்தல்", "குழந்தைகள் கடத்தல்",
            "குழந்தை துன்புறுத்தல்", "குழந்தையை துன்புறுத்திய", "குழந்தை பாலியல் வன்முறை", "குழந்தை பாலியல் குற்றம்",
            "குழந்தைக்கு பாலியல் தொல்லை", "குழந்தை மீதான பாலியல் வன்கொடுமை", "சிறுமி மீது பாலியல் வன்முறை",
            "சிறுமி பாலியல் வன்கொடுமை", "சிறுமி கடத்தல்", "சிறுமி காணவில்லை", "சிறுவன் காணவில்லை",
            "சிறுவன் கடத்தல்", "பள்ளி மாணவி மீது", "பள்ளி மாணவன் மீது", "மாணவி மீது தாக்குதல்",
            "மாணவன் மீது தாக்குதல்", "சிறுமி மாயம்", "சிறுவன் மாயம்",
            # 30. Child Sexual Abuse / POCSO
            "POCSO", "போக்சோ", "போக்சோ வழக்கு", "போக்சோ சட்டம்", "போக்சோவில் கைது", "போக்சோ வழக்கில் கைது",
            "குழந்தை பாலியல் துஷ்பிரயோகம்", "சிறுவர் பாலியல் துஷ்பிரயோகம்", "சிறுமி பாலியல் துஷ்பிரயோகம்",
            "சிறுவன் பாலியல் துஷ்பிரயோகம்", "சிறுமிக்கு பாலியல் தொல்லை", "சிறுவனுக்கு பாலியல் தொல்லை",
            "சிறுமியை பாலியல் வன்கொடுமை", "குழந்தையை பாலியல் வன்கொடுமை", "குழந்தைகள் பாதுகாப்பு சட்டம்",
            "குழந்தைகள் மீதான பாலியல் குற்றம்",
            # 32. Child Labour & Welfare
            "குழந்தை தொழிலாளர்", "குழந்தை தொழிலாளர்கள்", "சிறுவர் தொழிலாளர்", "சிறுமி வேலை", "சிறுவன் வேலை",
            "குழந்தை தொழிலாளர் மீட்பு", "குழந்தை தொழிலாளர் தடுப்பு", "குழந்தைகள் நலன்", "குழந்தைகள் நலத்துறை",
            "குழந்தைகள் நலக்குழு", "குழந்தைகள் இல்லம்", "சிறார் இல்லம்", "அனாதை குழந்தைகள்", "கைவிடப்பட்ட குழந்தை",
            "குழந்தை கைவிடப்பட்ட", "Child Welfare Committee", "District Child Protection Unit", "1098", "Childline",
            "குழந்தை திருமணம்", "சிறுவர் திருமணம்", "சிறுமி திருமணம்", "பள்ளி பாதுகாப்பு", "மாணவர் பாதுகாப்பு",
            "child abuse", "pocso", "pocso act", "pocso arrest", "missing child", "child labour", "child marriage"
        ]
    },
    "EDU": {
        "subcategories": [
            "EDU-INFRA", "EDU-TEACHER", "EDU-STUDENT", "EDU-EXAM", "EDU-FEE",
            "EDU-SCHOLARSHIP", "EDU-ACCESS", "EDU-PROTEST", "EDU-SAFETY"
        ],
        "keywords": [
            "கல்வி", "பள்ளி", "கல்லூரி", "பல்கலைக்கழகம்", "மாணவர்கள்", "ஆசிரியர்கள்", "ஆசிரியர் பற்றாக்குறை",
            "பள்ளி கட்டிடம்", "பள்ளி மூடல்", "தேர்வு", "தேர்வு முடிவு", "NEET", "நீட்", "கல்விக் கட்டணம்",
            "கல்வி உதவித்தொகை", "மாணவர் போராட்டம்", "ஆசிரியர் போராட்டம்", "பள்ளி பிரச்சனை", "கல்வி பிரச்சனை",
            "பள்ளி மாணவி", "பள்ளி மாணவன்", "கல்லூரி மாணவர்கள்", "பள்ளி பாதுகாப்பு", "கல்லூரி பாதுகாப்பு",
            "கல்வி வசதி", "தேர்வு பிரச்சனை", "பள்ளி பூட்டு",
            "education", "school", "college", "university", "teachers shortage", "neet", "exam", "fees issue"
        ]
    },
    "HEA": {
        "subcategories": [
            "HEA-HOSPITAL", "HEA-PHC", "HEA-STAFF", "HEA-MEDICINE", "HEA-EMERGENCY",
            "HEA-MEDICAL_ACCESS", "HEA-ALLEGED_NEGLIGENCE", "HEA-PUBLIC_HEALTH"
        ],
        "keywords": [
            "மருத்துவம்", "மருத்துவமனை", "அரசு மருத்துவமனை", "GH", "PHC", "ஆரம்ப சுகாதார நிலையம்",
            "மருத்துவர் பற்றாக்குறை", "செவிலியர் பற்றாக்குறை", "மருந்து பற்றாக்குறை", "மருத்துவ அலட்சியம்",
            "சிகிச்சை", "ஆம்புலன்ஸ்", "அவசர சிகிச்சை", "சுகாதாரம்", "சுகாதார சீர்கேடு", "மருத்துவ வசதி",
            "மருத்துவமனை பிரச்சனை", "தடுப்பூசி", "டெங்கு", "காய்ச்சல்", "தொற்றுநோய்",
            "healthcare", "hospital", "primary health centre", "doctor shortage", "medical negligence", "ambulance"
        ]
    },
    "AGR": {
        "subcategories": [
            "AGR-CROP", "AGR-WATER", "AGR-IRRIGATION", "AGR-PRICE",
            "AGR-PROCUREMENT", "AGR-COMPENSATION", "AGR-DROUGHT", "AGR-FLOOD", "AGR-FARMER_PROTEST"
        ],
        "keywords": [
            # 43. Farmer / Rural Flashpoints
            "விவசாயம்", "விவசாயி", "விவசாயிகள்", "விவசாயிகள் போராட்டம்", "விவசாயிகள் பிரச்சனை", "விவசாயிகள் கோரிக்கை",
            "விவசாயிகள் எதிர்ப்பு", "விவசாயி புகார்", "விவசாய நிலம்", "பாசன பிரச்சனை", "பாசன நீர்", "தண்ணீர் பிரச்சனை",
            "விவசாய மின்சாரம்", "மின்சார இணைப்பு", "பயிர் சேதம்", "பயிர் நஷ்டம்", "வறட்சி", "வெள்ளம்", "விவசாய கடன்",
            "கடன் தள்ளுபடி", "கொள்முதல்", "நெல் கொள்முதல்", "விலை பிரச்சனை", "பயிர்", "விளைச்சல்", "மழை", "பாசனம்",
            "நீர்", "விதை", "உரம்", "பூச்சி", "நஷ்டஈடு", "விவசாய போராட்டம்", "மேட்டூர் அணை",
            "agriculture", "farmers protest", "crop loss", "irrigation water", "drought", "paddy procurement", "msp"
        ]
    },
    "FIS": {
        "subcategories": [
            "FIS-SAFETY", "FIS-LIVELIHOOD", "FIS-FISHING_BAN", "FIS-BOAT",
            "FIS-ARREST", "FIS-COASTAL", "FIS-COMPENSATION"
        ],
        "keywords": [
            # 44. Fishermen Issues
            "மீனவர்", "மீனவர்கள்", "மீனவர்கள் பிரச்சனை", "மீனவர் போராட்டம்", "மீனவர் கைது", "மீனவர் கோரிக்கை",
            "மீன்பிடி தடை", "மீன்பிடி பிரச்சனை", "மீனவர் நலன்", "மீனவர் நிவாரணம்", "படகு பறிமுதல்", "மீன்பிடி படகு",
            "கடலில் மாயம்", "கடலில் காணவில்லை", "மீன்பிடி", "கடல்", "படகு", "கடல் எல்லை", "இலங்கை கடற்படை",
            "fishermen", "fishermen protest", "fishermen arrest", "sri lankan navy", "fishing ban", "boat seizure"
        ]
    },
    "EMP": {
        "subcategories": [
            "EMP-JOBS", "EMP-RECRUITMENT", "EMP-UNEMPLOYMENT", "EMP-WAGES",
            "EMP-CONTRACT", "EMP-LABOUR_PROTEST", "EMP-SKILL"
        ],
        "keywords": [
            "வேலைவாய்ப்பு", "வேலையின்மை", "வேலை", "வேலைவாய்ப்பு முகாம்", "அரசு வேலை", "நியமனம்",
            "ஆட்சேர்ப்பு", "ஒப்பந்த ஊழியர்", "தொழிலாளர்", "தொழிலாளர்கள்", "தொழிலாளர் போராட்டம்",
            "தொழிலாளர் பிரச்சனை", "சம்பளம்", "ஊதியம்", "ஊதிய நிலுவை", "TNPSC", "டிஎன்பிஎஸ்சி",
            "வேலை இல்லா இளைஞர்கள்", "பணி நிரந்தரம்", "வேலைநிறுத்தம்",
            "employment", "unemployment", "jobs", "recruitment", "contract workers", "labour protest", "strike"
        ]
    },
    "INF": {
        "subcategories": [
            "INF-01: Roads", "INF-02: Transport", "INF-03: Water Shortage",
            "INF-04: Electricity", "INF-05: Drainage", "INF-06: Public Construction"
        ],
        "keywords": [
            # 5. Government Failure & 16/17 Infrastructure
            "அடிப்படை வசதி", "சாலை", "சாலை பிரச்சனை", "சாலை சேதம்", "குண்டும் குழியுமான சாலை", "குண்டும் குழியும்",
            "சாலை அமைப்பு", "சாலை பணி", "பாலம்", "மேம்பாலம்", "ரயில்வே", "மெட்ரோ", "பேருந்து நிலையம்", "மருத்துவமனை",
            "பேருந்து", "ரயில்", "போக்குவரத்து", "பேருந்து சேவை", "பேருந்து பிரச்சனை", "போக்குவரத்து பிரச்சனை",
            "குடிநீர்", "குடிநீர் பிரச்சனை", "தண்ணீர் பிரச்சனை", "நீர் பற்றாக்குறை", "குடிநீர் தட்டுப்பாடு", "குடிநீர் திட்டம்",
            "நீர்த்தேக்கம்", "கால்வாய்", "வடிகால்", "மழைநீர் வடிகால்", "மழைநீர் தேக்கம்", "வெள்ளம்", "கழிவுநீர்",
            "சாக்கடை", "குப்பை", "குப்பை தேக்கம்", "சுகாதார சீர்கேடு", "மின்சாரம்", "மின்சார பிரச்சனை", "மின்வெட்டு",
            "மின்தடை", "மின் கம்பம்", "மின்சார இணைப்பு", "கட்டிடம்", "திட்டப்பணி", "கட்டுமானம்", "நகர்ப்புற வளர்ச்சி",
            "infrastructure", "damaged road", "potholes", "bus service", "drinking water shortage", "power cut",
            "load shedding", "drainage", "waterlogging", "flyover"
        ]
    },
    "ENV": {
        "subcategories": [
            "ENV-AIR", "ENV-WATER", "ENV-WASTE", "ENV-FOREST",
            "ENV-WILDLIFE", "ENV-MINING", "ENV-ENCROACHMENT", "ENV-INDUSTRIAL"
        ],
        "keywords": [
            # 45. Environment & 46. Land Encroachment
            "சுற்றுச்சூழல்", "சுற்றுச்சூழல் பாதிப்பு", "சுற்றுச்சூழல் பிரச்சனை", "மாசு", "காற்று மாசு", "நீர் மாசு",
            "நில மாசு", "கழிவு", "தொழிற்சாலை மாசு", "தொழிற்சாலைக்கு எதிர்ப்பு", "தொழிற்சாலை எதிர்ப்பு",
            "மணல் கொள்ளை", "மணல் கடத்தல்", "கனிம கொள்ளை", "குவாரி", "குவாரி எதிர்ப்பு", "மரங்கள் வெட்டுதல்",
            "வனப்பகுதி பிரச்சனை", "குப்பை", "குப்பை தேக்கம்", "வனப்பகுதி", "வனவிலங்கு", "சுரங்கம்", "மணல்", "கல் குவாரி",
            "நில அபகரிப்பு", "நில ஆக்கிரமிப்பு", "ஆக்கிரமிப்பு", "அரசு நில ஆக்கிரமிப்பு", "நீர்நிலை ஆக்கிரமிப்பு",
            "ஏரி ஆக்கிரமிப்பு", "குளம் ஆக்கிரமிப்பு", "கால்வாய் ஆக்கிரமிப்பு", "புறம்போக்கு நிலம்", "பட்டா மோசடி",
            "போலி பட்டா", "நில மோசடி", "நிலப்பிரச்சனை", "நில பிரச்சனை",
            "environment", "pollution", "sand smuggling", "illegal quarry", "encroachment", "lake encroachment", "land grab"
        ]
    },
    "WEL": {
        "subcategories": [
            "WEL-PENSION", "WEL-RATION", "WEL-DISABILITY", "WEL-WOMEN",
            "WEL-SENIOR", "WEL-FINANCIAL_ASSISTANCE", "WEL-HOUSING", "WEL-SOCIAL_SECURITY"
        ],
        "keywords": [
            # 16. Welfare Schemes
            "நலத்திட்டம்", "அரசுத் திட்டம்", "திட்டம்", "நிதியுதவி", "உதவித்தொகை", "இலவசம்", "மானியம்",
            "பயனாளிகள்", "பயனாளிகளுக்கு", "மகளிர் திட்டம்", "பெண்கள் நலத்திட்டம்", "மாணவர் நலத்திட்டம்",
            "விவசாயிகள் நலத்திட்டம்", "தொழிலாளர் நலத்திட்டம்", "முதியோர் நலத்திட்டம்", "வீட்டு வசதி", "வீடு வழங்கல்",
            "பட்டா வழங்கல்", "பட்டா பிரச்சனை", "நிவாரணம்", "நிவாரண நிதி", "ஓய்வூதியம்", "ரேஷன்", "ரேஷன் கடை",
            "ரேஷன் பொருள்", "இலவச திட்டம்", "அரசு உதவி", "சமூக பாதுகாப்பு", "முதியோர் உதவி", "மாற்றுத்திறனாளி உதவி",
            "நலத்திட்டம் கிடைக்கவில்லை", "மகளிர் உரிமை", "மகளிர் உரிமை தொகை", "புதுமைப் பெண்",
            "welfare scheme", "financial aid", "pension", "ration shop", "housing", "patta", "subsidy"
        ]
    },
    "SOC": {
        "subcategories": [
            "SOC-CONFLICT", "SOC-DISCRIMINATION", "SOC-ACCESS",
            "SOC-RELIGIOUS_SITE", "SOC-SOCIAL_JUSTICE", "SOC-COMMUNITY_PROTEST"
        ],
        "keywords": [
            # 18. Social Flashpoints, 41. Caste & 42. Legal Signals
            "சாதி மோதல்", "சமூக மோதல்", "சமூக பிரச்சனை", "சமூக பதற்றம்", "மத மோதல்", "மத பதற்றம்", "சமூக நீதி",
            "தீண்டாமை", "பாகுபாடு", "சாதி பிரச்சனை", "சாதி வன்முறை", "சாதி பாகுபாடு", "சாதி அடிப்படையிலான தாக்குதல்",
            "சாதி அவமதிப்பு", "தீண்டாமை புகார்", "சமூக வன்முறை", "சமூக பாகுபாடு", "கிராமத்தில் பதற்றம்",
            "இரு தரப்பினர் மோதல்", "இரு சமூகத்தினர் மோதல்", "கோவில் பிரச்சனை", "வழிபாட்டு உரிமை", "SC/ST Act",
            "SC ST Act", "வன்கொடுமை தடுப்பு சட்டம்", "வன்கொடுமை வழக்கு", "தாழ்த்தப்பட்டோர் மீது தாக்குதல்",
            "தலித் மீது தாக்குதல்", "தலித் உரிமை", "சமத்துவம்",
            "caste clash", "communal tension", "untouchability", "sc st act", "social justice", "temple entry"
        ]
    },
    "YTH": {
        "subcategories": [
            "YTH-EMPLOYMENT", "YTH-EDUCATION", "YTH-PROTEST", "YTH-SPORTS", "YTH-SKILL", "YTH-WELFARE"
        ],
        "keywords": [
            # 40. Youth / Students
            "மாணவர் பிரச்சனை", "மாணவர்கள் போராட்டம்", "மாணவர் போராட்டம்", "மாணவர் எதிர்ப்பு", "மாணவர் புகார்",
            "மாணவி புகார்", "மாணவர்கள் மீது தாக்குதல்", "மாணவி மீது தாக்குதல்", "கல்லூரி பிரச்சனை",
            "கல்லூரி மாணவர்கள்", "பள்ளி மாணவர்கள்", "பள்ளி மாணவி", "பள்ளி மாணவன்", "கல்வி கட்டணம்",
            "கல்வி வசதி", "பள்ளி பாதுகாப்பு", "கல்லூரி பாதுகாப்பு", "தேர்வு பிரச்சனை", "வேலை இல்லா இளைஞர்கள்",
            "இளைஞர் போராட்டம்", "இளைஞர்கள்", "இளைஞர் பிரச்சனை", "விளையாட்டு", "திறன் மேம்பாடு", "இளைஞர் நலன்",
            "youth", "students protest", "unemployed youth", "college protest"
        ]
    },
    "DIG": {
        "subcategories": [
            "DIG-01: Viral Video/Post",
            "DIG-02: Social Media Statement",
            "DIG-03: Misinformation / Rumour",
            "DIG-04: Fact Check",
            "DIG-05: Digital Controversy"
        ],
        "keywords": [
            # 22. Social Media Signals
            "வைரல்", "சமூக வலைதளம்", "சமூக ஊடகம்", "X", "Twitter", "Facebook", "Instagram", "YouTube",
            "வீடியோ வைரல்", "பதிவு வைரல்", "பதிவு", "பதிலடி பதிவு", "ட்வீட்", "பதிவிட்டார்", "வீடியோ வெளியிட்டார்",
            "வைரலான வீடியோ", "வைரல் பதிவு", "போலி செய்தி", "போலி தகவல்", "வதந்தி", "தவறான தகவல்",
            "உண்மை சரிபார்ப்பு", "Fact check", "மறுப்பு", "தவறானது", "சர்ச்சைக்குரிய பதிவு", "சர்ச்சை வீடியோ", "பதிவு நீக்கம்",
            "viral video", "tweet", "social media", "fake news", "rumour", "fact check"
        ]
    },
    "JUS": {
        "subcategories": [
            "JUS-HIGH_COURT", "JUS-SUPREME_COURT", "JUS-ORDER", "JUS-VERDICT",
            "JUS-PETITION", "JUS-BAIL", "JUS-STAY", "JUS-INVESTIGATION"
        ],
        "keywords": [
            "நீதிமன்றம்", "உயர்நீதிமன்றம்", "உச்சநீதிமன்றம்", "சென்னை உயர்நீதிமன்றம்", "மதுரை கிளை",
            "நீதிமன்ற உத்தரவு", "நீதிமன்ற விசாரணை", "தீர்ப்பு", "தண்டனை", "விடுதலை", "ஜாமீன்",
            "முன்ஜாமீன்", "சிறை", "வழக்கு", "மனு", "பொதுநல வழக்கு", "PIL", "உத்தரவு", "தடை",
            "இடைக்கால தடை", "விசாரணை", "குற்றவியல் வழக்கு", "விசாரணை ஆணையம்", "வழக்கு பதிவு",
            "high court", "supreme court", "court order", "bail", "stay order", "pil", "verdict"
        ]
    },
    "PUB": {
        "subcategories": [
            "PUB-WATER", "PUB-ROAD", "PUB-DRAINAGE", "PUB-ELECTRICITY",
            "PUB-SANITATION", "PUB-TRANSPORT", "PUB-REVENUE", "PUB-LAND", "PUB-CIVIC_SERVICE", "PUB-LOCAL_BODY"
        ],
        "keywords": [
            # 4. Negative, 7. Protest & 20. Ground Signals
            "பொதுமக்கள் புகார்", "பொதுமக்கள் கோரிக்கை", "மக்கள் பிரச்சனை", "மக்கள் குறை", "குறைதீர்",
            "குறைதீர்க்கும் கூட்டம்", "மனு அளித்தனர்", "கோரிக்கை", "கோரிக்கை நிறைவேற்ற", "நடவடிக்கை கோரி",
            "மக்கள் குற்றச்சாட்டு", "மக்கள் புகார்", "மக்கள் கோரிக்கை", "மக்கள் எதிர்ப்பு", "பொதுமக்கள் எதிர்ப்பு",
            "கிராம மக்கள்", "பொதுமக்கள்", "குடியிருப்போர்", "வியாபாரிகள்", "போராட்டம்", "ஆர்ப்பாட்டம்",
            "மறியல்", "சாலை மறியல்", "முற்றுகை", "உண்ணாவிரதம்", "தர்ணா", "கண்டன ஆர்ப்பாட்டம்", "கண்டன போராட்டம்",
            "மக்கள் போராட்டம்", "பொதுமக்கள் போராட்டம்", "கிராம மக்கள் போராட்டம்", "பெண்கள் போராட்டம்",
            "விவசாயிகள் போராட்டம்", "மாணவர்கள் போராட்டம்", "தொழிலாளர்கள் போராட்டம்", "அரசு அலுவலகம் முற்றுகை",
            "ஆட்சியர் அலுவலகம் முற்றுகை", "புறக்கணிப்பு", "வாக்குவாதம்", "மோதல்", "குழப்பம்", "பரபரப்பு",
            "மக்கள் அதிருப்தி", "அதிருப்தி", "பொதுமக்கள் அச்சம்", "மக்கள் அச்சம்", "பகுதியில் பதற்றம்",
            "பதற்றமான சூழல்", "அசம்பாவிதம்", "அசம்பாவித சம்பவம்", "விபத்து", "சாலை விபத்து", "தீ விபத்து",
            "கட்டிடம் இடிந்து", "கட்டிட விபத்து", "மின்சாரம் தாக்கி", "நீரில் மூழ்கி",
            "public protest", "road roko", "road blockade", "dharna", "hunger strike", "collectorate siege",
            "public grievance", "petition"
        ]
    }
}

# 3. Comprehensive Combination Triggers
COMBINATION_RULES: List[Dict[str, Any]] = [
    # Women & Children Flashpoints
    {"terms": ["பெண்", "கொலை"], "category": "WOM", "subcategory": "WOM-01", "severity": "High", "claim_status": "REPORTED"},
    {"terms": ["பெண்", "பாலியல்"], "category": "WOM", "subcategory": "WOM-02", "severity": "High", "claim_status": "REPORTED"},
    {"terms": ["பெண்", "தாக்குதல்"], "category": "WOM", "subcategory": "WOM-01", "severity": "High", "claim_status": "REPORTED"},
    {"terms": ["வரதட்சணை", "கொடுமை"], "category": "WOM", "subcategory": "WOM-04", "severity": "High", "claim_status": "REPORTED"},
    {"terms": ["போக்சோ", "கைது"], "category": "CHI", "subcategory": "CHI-02", "severity": "High", "claim_status": "OFFICIAL"},
    {"terms": ["போக்சோ", "வழக்கு"], "category": "CHI", "subcategory": "CHI-02", "severity": "High", "claim_status": "OFFICIAL"},
    {"terms": ["குழந்தை", "கடத்தல்"], "category": "CHI", "subcategory": "CHI-03", "severity": "High", "claim_status": "REPORTED"},
    {"terms": ["சிறுமி", "பாலியல்"], "category": "CHI", "subcategory": "CHI-02", "severity": "High", "claim_status": "REPORTED"},
    {"terms": ["சிறுமி", "மாயம்"], "category": "CHI", "subcategory": "CHI-03", "severity": "High", "claim_status": "REPORTED"},
    {"terms": ["குழந்தை", "கொலை"], "category": "CHI", "subcategory": "CHI-01", "severity": "High", "claim_status": "REPORTED"},

    # Corruption & Governance Allegations
    {"terms": ["ஊழல்", "குற்றச்சாட்டு"], "category": "COR", "subcategory": "COR-01", "severity": "High", "claim_status": "ALLEGATION"},
    {"terms": ["லஞ்சம்", "கைது"], "category": "COR", "subcategory": "COR-02", "severity": "High", "claim_status": "OFFICIAL"},
    {"terms": ["டெண்டர்", "முறைகேடு"], "category": "COR", "subcategory": "COR-04", "severity": "High", "claim_status": "ALLEGATION"},
    {"terms": ["அமலாக்கத்துறை", "சோதனை"], "category": "COR", "subcategory": "COR-05", "severity": "High", "claim_status": "OFFICIAL"},
    {"terms": ["லஞ்ச ஒழிப்புத்துறை", "ரெய்டு"], "category": "COR", "subcategory": "COR-05", "severity": "High", "claim_status": "OFFICIAL"},

    # Civic & Ground Protests
    {"terms": ["குடிநீர்", "சாலை மறியல்"], "category": "PUB", "subcategory": "PUB-WATER", "severity": "Medium", "claim_status": "REPORTED"},
    {"terms": ["குடிநீர்", "போராட்டம்"], "category": "PUB", "subcategory": "PUB-WATER", "severity": "Medium", "claim_status": "REPORTED"},
    {"terms": ["மின்வெட்டு", "சாலை மறியல்"], "category": "INF", "subcategory": "INF-04", "severity": "Medium", "claim_status": "REPORTED"},
    {"terms": ["ஆட்சியர் அலுவலகம்", "முற்றுகை"], "category": "PUB", "subcategory": "PUB-CIVIC_SERVICE", "severity": "High", "claim_status": "REPORTED"},
    {"terms": ["பள்ளி", "பூட்டு"], "category": "EDU", "subcategory": "EDU-PROTEST", "severity": "Medium", "claim_status": "REPORTED"},
    {"terms": ["நெல்", "கொள்முதல்"], "category": "AGR", "subcategory": "AGR-PROCUREMENT", "severity": "Medium", "claim_status": "REPORTED"},

    # Law & Order / Crime
    {"terms": ["கஞ்சா", "பறிமுதல்"], "category": "LOR", "subcategory": "LOR-05", "severity": "Medium", "claim_status": "OFFICIAL"},
    {"terms": ["காவல் மரணம்"], "category": "LOR", "subcategory": "LOR-08", "severity": "High", "claim_status": "ALLEGATION"},
    {"terms": ["போலீஸ்", "தாக்குதல்"], "category": "LOR", "subcategory": "LOR-08", "severity": "High", "claim_status": "REPORTED"},

    # Caste / Social Tension
    {"terms": ["சாதி", "மோதல்"], "category": "SOC", "subcategory": "SOC-CONFLICT", "severity": "High", "claim_status": "REPORTED"},
    {"terms": ["வன்கொடுமை", "வழக்கு"], "category": "SOC", "subcategory": "SOC-DISCRIMINATION", "severity": "High", "claim_status": "OFFICIAL"},

    # Political Internal Strife
    {"terms": ["கட்சி", "கோஷ்டி மோதல்"], "category": "POL", "subcategory": "POL-04", "severity": "Medium", "claim_status": "REPORTED"},
    {"terms": ["மாவட்ட செயலாளர்", "எதிர்ப்பு"], "category": "POL", "subcategory": "POL-04", "severity": "Medium", "claim_status": "REPORTED"},
    {"terms": ["கூண்டோடு", "ராஜினாமா"], "category": "POL", "subcategory": "POL-05", "severity": "High", "claim_status": "REPORTED"},
]

def analyze_incident_taxonomy(title: str, summary: str = "") -> Dict[str, Any]:
    """
    Evaluates news text against FonsOS Master 20-Category Taxonomy and combination rules.
    Outputs structured intelligence metadata matching existing production schema.
    """
    text = f"{title} {summary}".strip()
    text_lower = text.lower()
    
    detected_categories: List[str] = []
    detected_subcategories: List[str] = []
    severity = "Low"
    claim_status = "REPORTED"
    fons_score = 30
    
    # 1. Combination Rules Matching (High-Precision Context)
    for rule in COMBINATION_RULES:
        if all(term.lower() in text_lower for term in rule["terms"]):
            cat = rule["category"]
            subcat = rule["subcategory"]
            if cat not in detected_categories:
                detected_categories.append(cat)
            if subcat not in detected_subcategories:
                detected_subcategories.append(subcat)
            severity = rule["severity"]
            claim_status = rule["claim_status"]
            fons_score = max(fons_score, 80 if severity == "High" else 55)

    # 2. General Taxonomy Keywords Matching
    for cat_code, cat_data in TAXONOMY_KEYWORDS.items():
        for kw in cat_data["keywords"]:
            if kw.lower() in text_lower:
                if cat_code not in detected_categories:
                    detected_categories.append(cat_code)
                break

    # Fallback to PUB if uncategorized
    if not detected_categories:
        detected_categories.append("PUB")
        detected_subcategories.append("PUB-CIVIC_SERVICE")

    primary_category = detected_categories[0]
    primary_subcategory = detected_subcategories[0] if detected_subcategories else f"{primary_category}-GENERAL"
    
    # 3. Claim Status Extraction
    if any(k in text_lower for k in ["குற்றச்சாட்டு", "புகார்", " alleged", "allegation", "மோசடி புகார்"]):
        claim_status = "ALLEGATION"
    elif any(k in text_lower for k in ["கைது", "வழக்குப்பதிவு", "fir", "அரசாணை", "தீர்ப்பு", "உத்தரவு"]):
        claim_status = "OFFICIAL"
    elif any(k in text_lower for k in ["விசாரணை", "சோதனை", "ரெய்டு"]):
        claim_status = "UNDER_INVESTIGATION"

    # 4. Dimension Scores (0 - 100)
    political_relevance = 90 if primary_category in ["POL", "ELE", "COR"] else (65 if "அரசு" in text_lower else 35)
    governance_impact = 85 if primary_category in ["GOV", "INF", "PUB", "HEA", "EDU", "WEL"] else 40
    ground_intensity = 85 if any(k in text_lower for k in ["போராட்டம்", "மறியல்", "முற்றுகை", "சாலை மறியல்", "மோதல்", "தாக்குதல்"]) else 30
    
    # Adjust FONS severity based on ground flashpoint signals
    if ground_intensity >= 80 or primary_category in ["WOM", "CHI", "COR"] and severity != "High":
        if "பாலியல்" in text_lower or "கொலை" in text_lower or "முறைகேடு" in text_lower or "போக்சோ" in text_lower:
            severity = "High"
            fons_score = max(fons_score, 85)
        else:
            severity = "Medium"
            fons_score = max(fons_score, 60)

    return {
        "primary_category": primary_category,
        "category_name": MASTER_CATEGORIES.get(primary_category, "General"),
        "subcategory": primary_subcategory,
        "all_categories": detected_categories,
        "severity": severity,
        "claim_status": claim_status,
        "fons_score": fons_score,
        "intelligence_scores": {
            "political_relevance": political_relevance,
            "governance_impact": governance_impact,
            "ground_intensity": ground_intensity
        }
    }