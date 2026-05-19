#!/usr/bin/env python3
"""
Kyn Skyn — Dermatologist & Derm NP Prospector

Finds and scores dermatology providers across the US for async skin
consultation partnerships (fungal acne, seb derm, tinea versicolor).

Phases:
  1. NPI Registry pull (free public API, no key needed)
  2. Google enrichment (web presence, social, fungal mentions)
  3. Scoring & prioritization
  4. Excel output (multi-sheet)
  5. Email/DM finder for top targets
"""

import requests
import pandas as pd
import time
import json
import random
import re
import os
import sys
from datetime import datetime, date

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------

NPI_API = "https://npiregistry.cms.hhs.gov/api/?version=2.1"

TAXONOMY_SEARCHES = [
    "Dermatology",
]

# Priority states — large Black/brown populations and big markets
PRIORITY_STATES = [
    "GA", "TX", "FL", "NY", "CA", "IL", "MD", "NC", "VA", "NJ",
    "PA", "OH", "MI", "LA", "SC", "DC",
]

# All US states + DC for full coverage
ALL_STATES = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL",
    "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME",
    "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH",
    "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI",
    "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI",
    "WY",
]

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
]

FUNGAL_KEYWORDS = [
    "fungal acne", "malassezia", "seborrheic dermatitis", "seb derm",
    "tinea versicolor", "pityriasis versicolor", "pityrosporum folliculitis",
    "malassezia folliculitis", "dandruff", "fungal skin",
]

TELEHEALTH_KEYWORDS = [
    "telederm", "teledermatology", "virtual consult", "virtual visit",
    "online dermatology", "telehealth", "virtual care", "async consult",
    "asynchronous", "e-visit",
]


# ===========================================================================
# PHASE 1: NPI REGISTRY PULL
# ===========================================================================

def search_npi(taxonomy_desc, state, skip=0, limit=200):
    """Query NPPES NPI Registry API."""
    params = {
        "version": "2.1",
        "taxonomy_description": taxonomy_desc,
        "enumeration_type": "NPI-1",
        "state": state,
        "limit": limit,
        "skip": skip,
    }
    try:
        r = requests.get(NPI_API, params=params, timeout=30)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"  [ERROR] NPI API failed for {taxonomy_desc}/{state} skip={skip}: {e}")
        return {"results": [], "result_count": 0}


def extract_provider(result):
    """Extract structured fields from a single NPI result."""
    basic = result.get("basic", {})
    addresses = result.get("addresses", [])
    taxonomies = result.get("taxonomies", [])

    # Prefer practice/location address over mailing address
    practice_addr = next(
        (a for a in addresses if a.get("address_purpose") == "LOCATION"), {}
    )
    mailing_addr = next(
        (a for a in addresses if a.get("address_purpose") == "MAILING"), {}
    )
    addr = practice_addr or mailing_addr

    # Extract all taxonomy descriptions
    tax_descs = [t.get("desc", "") for t in taxonomies if t.get("desc")]

    return {
        "npi": result.get("number"),
        "first_name": basic.get("first_name", "").title(),
        "last_name": basic.get("last_name", "").title(),
        "credential": basic.get("credential", ""),
        "gender": basic.get("gender", ""),
        "enumeration_date": basic.get("enumeration_date", ""),
        "taxonomy_primary": taxonomies[0].get("desc", "") if taxonomies else "",
        "taxonomy_all": "; ".join(tax_descs),
        "state": addr.get("state", ""),
        "city": addr.get("city", "").title(),
        "zip": addr.get("postal_code", "")[:5],
        "phone": addr.get("telephone_number", ""),
        "fax": addr.get("fax_number", ""),
        "address_line": addr.get("address_1", ""),
        "address_full": (
            f"{addr.get('address_1', '')} {addr.get('address_2', '')}".strip()
            + f", {addr.get('city', '').title()}, {addr.get('state', '')} "
            + f"{addr.get('postal_code', '')[:5]}"
        ).strip(", "),
    }


