import os
import re
import json
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

def load_table_safely(file_path):
    if not os.path.exists(file_path):
        return None
    try:
        tables = pd.read_html(file_path)
        if tables:
            return tables[0]
    except Exception:
        pass
    try:
        return pd.read_excel(file_path, engine='openpyxl')
    except Exception:
        pass
    try:
        return pd.read_excel(file_path, engine='xlrd')
    except Exception:
        pass
    try:
        return pd.read_csv(file_path, sep=None, engine='python')
    except Exception:
        pass
    return None

def is_tamil_token_match(target_token: str, full_text: str) -> bool:
    """
    Ensures Tamil words match as whole words/prefixes and not arbitrary substrings.
    e.g. 'கம்பம்' will NOT match inside 'கம்பு காட்டில்'.
    """
    if not target_token or len(target_token) < 3:
        return False
    # Pattern ensures token is bounded by spaces, start/end, or punctuation
    pattern = r'(?:^|[\s\.,;:\'\"\!\?\(\)\[\]\-])' + re.escape(target_token)
    return bool(re.search(pattern, full_text))


class GeoHierarchyResolver:
    """
    Bilingual Geo-Hierarchy Resolver for FonsOS.
    Bridges 234 Assembly Constituencies, 29,200+ Rural Habitations,
    and Dynamic Urban Local Bodies with strict boundary guards and cross-district sanity.
    """
    def __init__(self):
        print("⚡ Initializing FonsOS Comprehensive Bilingual Geo-Hierarchy Engine...")
        self.ac_bilingual_map = {}
        self.ac_to_district = {}      # AC Name -> English District
        self.vp_en_to_ac = {}
        self.block_en_to_ac = {}
        self.hab_to_ac = {}
        self.ulb_to_ac = {}          # (district, name) -> AC Name
        self.dist_en_to_ta = {}
        self.dist_ta_to_en = {}
        self.all_constituencies = set()
        
        self.load_reference_data()

    def clean_key(self, text: str) -> str:
        if not text or pd.isna(text):
            return ""
        cleaned = str(text).replace('_x000D_', ' ')
        cleaned = re.sub(r'[\r\n\t\(\)\[\]_]+', ' ', cleaned).strip()
        cleaned = re.sub(r'\s+', ' ', cleaned)
        return cleaned.upper()

    def clean_ta(self, text: str) -> str:
        if not text or pd.isna(text):
            return ""
        cleaned = str(text).replace('_x000D_', ' ')
        cleaned = re.sub(r'[\r\n\t\(\)\[\]_]+', ' ', cleaned).strip()
        return re.sub(r'\s+', ' ', cleaned)

    def get_root_words(self, word: str):
        variants = [word]
        if not word or len(word) < 4:
            return variants
        
        # 'ம்' is 2 unicode codepoints: 'ம' (U+0BAE) + '்' (U+0BCD)
        if word.endswith('ம்') and len(word) > 4:
            root = word[:-2]
            if len(root) >= 4:
                variants.append(root)
        elif word.endswith('புரம்') and len(word) > 5:
            root = word[:-2]
            if len(root) >= 4:
                variants.append(root)

        return list(set(variants))

    def load_reference_data(self):
        # 1. AC Bilingual Master (Assembly Constituency Name.xlsx)
        ac_name_path = os.path.join(DATA_DIR, 'Assembly Constituency Name.xlsx')
        if os.path.exists(ac_name_path):
            try:
                df_ac = pd.read_excel(ac_name_path)
                df_ac.columns = [c.strip() for c in df_ac.columns]
                col_en, col_ta = df_ac.columns[0], df_ac.columns[1]
                for _, row in df_ac.iloc[1:].iterrows():
                    en_name = str(row[col_en]).strip()
                    ta_name = str(row[col_ta]).strip()
                    if en_name and ta_name and en_name != 'nan':
                        # Spelling normalization for Viluppuram
                        if en_name.upper() == 'VILUPPURAM':
                            self.ac_bilingual_map['VILLUPURAM'] = (en_name, ta_name)
                        self.ac_bilingual_map[en_name.upper()] = (en_name, ta_name)
                        self.ac_bilingual_map[ta_name] = (en_name, ta_name)
                        self.all_constituencies.add(en_name)
                print(f"✅ Loaded AC Bilingual Name mapping ({len(self.all_constituencies)} constituencies)")
            except Exception as e:
                print(f"⚠️ Error loading AC Name master: {e}")

        # 2. District Bilingual Bridge (district_tamil.xls)
        dist_path = os.path.join(DATA_DIR, 'district_tamil.xls')
        df_dist = load_table_safely(dist_path)
        if df_dist is not None and not df_dist.empty:
            df_dist.columns = [str(c).strip() for c in df_dist.columns]
            col_en, col_ta = df_dist.columns[0], df_dist.columns[1]
            for _, r in df_dist.iterrows():
                d_en = self.clean_key(r[col_en])
                d_ta = self.clean_ta(r[col_ta])
                if d_en and d_ta:
                    self.dist_en_to_ta[d_en] = d_ta
                    self.dist_ta_to_en[d_ta] = d_en
            # Common spelling normalizations
            self.dist_en_to_ta['VILLUPURAM'] = 'விழுப்புரம்'
            self.dist_ta_to_en['விழுப்புரம்'] = 'VILUPPURAM'
            print(f"✅ Loaded District Bilingual Bridge ({len(self.dist_en_to_ta)} districts)")

        # 3. Dynamic Urban Local Bodies Master (Municipalities, TPs & GH Landmarks)
        ulb_file = os.path.join(DATA_DIR, 'urban_local_bodies.json')
        if os.path.exists(ulb_file):
            try:
                with open(ulb_file, 'r', encoding='utf-8') as f:
                    ulb_data = json.load(f)
                for item in ulb_data:
                    dist_raw = item.get('district', '')
                    dist_clean = self.clean_key(dist_raw)
                    ac = item.get('ac_name', '')
                    name_en = self.clean_key(item.get('name_en', ''))
                    name_ta = self.clean_ta(item.get('name_ta', ''))

                    dist_ta = self.dist_en_to_ta.get(dist_clean, dist_clean)
                    self.ac_to_district[ac.upper()] = dist_clean

                    for d in {dist_clean, dist_ta, dist_raw}:
                        if name_ta:
                            self.ulb_to_ac[(d, name_ta)] = ac
                        if name_en:
                            self.ulb_to_ac[(d, name_en)] = ac

                print(f"✅ Loaded {len(ulb_data)} Statutory Urban Local Bodies (Municipalities & Town Panchayats)")
            except Exception as e:
                print(f"⚠️ Error loading ULB JSON: {e}")

        # 4. Rural AC to Village Panchayat & Block (English Catalog)
        rural_path = os.path.join(DATA_DIR, 'List of Rural Assembly Constituency in Village Panchayats.xlsx')
        if os.path.exists(rural_path):
            try:
                df_rural = pd.read_excel(rural_path)
                df_rural.columns = [c.strip() for c in df_rural.columns]
                for _, row in df_rural.iterrows():
                    dist = self.clean_key(row.get('DISTRICT', ''))
                    blk = self.clean_key(row.get('BLOCK PANCHAYAT', ''))
                    vp = self.clean_key(row.get('VILLAGE PANCHAYAT', ''))
                    ac = str(row.get('ASSEMBLY CONSTITUENY NAME', '')).strip()

                    if ac:
                        self.ac_to_district[ac.upper()] = dist

                    if dist and vp and ac:
                        self.vp_en_to_ac[(dist, vp)] = ac
                    if dist and blk and ac:
                        self.block_en_to_ac[(dist, blk)] = ac
                print(f"✅ Indexed {len(self.vp_en_to_ac)} English Village Panchayats & {len(self.block_en_to_ac)} Blocks")
            except Exception as e:
                print(f"⚠️ Error loading Rural AC mapping: {e}")

        # 5. Tamil Habitations Micro-Master (79,396 records)
        hab_path = os.path.join(DATA_DIR, 'dist_blk_vill_hab_tamil_new.xlsx')
        if os.path.exists(hab_path):
            try:
                df_hab = pd.read_excel(hab_path)
                df_hab.columns = [str(c).strip() for c in df_hab.columns]
                
                hab_count = 0
                for _, row in df_hab.iterrows():
                    dist_ta = self.clean_ta(row.get('district name', ''))
                    blk_ta = self.clean_ta(row.get('block name', ''))
                    hab_ta = self.clean_ta(row.get('habitation name', ''))
                    vp_ta = self.clean_ta(row.get('Village vname', ''))

                    dist_en = self.dist_ta_to_en.get(dist_ta, self.clean_key(dist_ta))

                    matched_ac = None
                    for (d_e, b_e), ac in self.block_en_to_ac.items():
                        if d_e == dist_en and (b_e in self.clean_key(blk_ta) or self.clean_key(blk_ta) in b_e):
                            matched_ac = ac
                            break

                    if not matched_ac and blk_ta in self.ac_bilingual_map:
                        matched_ac = self.ac_bilingual_map[blk_ta][0]

                    if matched_ac:
                        if hab_ta and len(hab_ta) >= 4:
                            self.hab_to_ac[(dist_ta, hab_ta)] = matched_ac
                            hab_count += 1
                        if vp_ta and len(vp_ta) >= 4 and (dist_ta, vp_ta) not in self.hab_to_ac:
                            self.hab_to_ac[(dist_ta, vp_ta)] = matched_ac

                print(f"✅ Indexed {hab_count} Tamil Habitations directly to Assembly Constituencies")
            except Exception as e:
                print(f"ℹ️ Tamil Habitation indexing notice: {e}")

    def is_district_compatible(self, candidate_ac: str, district_context: str) -> bool:
        """Sanity check: ensure candidate AC actually belongs to or is compatible with incident district."""
        if not district_context or district_context in ['Tamil Nadu', 'Tamil Nadu (General)']:
            return True
        dist_key = self.clean_key(district_context)
        ac_dist = self.ac_to_district.get(candidate_ac.upper())
        if not ac_dist:
            return True
        return (ac_dist == dist_key) or (dist_key in ac_dist) or (ac_dist in dist_key)

    def resolve_from_raw_text(self, text: str, district_context=None):
        if not text:
            return None

        clean = re.sub(r'[\r\n\t]+', ' ', str(text)).strip()
        dist_key = self.clean_key(district_context)
        dist_ta = self.dist_en_to_ta.get(dist_key, dist_key)

        # Tier 0: Urban Local Bodies & Landmarks (Requires district compatibility)
        if district_context:
            target_dists = {dist_key, dist_ta, str(district_context).strip()}
            for (d, town_name), ac_name in self.ulb_to_ac.items():
                if d in target_dists and len(town_name) >= 3:
                    roots = self.get_root_words(town_name)
                    matched = any(is_tamil_token_match(r, clean) for r in roots)
                    if not matched and town_name.isupper():
                        matched = bool(re.search(r'\b' + re.escape(town_name) + r'\b', clean, re.IGNORECASE))
                    
                    if matched and self.is_district_compatible(ac_name, district_context):
                        return {"status": "URBAN_LOCAL_BODY_MATCH", "constituency": ac_name, "confidence": 0.95}

        # Tier 1: Direct AC Name Check (Strict boundary & district sanity)
        for key, (en_name, ta_name) in self.ac_bilingual_map.items():
            # Check Tamil AC Name as whole word token
            if len(ta_name) >= 4 and is_tamil_token_match(ta_name, clean):
                if self.is_district_compatible(en_name, district_context):
                    return {"status": "DIRECT_TAMIL_AC", "constituency": en_name, "confidence": 1.0}
            # Check English AC Name as whole word
            if len(en_name) >= 4 and re.search(r'\b' + re.escape(en_name) + r'\b', clean, re.IGNORECASE):
                if self.is_district_compatible(en_name, district_context):
                    return {"status": "DIRECT_ENGLISH_AC", "constituency": en_name, "confidence": 1.0}

        # Tier 2: Micro Tamil Habitation / Village Lookup
        if dist_ta:
            for (d, hab), ac_name in self.hab_to_ac.items():
                if d == dist_ta and len(hab) >= 4:
                    if is_tamil_token_match(hab, clean):
                        if self.is_district_compatible(ac_name, district_context):
                            return {"status": "HABITATION_MATCH", "constituency": ac_name, "confidence": 0.92}

        # Tier 3: English Village Panchayat Lookup
        if dist_key:
            for (d, vp), ac_name in self.vp_en_to_ac.items():
                if d == dist_key and len(vp) >= 4:
                    if re.search(r'\b' + re.escape(vp) + r'\b', clean, re.IGNORECASE):
                        if self.is_district_compatible(ac_name, district_context):
                            return {"status": "VILLAGE_MATCH", "constituency": ac_name, "confidence": 0.90}

        return None


resolver = GeoHierarchyResolver()

def resolve_constituency(district=None, raw_text=None):
    return resolver.resolve_from_raw_text(raw_text, district_context=district)