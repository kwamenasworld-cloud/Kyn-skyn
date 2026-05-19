#!/usr/bin/env python3
"""Standalone NPI pull - avoids buffering/hanging issues."""
import requests
import pandas as pd
import json
import time
import os
import sys

sys.stdout.reconfigure(line_buffering=True)

NPI_API = "https://npiregistry.cms.hhs.gov/api/"
STATES = ["GA","TX","FL","NY","CA","IL","MD","NC","VA","NJ","PA","OH","MI","LA","SC","DC"]
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

all_providers = []

MAX_PER_STATE = 1200  # Cap to avoid massive states like TX with 11K+ general results

for state in STATES:
    skip = 0
    state_count = 0
    while state_count < MAX_PER_STATE:
        try:
            session = requests.Session()
            r = session.get(NPI_API, params={
                "version": "2.1",
                "taxonomy_description": "Dermatology",
                "enumeration_type": "NPI-1",
                "state": state,
                "limit": 200,
                "skip": skip
            }, timeout=20)
            data = r.json()
            results = data.get("results", [])
            r.close()
            session.close()
        except Exception as e:
            print(f"  ERROR {state} skip={skip}: {e}")
            break

        if not results:
            break

        for res in results:
            b = res.get("basic", {})
            addrs = res.get("addresses", [])
            taxs = res.get("taxonomies", [])
            addr = next((a for a in addrs if a.get("address_purpose") == "LOCATION"), {})
            if not addr:
                addr = next((a for a in addrs if a.get("address_purpose") == "MAILING"), {})
            all_providers.append({
                "npi": res.get("number"),
                "first_name": b.get("first_name", "").title(),
                "last_name": b.get("last_name", "").title(),
                "credential": b.get("credential", ""),
                "gender": b.get("gender", ""),
                "enumeration_date": b.get("enumeration_date", ""),
                "taxonomy_primary": taxs[0].get("desc", "") if taxs else "",
                "taxonomy_all": "; ".join(t.get("desc", "") for t in taxs if t.get("desc")),
                "state": addr.get("state", ""),
                "city": addr.get("city", "").title(),
                "zip": addr.get("postal_code", "")[:5],
                "phone": addr.get("telephone_number", ""),
                "fax": addr.get("fax_number", ""),
                "address_line": addr.get("address_1", ""),
                "address_full": f"{addr.get('address_1', '')} {addr.get('city', '').title()}, {addr.get('state', '')} {addr.get('postal_code', '')[:5]}".strip(),
            })
            state_count += 1

        if len(results) < 200:
            break
        skip += 200
        time.sleep(1)

    print(f"  {state}: {state_count} providers")
    sys.stdout.flush()
    time.sleep(2)  # Longer pause between states to avoid rate limiting

df = pd.DataFrame(all_providers).drop_duplicates(subset=["npi"])

# Filter out PAs without derm taxonomy
pa_mask = df["credential"].str.contains("PA", case=False, na=False)
derm_mask = df["taxonomy_all"].str.contains("Dermatolog", case=False, na=False)
df = df[~pa_mask | derm_mask]

path = os.path.join(OUTPUT_DIR, "phase1_npi_raw.csv")
df.to_csv(path, index=False)
print(f"\nTotal: {len(df)} unique providers")
print(f"Saved to {path}")