def run_phase1(states=None, save_intermediate=True):
    """Pull all dermatology providers from NPI Registry."""
    if states is None:
        states = PRIORITY_STATES

    all_providers = []
    total_api_calls = 0

    for state in states:
        for tax_desc in TAXONOMY_SEARCHES:
            skip = 0
            state_tax_count = 0

            while True:
                data = search_npi(tax_desc, state, skip=skip)
                results = data.get("results", [])
                result_count = data.get("result_count", 0)

                if not results:
                    break

                for r in results:
                    provider = extract_provider(r)
                    all_providers.append(provider)
                    state_tax_count += 1

                total_api_calls += 1

                # If we got fewer than 200 results, no more pages
                if len(results) < 200:
                    break

                skip += 200
                time.sleep(0.5)  # Be nice to the API

            if state_tax_count > 0:
                print(f"  {state} / {tax_desc}: {state_tax_count} providers")

    # Build DataFrame and deduplicate by NPI number
    df = pd.DataFrame(all_providers)
    before = len(df)
    df = df.drop_duplicates(subset=["npi"])
    after = len(df)

    print(f"\nPhase 1 complete: {after} unique providers ({before - after} duplicates removed)")
    print(f"  API calls made: {total_api_calls}")

    # Filter out PAs unless they have a derm taxonomy
    pa_mask = df["credential"].str.contains("PA", case=False, na=False)
    derm_mask = df["taxonomy_all"].str.contains("Dermatolog", case=False, na=False)
    df = df[~pa_mask | derm_mask]
    print(f"  After PA filter: {len(df)} providers")

    if save_intermediate:
        path = os.path.join(OUTPUT_DIR, "phase1_npi_raw.csv")
        df.to_csv(path, index=False)
        print(f"  Saved to {path}")

    return df


# ===========================================================================
# PHASE 1B: SKIN OF COLOR SOCIETY DIRECTORY
# ===========================================================================

US_STATE_ABBREVS = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
    "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
    "District of Columbia": "DC", "Florida": "FL", "Georgia": "GA", "Hawaii": "HI",
    "Idaho": "ID", "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
    "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS",
    "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
    "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
    "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
    "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI",
    "South Carolina": "SC", "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX",
    "Utah": "UT", "Vermont": "VT", "Virginia": "VA", "Washington": "WA",
    "West Virginia": "WV", "Wisconsin": "WI", "Wyoming": "WY",
}


def load_socs_data():
    """Load Skin of Color Society directory data (pre-scraped JSON)."""
    socs_path = os.path.join(OUTPUT_DIR, "socs_directory_309.json")
    if not os.path.exists(socs_path):
        print("  SOCS data not found. Skipping.")
        return pd.DataFrame()

    with open(socs_path) as f:
        members = json.load(f)

    rows = []
    for m in members:
        # Normalize state: full name -> abbreviation
        state = m.get("state", "")
        if len(state) > 2:
            state = US_STATE_ABBREVS.get(state, state)

        # Split name into first/last
        name_parts = m.get("name", "").strip().split()
        first_name = name_parts[0] if name_parts else ""
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""

        rows.append({
            "npi": f"SOCS-{m.get('name', '').replace(' ', '-')}",
            "first_name": first_name.title(),
            "last_name": last_name.title(),
            "credential": m.get("credentials", ""),
            "gender": "",
            "enumeration_date": "",
            "taxonomy_primary": "Dermatology (SOCS Member)",
            "taxonomy_all": "Dermatology (Skin of Color Society)",
            "state": state,
            "city": m.get("city", "").title(),
            "zip": m.get("zip", ""),
            "phone": m.get("phone", ""),
            "fax": "",
            "address_line": m.get("address1", ""),
            "address_full": f"{m.get('address1', '')} {m.get('address2', '')}, {m.get('city', '')}, {state} {m.get('zip', '')}".strip(", "),
            # Pre-fill enrichment fields from SOCS data
            "website": m.get("website", ""),
            "instagram": f"@{m['instagram']}" if m.get("instagram") else "",
            "tiktok": "",
            "linkedin": m.get("linkedin", ""),
            "socs_email": m.get("email", ""),
            "socs_member": True,
            "socs_organization": m.get("organization", ""),
        })

    df = pd.DataFrame(rows)
    print(f"  Loaded {len(df)} SOCS members")
    return df


def merge_socs_with_npi(npi_df, socs_df):
    """Merge SOCS data into NPI data, avoiding duplicates."""
    if socs_df.empty:
        npi_df["socs_member"] = False
        return npi_df

    # Flag existing NPI providers that are also SOCS members (match by name)
    npi_df["_name_key"] = (
        npi_df["first_name"].str.lower().str.strip()
        + " "
        + npi_df["last_name"].str.lower().str.strip()
    )
    socs_df["_name_key"] = (
        socs_df["first_name"].str.lower().str.strip()
        + " "
        + socs_df["last_name"].str.lower().str.strip()
    )

    # Mark NPI providers who are SOCS members
    socs_names = set(socs_df["_name_key"])
    npi_df["socs_member"] = npi_df["_name_key"].isin(socs_names)

    # Copy SOCS email for matched NPI providers
    socs_email_map = dict(zip(socs_df["_name_key"], socs_df["socs_email"]))
    socs_org_map = dict(zip(socs_df["_name_key"], socs_df["socs_organization"]))
    npi_df["socs_email"] = npi_df["_name_key"].map(socs_email_map).fillna("")
    npi_df["socs_organization"] = npi_df["_name_key"].map(socs_org_map).fillna("")

    # Add SOCS-only members (not found in NPI data)
    socs_only = socs_df[~socs_df["_name_key"].isin(set(npi_df["_name_key"]))].copy()
    if "socs_organization" not in npi_df.columns:
        npi_df["socs_organization"] = ""

    # Align columns
    for col in npi_df.columns:
        if col not in socs_only.columns:
            socs_only[col] = ""
    socs_only = socs_only[npi_df.columns]

    merged = pd.concat([npi_df, socs_only], ignore_index=True)
    merged = merged.drop(columns=["_name_key"], errors="ignore")

    npi_matched = npi_df["socs_member"].sum()
    print(f"  NPI providers also in SOCS: {npi_matched}")
    print(f"  SOCS-only providers added: {len(socs_only)}")
    print(f"  Total after merge: {len(merged)}")

    return merged


# ===========================================================================
# PHASE 2: GOOGLE ENRICHMENT
# ===========================================================================

def google_search(query, num_results=5):
    """Simple Google search via googlesearch-python."""
    try:
        from googlesearch import search as gsearch
        results = list(gsearch(query, num_results=num_results, sleep_interval=2))
        return results
    except ImportError:
        print("  [WARN] googlesearch-python not installed, skipping web enrichment")
        return []
    except Exception as e:
        print(f"  [WARN] Google search failed for '{query[:50]}...': {e}")
        return []


def check_url_for_keywords(url, keywords, timeout=10):
    """Fetch a URL and check if any keywords appear in the page text."""
    try:
        headers = {"User-Agent": random.choice(USER_AGENTS)}
        r = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        text = r.text.lower()
        found = [kw for kw in keywords if kw.lower() in text]
        return found
    except Exception:
        return []


def extract_social_from_urls(urls):
    """Extract Instagram, TikTok, LinkedIn handles from a list of URLs."""
    social = {"instagram": "", "tiktok": "", "linkedin": "", "website": ""}

    for url in urls:
        url_lower = url.lower()
        if "instagram.com/" in url_lower and not social["instagram"]:
            match = re.search(r"instagram\.com/([^/?#]+)", url_lower)
            if match and match.group(1) not in ("p", "reel", "stories", "explore"):
                social["instagram"] = f"@{match.group(1)}"
        elif "tiktok.com/@" in url_lower and not social["tiktok"]:
            match = re.search(r"tiktok\.com/@([^/?#]+)", url_lower)
            if match:
                social["tiktok"] = f"@{match.group(1)}"
        elif "linkedin.com/in/" in url_lower and not social["linkedin"]:
            social["linkedin"] = url
        elif not social["website"] and not any(
            domain in url_lower
            for domain in [
                "instagram.com", "tiktok.com", "linkedin.com", "facebook.com",
                "twitter.com", "x.com", "youtube.com", "yelp.com",
                "healthgrades.com", "zocdoc.com", "vitals.com",
                "npidb.org", "npino.com", "npiregistry",
                "google.com", "bing.com", "yahoo.com",
            ]
        ):
            social["website"] = url

    return social