# Now merge with SOCS
socs_path = os.path.join(OUTPUT_DIR, "socs_directory_309.json")
if os.path.exists(socs_path):
    print("\nMerging SOCS data...")
    with open(socs_path) as f:
        socs = json.load(f)

    US_ABBREVS = {"Alabama":"AL","Alaska":"AK","Arizona":"AZ","Arkansas":"AR","California":"CA","Colorado":"CO","Connecticut":"CT","Delaware":"DE","District of Columbia":"DC","Florida":"FL","Georgia":"GA","Hawaii":"HI","Idaho":"ID","Illinois":"IL","Indiana":"IN","Iowa":"IA","Kansas":"KS","Kentucky":"KY","Louisiana":"LA","Maine":"ME","Maryland":"MD","Massachusetts":"MA","Michigan":"MI","Minnesota":"MN","Mississippi":"MS","Missouri":"MO","Montana":"MT","Nebraska":"NE","Nevada":"NV","New Hampshire":"NH","New Jersey":"NJ","New Mexico":"NM","New York":"NY","North Carolina":"NC","North Dakota":"ND","Ohio":"OH","Oklahoma":"OK","Oregon":"OR","Pennsylvania":"PA","Rhode Island":"RI","South Carolina":"SC","South Dakota":"SD","Tennessee":"TN","Texas":"TX","Utah":"UT","Vermont":"VT","Virginia":"VA","Washington":"WA","West Virginia":"WV","Wisconsin":"WI","Wyoming":"WY"}

    npi_names = set((df["first_name"].str.lower() + " " + df["last_name"].str.lower()).tolist())

    socs_only = []
    socs_matched = 0
    for m in socs:
        parts = m.get("name", "").split()
        fn = parts[0] if parts else ""
        ln = " ".join(parts[1:]) if len(parts) > 1 else ""
        name_key = f"{fn.lower()} {ln.lower()}"
        st = m.get("state", "")
        if len(st) > 2:
            st = US_ABBREVS.get(st, st)

        if name_key in npi_names:
            socs_matched += 1
            # Tag the NPI row
            mask = (df["first_name"].str.lower() == fn.lower()) & (df["last_name"].str.lower() == ln.lower())
            df.loc[mask, "socs_member"] = True
            df.loc[mask, "socs_email"] = m.get("email", "")
            df.loc[mask, "socs_organization"] = m.get("organization", "")
        else:
            socs_only.append({
                "npi": f"SOCS-{m.get('name','').replace(' ','-')}",
                "first_name": fn.title(), "last_name": ln.title(),
                "credential": m.get("credentials", ""), "gender": "",
                "enumeration_date": "", "taxonomy_primary": "Dermatology (SOCS Member)",
                "taxonomy_all": "Dermatology (SOCS)", "state": st,
                "city": m.get("city", "").title(), "zip": m.get("zip", ""),
                "phone": m.get("phone", ""), "fax": "",
                "address_line": m.get("address1", ""),
                "address_full": f"{m.get('address1','')} {m.get('city','')}, {st} {m.get('zip','')}",
                "website": m.get("website", ""),
                "instagram": f"@{m['instagram']}" if m.get("instagram") else "",
                "linkedin": m.get("linkedin", ""),
                "socs_member": True, "socs_email": m.get("email", ""),
                "socs_organization": m.get("organization", ""),
            })

    if "socs_member" not in df.columns:
        df["socs_member"] = False
        df["socs_email"] = ""
        df["socs_organization"] = ""
    df["socs_member"] = df["socs_member"].fillna(False)
    df["socs_email"] = df["socs_email"].fillna("")
    df["socs_organization"] = df["socs_organization"].fillna("")

    if socs_only:
        socs_df = pd.DataFrame(socs_only)
        for c in df.columns:
            if c not in socs_df.columns:
                socs_df[c] = ""
        df = pd.concat([df, socs_df[df.columns]], ignore_index=True)

    print(f"  SOCS matched in NPI: {socs_matched}")
    print(f"  SOCS-only added: {len(socs_only)}")
    print(f"  Total after merge: {len(df)}")

# Score
print("\nScoring...")
from datetime import datetime, date

def score(row):
    s = 0
    cred = str(row.get("credential", "")).upper()
    if "NP" in cred or "APRN" in cred or "DNP" in cred:
        s += 3
    ed = str(row.get("enumeration_date", ""))
    if ed:
        try:
            years = (date.today() - datetime.strptime(ed, "%Y-%m-%d").date()).days / 365.25
            if years <= 7: s += 3
        except: pass
    if row.get("instagram"): s += 2
    if row.get("socs_member"): s += 4
    if row.get("socs_email"): s += 2
    if row.get("website"): s += 2
    if row.get("state") in ["GA","TX","FL","NY","CA","IL","MD","NC","VA","NJ","PA","OH","MI","LA","SC","DC"]:
        s += 1
    if str(row.get("gender", "")).upper() == "F": s += 1
    return s

df["score"] = df.apply(score, axis=1)
df = df.sort_values("score", ascending=False).reset_index(drop=True)
print(f"  Score 8+: {len(df[df['score'] >= 8])}")
print(f"  Score 5-7: {len(df[(df['score'] >= 5) & (df['score'] < 8)])}")

# Excel
print("\nWriting Excel...")
out = os.path.join(OUTPUT_DIR, "kyn_skyn_derm_prospects.xlsx")
cols = [c for c in ["first_name","last_name","credential","state","city","phone","website","instagram","linkedin","score","socs_member","socs_email","socs_organization","taxonomy_primary","enumeration_date","address_full","gender"] if c in df.columns]

with pd.ExcelWriter(out, engine="openpyxl") as w:
    df[df["score"] >= 8][cols].to_excel(w, sheet_name="Top Targets", index=False)
    df[cols].to_excel(w, sheet_name="All Providers", index=False)
    np_mask = df["credential"].str.contains("NP|APRN|DNP", case=False, na=False)
    df[np_mask][cols].to_excel(w, sheet_name="Derm NPs", index=False)
    if "socs_member" in df.columns:
        df[df["socs_member"] == True][cols].to_excel(w, sheet_name="SOCS Members", index=False)

print(f"Saved: {out}")
print(f"\nSheets:")
print(f"  Top Targets (score>=8): {len(df[df['score'] >= 8])}")
print(f"  All Providers: {len(df)}")
np_mask = df["credential"].str.contains("NP|APRN|DNP", case=False, na=False)
print(f"  Derm NPs: {len(df[np_mask])}")
if "socs_member" in df.columns:
    print(f"  SOCS Members: {len(df[df['socs_member'] == True])}")
print("\nDONE!")