def enrich_provider(row):
    """Run Google searches for a single provider to find web presence."""
    name = f"{row['first_name']} {row['last_name']}"
    state = row.get("state", "")
    city = row.get("city", "")

    enrichment = {
        "website": "",
        "instagram": "",
        "tiktok": "",
        "linkedin": "",
        "mentions_fungal": False,
        "mentions_telehealth": False,
        "fungal_keywords_found": "",
        "telehealth_keywords_found": "",
    }

    # Search 1: General presence
    query1 = f"{name} dermatologist {city} {state}"
    urls1 = google_search(query1, num_results=5)
    time.sleep(random.uniform(3, 5))

    # Search 2: Social media
    query2 = f"{name} dermatologist Instagram OR TikTok"
    urls2 = google_search(query2, num_results=5)
    time.sleep(random.uniform(3, 5))

    all_urls = urls1 + urls2
    social = extract_social_from_urls(all_urls)
    enrichment.update(social)

    # Search 3: Fungal condition mentions
    query3 = f'"{name}" dermatologist "fungal acne" OR "seborrheic dermatitis" OR "Malassezia"'
    urls3 = google_search(query3, num_results=3)
    time.sleep(random.uniform(3, 5))

    if urls3:
        enrichment["mentions_fungal"] = True
        # Check actual pages for specific keywords
        for url in urls3[:2]:
            found = check_url_for_keywords(url, FUNGAL_KEYWORDS)
            if found:
                enrichment["fungal_keywords_found"] = "; ".join(set(found))
                break
            time.sleep(1)

    # Check website for telehealth and fungal mentions
    if enrichment["website"]:
        found_fungal = check_url_for_keywords(enrichment["website"], FUNGAL_KEYWORDS)
        found_tele = check_url_for_keywords(enrichment["website"], TELEHEALTH_KEYWORDS)
        if found_fungal:
            enrichment["mentions_fungal"] = True
            existing = enrichment["fungal_keywords_found"]
            new_kws = "; ".join(set(found_fungal))
            enrichment["fungal_keywords_found"] = (
                f"{existing}; {new_kws}" if existing else new_kws
            )
        if found_tele:
            enrichment["mentions_telehealth"] = True
            enrichment["telehealth_keywords_found"] = "; ".join(set(found_tele))
        time.sleep(1)

    return enrichment


def run_phase2(df, max_providers=None, save_intermediate=True):
    """Enrich providers with Google search data."""
    if max_providers:
        df_to_enrich = df.head(max_providers).copy()
    else:
        df_to_enrich = df.copy()

    print(f"\nPhase 2: Enriching {len(df_to_enrich)} providers via Google...")

    enrichment_cols = [
        "website", "instagram", "tiktok", "linkedin",
        "mentions_fungal", "mentions_telehealth",
        "fungal_keywords_found", "telehealth_keywords_found",
    ]
    for col in enrichment_cols:
        if col not in df_to_enrich.columns:
            df_to_enrich[col] = "" if col not in ("mentions_fungal", "mentions_telehealth") else False

    for idx, row in df_to_enrich.iterrows():
        name = f"{row['first_name']} {row['last_name']}"
        i = df_to_enrich.index.get_loc(idx)
        print(f"  [{i + 1}/{len(df_to_enrich)}] {name}, {row.get('credential', '')} — {row.get('city', '')}, {row.get('state', '')}")

        enrichment = enrich_provider(row)
        for key, val in enrichment.items():
            df_to_enrich.at[idx, key] = val

        # Save progress every 25 providers
        if (i + 1) % 25 == 0 and save_intermediate:
            path = os.path.join(OUTPUT_DIR, "phase2_enriched_progress.csv")
            df_to_enrich.to_csv(path, index=False)
            print(f"    (saved progress to {path})")

    if save_intermediate:
        path = os.path.join(OUTPUT_DIR, "phase2_enriched.csv")
        df_to_enrich.to_csv(path, index=False)
        print(f"\nPhase 2 complete. Saved to {path}")

    return df_to_enrich


# ===========================================================================
# PHASE 3: SCORING
# ===========================================================================

def compute_score(row):
    """Score a provider based on relevance signals."""
    score = 0
    notes = []

    # NP credential — cheaper, more flexible for async consultations
    cred = str(row.get("credential", "")).upper()
    if "NP" in cred or "APRN" in cred or "DNP" in cred:
        score += 3
        notes.append("NP credential (+3)")

    # Early career (enumeration date within last 7 years)
    enum_date = str(row.get("enumeration_date", ""))
    if enum_date:
        try:
            ed = datetime.strptime(enum_date, "%Y-%m-%d").date()
            years_active = (date.today() - ed).days / 365.25
            if years_active <= 7:
                score += 3
                notes.append(f"Early career {years_active:.0f}yr (+3)")
        except ValueError:
            pass

    # Social media presence
    if row.get("instagram"):
        score += 2
        notes.append("Has Instagram (+2)")
    if row.get("tiktok"):
        score += 2
        notes.append("Has TikTok (+2)")

    # Fungal skin mentions — biggest relevance signal
    if row.get("mentions_fungal"):
        score += 5
        notes.append("Mentions fungal conditions (+5)")

    # Telehealth mentions
    if row.get("mentions_telehealth"):
        score += 3
        notes.append("Mentions telehealth (+3)")

    # Priority state
    if row.get("state") in PRIORITY_STATES:
        score += 1
        notes.append("Priority state (+1)")

    # Female provider
    if str(row.get("gender", "")).upper() == "F":
        score += 1
        notes.append("Female (+1)")

    # Has personal website with contact info
    if row.get("website"):
        score += 2
        notes.append("Has website (+2)")

    # SOCS member — skin of color focus aligns with Kyn Skyn mission
    if row.get("socs_member"):
        score += 4
        notes.append("SOCS member (+4)")

    # Has email from SOCS directory
    if row.get("socs_email"):
        score += 2
        notes.append("Has SOCS email (+2)")

    return score, "; ".join(notes)


def run_phase3(df):
    """Score and rank all providers."""
    print("\nPhase 3: Scoring providers...")

    scores = df.apply(compute_score, axis=1)
    df["score"] = [s[0] for s in scores]
    df["score_notes"] = [s[1] for s in scores]
    df = df.sort_values("score", ascending=False).reset_index(drop=True)

    print(f"  Score distribution:")
    print(f"    10+: {len(df[df['score'] >= 10])}")
    print(f"    8-9: {len(df[(df['score'] >= 8) & (df['score'] < 10)])}")
    print(f"    5-7: {len(df[(df['score'] >= 5) & (df['score'] < 8)])}")
    print(f"    <5:  {len(df[df['score'] < 5])}")

    return df


# ===========================================================================
# PHASE 4: EXCEL OUTPUT
# ===========================================================================

def run_phase4(df):
    """Write multi-sheet Excel workbook."""
    print("\nPhase 4: Writing Excel output...")

    output_path = os.path.join(OUTPUT_DIR, "kyn_skyn_derm_prospects.xlsx")

    # Common columns for output
    display_cols = [
        "first_name", "last_name", "credential", "state", "city",
        "phone", "website", "instagram", "tiktok", "linkedin",
        "score", "score_notes",
        "mentions_fungal", "fungal_keywords_found",
        "mentions_telehealth", "telehealth_keywords_found",
        "socs_member", "socs_email", "socs_organization",
        "taxonomy_primary", "enumeration_date", "address_full",
    ]

    # Only include columns that exist in the DataFrame
    display_cols = [c for c in display_cols if c in df.columns]

    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        # Sheet 1: Top Targets (score >= 8)
        top = df[df["score"] >= 8][display_cols] if "score" in df.columns else df.head(0)
        top.to_excel(writer, sheet_name="Top Targets", index=False)
        print(f"  Top Targets: {len(top)} providers (score >= 8)")

        # Sheet 2: All Dermatologists
        all_derms = df[display_cols]
        all_derms.to_excel(writer, sheet_name="All Providers", index=False)
        print(f"  All Providers: {len(all_derms)}")

        # Sheet 3: Derm NPs only
        np_mask = df["credential"].str.contains("NP|APRN|DNP", case=False, na=False)
        nps = df[np_mask][display_cols]
        nps.to_excel(writer, sheet_name="Derm NPs", index=False)
        print(f"  Derm NPs: {len(nps)}")

        # Sheet 4: SOCS Members
        if "socs_member" in df.columns:
            socs = df[df["socs_member"] == True][display_cols]
            socs.to_excel(writer, sheet_name="SOCS Members", index=False)
            print(f"  SOCS Members: {len(socs)}")

        # Sheet 5: Fungal Skin Mentions
        if "mentions_fungal" in df.columns:
            fungal = df[df["mentions_fungal"] == True][display_cols]
            fungal.to_excel(writer, sheet_name="Fungal Skin Mentions", index=False)
            print(f"  Fungal Skin Mentions: {len(fungal)}")
        else:
            pd.DataFrame().to_excel(writer, sheet_name="Fungal Skin Mentions", index=False)

    print(f"\n  Output saved to: {output_path}")
    return output_path


# ===========================================================================
# PHASE 5: EMAIL/DM FINDER (for top targets)
# ===========================================================================

def find_contact_info(row):
    """Try to extract email and booking links from provider's website."""
    contact = {"email_found": "", "booking_link": ""}
    website = row.get("website", "")

    if not website:
        return contact

    try:
        headers = {"User-Agent": random.choice(USER_AGENTS)}
        r = requests.get(website, headers=headers, timeout=10, allow_redirects=True)
        text = r.text

        # Look for email addresses
        emails = re.findall(
            r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text
        )
        # Filter out common non-personal emails
        skip_patterns = ["example.com", "sentry.io", "wixpress", "wordpress", "squarespace"]
        emails = [
            e for e in emails
            if not any(sp in e.lower() for sp in skip_patterns)
        ]
        if emails:
            contact["email_found"] = emails[0]

        # Look for booking/scheduling links
        booking_patterns = [
            r'(https?://[^\s"\'<>]*calendly\.com[^\s"\'<>]*)',
            r'(https?://[^\s"\'<>]*acuity[^\s"\'<>]*scheduling[^\s"\'<>]*)',
            r'(https?://[^\s"\'<>]*zocdoc\.com[^\s"\'<>]*)',
            r'(https?://[^\s"\'<>]*patientpop[^\s"\'<>]*)',
            r'(https?://[^\s"\'<>]*booking[^\s"\'<>]*)',
        ]
        for pattern in booking_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                contact["booking_link"] = match.group(1)
                break

    except Exception:
        pass

    return contact


def run_phase5(df, top_n=100):
    """Find emails and booking links for top-scored providers."""
    if "score" not in df.columns:
        print("\nPhase 5: Skipping (no scores computed)")
        return df

    top = df.head(top_n).copy()
    print(f"\nPhase 5: Finding contact info for top {len(top)} providers...")

    top["email_found"] = ""
    top["booking_link"] = ""

    for idx, row in top.iterrows():
        i = top.index.get_loc(idx)
        if row.get("website"):
            name = f"{row['first_name']} {row['last_name']}"
            print(f"  [{i + 1}/{len(top)}] {name} — {row['website'][:60]}")
            contact = find_contact_info(row)
            for key, val in contact.items():
                top.at[idx, key] = val
            time.sleep(random.uniform(1, 2))

    # Merge back into main DataFrame
    for col in ["email_found", "booking_link"]:
        if col not in df.columns:
            df[col] = ""
        df.loc[top.index, col] = top[col]

    found_emails = len(top[top["email_found"] != ""])
    found_booking = len(top[top["booking_link"] != ""])
    print(f"  Found {found_emails} emails, {found_booking} booking links")

    return df


# ===========================================================================
# MAIN
# ===========================================================================

def main():
    print("=" * 60)
    print("Kyn Skyn — Dermatologist Prospector")
    print("=" * 60)

    # Parse command-line args
    run_all_states = "--all-states" in sys.argv
    skip_enrichment = "--skip-enrichment" in sys.argv
    enrich_limit = None

    for arg in sys.argv:
        if arg.startswith("--enrich-limit="):
            try:
                enrich_limit = int(arg.split("=")[1])
            except ValueError:
                pass

    states = ALL_STATES if run_all_states else PRIORITY_STATES

    # ------- Phase 1 -------
    print(f"\n{'='*60}")
    print(f"PHASE 1: NPI Registry Pull ({len(states)} states)")
    print(f"{'='*60}")

    # Check for cached Phase 1 data
    phase1_path = os.path.join(OUTPUT_DIR, "phase1_npi_raw.csv")
    if os.path.exists(phase1_path) and "--force-refresh" not in sys.argv:
        print(f"  Loading cached data from {phase1_path}")
        df = pd.read_csv(phase1_path)
        print(f"  Loaded {len(df)} providers")
    else:
        df = run_phase1(states=states)

    # ------- Phase 1B: SOCS -------
    print(f"\n{'='*60}")
    print(f"PHASE 1B: Skin of Color Society Directory")
    print(f"{'='*60}")
    socs_df = load_socs_data()
    if not socs_df.empty:
        df = merge_socs_with_npi(df, socs_df)

    # ------- Phase 2 -------
    if not skip_enrichment:
        print(f"\n{'='*60}")
        print(f"PHASE 2: Google Enrichment")
        print(f"{'='*60}")

        phase2_path = os.path.join(OUTPUT_DIR, "phase2_enriched.csv")
        if os.path.exists(phase2_path) and "--force-refresh" not in sys.argv:
            print(f"  Loading cached enrichment from {phase2_path}")
            df = pd.read_csv(phase2_path)
            print(f"  Loaded {len(df)} enriched providers")
        else:
            df = run_phase2(df, max_providers=enrich_limit)
    else:
        print("\n  Skipping Phase 2 (--skip-enrichment)")

    # ------- Phase 3 -------
    print(f"\n{'='*60}")
    print(f"PHASE 3: Scoring & Prioritization")
    print(f"{'='*60}")
    df = run_phase3(df)

    # ------- Phase 4 -------
    print(f"\n{'='*60}")
    print(f"PHASE 4: Excel Output")
    print(f"{'='*60}")
    output_path = run_phase4(df)

    # ------- Phase 5 -------
    if not skip_enrichment:
        print(f"\n{'='*60}")
        print(f"PHASE 5: Email/DM Finder")
        print(f"{'='*60}")
        df = run_phase5(df, top_n=100)

        # Re-export with email data
        print(f"\n  Re-exporting Excel with contact info...")
        run_phase4(df)

    print(f"\n{'='*60}")
    print(f"DONE")
    print(f"{'='*60}")
    print(f"\nOutput: {OUTPUT_DIR}")
    print(f"\nUsage:")
    print(f"  python derm_prospector.py                          # Priority states, full pipeline")
    print(f"  python derm_prospector.py --all-states             # All 50 states + DC")
    print(f"  python derm_prospector.py --skip-enrichment        # NPI pull only (fast)")
    print(f"  python derm_prospector.py --enrich-limit=50        # Only enrich top 50")
    print(f"  python derm_prospector.py --force-refresh          # Ignore cached data")


if __name__ == "__main__":
    main()
