#!/usr/bin/env python3
"""Build a public-source creator outreach list for Kyn Skyn.

The output is intentionally a prospecting artifact, not an automated contact
database. It uses public profile/ranking pages, keeps source URLs, filters
obvious brands where possible, and tags each creator by relevance.
"""

from __future__ import annotations

import csv
import re
import time
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Iterable
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "kyn_skyn_creator_outreach_400.csv"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"
    )
}

COUNTRIES = [
    "brazil",
    "united-states",
    "indonesia",
    "india",
    "russia",
    "turkey",
    "united-kingdom",
    "italy",
    "malaysia",
    "spain",
    "germany",
    "south-korea",
    "nigeria",
    "france",
    "canada",
    "australia",
    "mexico",
    "south-africa",
    "colombia",
    "uae",
    "morocco",
]

CREATORREACH_TOPICS = ["skincare", "beauty", "wellness", "makeup", "hair"]
CREATORREACH_PLATFORM_SLUGS = [
    "tiktok-skincare-creators-united-states",
    "instagram-skincare-creators-united-states",
    "tiktok-beauty-creators-united-states",
    "instagram-makeup-creators-united-states",
    "instagram-wellness-creators-united-states",
    "instagram-fashion-creators-united-states",
    "tiktok-lifestyle-creators-united-states",
]

SOCIALHIPPER_PLATFORMS = ["instagram", "youtube", "pinterest"]
SOCIALHIPPER_CATEGORIES = ["skincare", "beauty", "makeup", "haircare", "health"]
SOCIALHIPPER_COUNTRIES = [
    "united-states",
    "canada",
    "united-kingdom",
    "australia",
    "south-africa",
    "nigeria",
]

HAFI_URLS = [
    ("dermatology", "https://hafi.pro/top/most-followed-instagram/dermatology"),
    ("skincare", "https://hafi.pro/top/most-followed-instagram/skincare"),
]

MANUAL_PROSPECTS = [
    {
        "name": "La Theorie",
        "handle": "la_theorie",
        "platform": "Instagram/TikTok",
        "country": "",
        "followers": "",
        "bio": "Fungal acne-safe skincare creator and product educator.",
        "niche": "fungal acne; malassezia; skincare education",
        "source": "manual_web_search",
        "source_url": "https://linktr.ee/la_theorie",
    },
    {
        "name": "Liv Markley",
        "handle": "livvvmarkley",
        "platform": "Instagram/TikTok/YouTube",
        "country": "",
        "followers": "",
        "bio": "Acne-prone skincare creator with fungal acne-safe product content.",
        "niche": "fungal acne; acne-prone skincare",
        "source": "manual_web_search",
        "source_url": "https://linktr.ee/livvvmarkley",
    },
    {
        "name": "Sean Garrette",
        "handle": "seangarrette",
        "platform": "Instagram",
        "country": "United States",
        "followers": "",
        "bio": "Esthetician and skincare educator specializing in skin of color.",
        "niche": "skin of color; esthetician; skincare education",
        "source": "manual_web_search",
        "source_url": "https://msha.ke/seangarrette/",
    },
    {
        "name": "THESKINARTISTT",
        "handle": "theskinartistt",
        "platform": "Instagram",
        "country": "United States",
        "followers": "",
        "bio": "Aesthetician focused on corrective skincare and virtual consultations.",
        "niche": "corrective skincare; virtual consults; esthetician",
        "source": "manual_web_search",
        "source_url": "https://linktr.ee/theskinartistt",
    },
    {
        "name": "Care Clark",
        "handle": "",
        "platform": "Instagram/TikTok",
        "country": "United States",
        "followers": "",
        "bio": "Derm nurse and hormonal acne educator.",
        "niche": "acne; dermatology nurse; skin education",
        "source": "manual_web_search",
        "source_url": "https://mionemanagement.com/influencers/care-clark/",
    },
    {
        "name": "Tiara Willis",
        "handle": "makeupforwomenofcolor",
        "platform": "Instagram",
        "country": "United States",
        "followers": "186.8K",
        "bio": "Esthetician creating skincare and makeup content for women of color.",
        "niche": "skin of color; esthetician; beauty education",
        "source": "manual_web_search",
        "source_url": "https://starngage.com/app/global/influencer/sponsored-detail/makeupforwomenofcolor",
    },
    {
        "name": "Dr Dray",
        "handle": "drdrayzday",
        "platform": "Instagram/YouTube",
        "country": "United States",
        "followers": "",
        "bio": "Dermatologist and skincare educator with long-form acne and ingredient content.",
        "niche": "dermatology; acne; ingredient education",
        "source": "manual_web_search",
        "source_url": "https://www.youtube.com/@DrDrayzday",
    },
    {
        "name": "Dr Shereene Idriss",
        "handle": "shereeneidriss",
        "platform": "Instagram/YouTube",
        "country": "United States",
        "followers": "",
        "bio": "Board-certified dermatologist and skincare educator.",
        "niche": "dermatology; skincare education",
        "source": "manual_web_search",
        "source_url": "https://www.instagram.com/shereeneidriss/",
    },
    {
        "name": "Dr Lindsey Zubritsky",
        "handle": "dermguru",
        "platform": "Instagram/TikTok",
        "country": "United States",
        "followers": "",
        "bio": "Board-certified dermatologist known for practical skin education.",
        "niche": "dermatology; skincare education",
        "source": "manual_web_search",
        "source_url": "https://www.instagram.com/dermguru/",
    },
    {
        "name": "Nayamka Roberts-Smith",
        "handle": "labeautyologist",
        "platform": "Instagram/TikTok",
        "country": "United States",
        "followers": "",
        "bio": "Los Angeles esthetician and skincare educator.",
        "niche": "esthetician; acne; skincare education",
        "source": "manual_web_search",
        "source_url": "https://www.instagram.com/labeautyologist/",
    },
    {
        "name": "Cassandra Bankson",
        "handle": "cassandrabankson",
        "platform": "Instagram/YouTube",
        "country": "United States",
        "followers": "",
        "bio": "Medical esthetician and acne-positive skincare creator.",
        "niche": "acne; esthetician; skincare education",
        "source": "manual_web_search",
        "source_url": "https://www.instagram.com/cassandrabankson/",
    },
    {
        "name": "Lab Muffin Beauty Science",
        "handle": "labmuffinbeautyscience",
        "platform": "Instagram/YouTube",
        "country": "Australia",
        "followers": "",
        "bio": "Chemistry PhD skincare science educator.",
        "niche": "ingredient education; skincare science",
        "source": "manual_web_search",
        "source_url": "https://www.instagram.com/labmuffinbeautyscience/",
    },
    {
        "name": "Liah Yoo",
        "handle": "liahyoo",
        "platform": "Instagram/YouTube",
        "country": "United States",
        "followers": "",
        "bio": "K-beauty skincare creator and founder with acne-prone skin education.",
        "niche": "k-beauty; acne; skincare education",
        "source": "manual_web_search",
        "source_url": "https://www.instagram.com/liahyoo/",
    },
]

SKIN_TERMS = [
    "fungal",
    "malassezia",
    "acne",
    "esthetician",
    "aesthetician",
    "dermatologist",
    "dermatology",
    "derm",
    "skin of color",
    "melanin",
    "hyperpigmentation",
    "sensitive skin",
    "eczema",
    "seborrheic",
    "dandruff",
    "scalp",
    "barrier",
    "skincare",
    "skin care",
    "skin",
]

BRAND_TERMS = [
    "cosmetics",
    "official",
    "brand",
    "products",
    "shop",
    "store",
    "company",
    "labs",
    "ltd",
    "inc",
    "clean & clear",
    "olay",
    "eucerin",
    "murad",
    "bio-oil",
    "garners garden",
]

PERSON_TERMS = [
    "creator",
    "esthetician",
    "aesthetician",
    "dermatologist",
    "doctor",
    "dr ",
    "rn",
    "nurse",
    "blogger",
    "artist",
    "mua",
    "coach",
    "educator",
]

UNRELATED_TERMS = [
    "sports",
    "football",
    "actor",
    "music",
    "singer",
    "travel",
    "real estate",
    "gaming",
    "restaurant",
]


@dataclass
class Prospect:
    name: str
    handle: str
    platform: str
    country: str
    followers: str
    engagement: str
    bio: str
    niche: str
    priority_tier: str
    relevance_score: int
    source: str
    source_url: str
    profile_url: str
    outreach_note: str


def fetch(url: str) -> str:
    response = requests.get(url, headers=HEADERS, timeout=25)
    response.raise_for_status()
    time.sleep(0.4)
    return response.text


def clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def normalize_handle(handle: str) -> str:
    return handle.strip().lstrip("@").strip()


def social_url(platform: str, handle: str, fallback: str) -> str:
    handle = normalize_handle(handle)
    if not handle:
        return fallback
    if "TikTok" in platform:
        return f"https://www.tiktok.com/@{handle}"
    if "Instagram" in platform:
        return f"https://www.instagram.com/{handle}/"
    return fallback


def is_probable_brand(name: str, handle: str, bio: str) -> bool:
    text = f"{name} {handle} {bio}".lower()
    has_brand = any(term in text for term in BRAND_TERMS)
    has_person = any(term in text for term in PERSON_TERMS)
    return has_brand and not has_person


def relevance(name: str, handle: str, bio: str, source_topic: str) -> tuple[int, str, str, str]:
    text = f"{name} {handle} {bio} {source_topic}".lower()
    matched = [term for term in SKIN_TERMS if term in text]
    score = 10

    if source_topic in {"skincare", "dermatology"}:
        score += 25
    elif source_topic in {"beauty", "wellness", "haircare"}:
        score += 12

    score += min(len(matched) * 6, 36)

    if any(term in text for term in ["fungal", "malassezia", "seborrheic", "dandruff"]):
        score += 24
    if any(term in text for term in ["acne", "esthetician", "aesthetician", "dermatologist", "derm"]):
        score += 14
    if any(term in text for term in ["skin of color", "melanin", "hyperpigmentation"]):
        score += 12
    if any(term in text for term in UNRELATED_TERMS):
        score -= 12
    if is_probable_brand(name, handle, bio):
        score -= 35

    if score >= 65:
        tier = "A"
    elif score >= 42:
        tier = "B"
    else:
        tier = "C"

    niche = "; ".join(dict.fromkeys(matched[:6])) or source_topic
    note = {
        "A": "Strong condition/skincare fit. Prioritize personalized outreach.",
        "B": "Relevant beauty, skin, or wellness audience. Use concise partner pitch.",
        "C": "Broad beauty backup prospect. Verify fit manually before outreach.",
    }[tier]
    return max(score, 0), tier, niche, note


def parse_creatorreach(url: str, source_topic: str) -> Iterable[dict[str, str]]:
    soup = BeautifulSoup(fetch(url), "html.parser")
    for article in soup.find_all("article"):
        h3 = article.find("h3")
        if not h3:
            continue
        text = clean(article.get_text(" ", strip=True))
        name = clean(h3.get_text(" ", strip=True))
        handle_match = re.search(r"@\s*([A-Za-z0-9._]{2,40})", text)
        handle = normalize_handle(handle_match.group(1)) if handle_match else ""

        platform_match = re.search(r"\b(Instagram|TikTok|Facebook)\b", text)
        platform = platform_match.group(1) if platform_match else ""
        country_match = re.search(
            r"\b(United States|Canada|United Kingdom|Australia|South Africa|Nigeria|Brazil|Indonesia|India|Russia|Turkey|Italy|Malaysia|Spain|Germany|South Korea|France|Mexico|Colombia|UAE|Morocco)\b",
            text,
        )
        country = country_match.group(1) if country_match else ""
        followers_match = re.search(r"\b(1M\+|500K-1M|100K-500K|50K-100K|10K-50K)\b", text)
        followers = followers_match.group(1) if followers_match else ""

        bio = text
        if handle_match:
            bio = text[handle_match.end():]
        if platform_match:
            bio = bio[: bio.find(platform_match.group(1))]
        bio = clean(bio)

        profile_link = article.find("a", href=True)
        profile_url = urljoin("https://creatorreach.io", profile_link["href"]) if profile_link else url

        yield {
            "name": name,
            "handle": handle,
            "platform": platform,
            "country": country,
            "followers": followers,
            "engagement": "",
            "bio": bio,
            "source": "CreatorReach",
            "source_url": url,
            "profile_url": social_url(platform, handle, profile_url),
            "source_topic": source_topic,
        }


def parse_socialhipper(url: str, source_topic: str) -> Iterable[dict[str, str]]:
    soup = BeautifulSoup(fetch(url), "html.parser")
    for card in soup.select("a.profile-card-hover"):
        text = clean(card.get_text(" ", strip=True))
        h3 = card.find("h3")
        handle_match = re.search(r"@([A-Za-z0-9._]{2,40})", text)
        if not h3 or not handle_match:
            continue
        name = clean(h3.get_text(" ", strip=True))
        handle = normalize_handle(handle_match.group(1))
        platform_match = re.search(r"\b(Instagram|YouTube|Pinterest)\b", text)
        platform = platform_match.group(1) if platform_match else "Instagram"
        followers_match = re.search(r"([0-9.]+[KM]?) Followers", text)
        engagement_match = re.search(r"([0-9.]+%) Engage", text)
        country_match = re.search(r"Country ([A-Za-z ]+)$", text)
        topic_match = re.search(r"Quality ([A-Za-z &]+?) Avg Likes", text)
        profile_url = urljoin("https://www.socialhipper.com", card.get("href", ""))

        yield {
            "name": name,
            "handle": handle,
            "platform": platform,
            "country": clean(country_match.group(1)) if country_match else "",
            "followers": followers_match.group(1) if followers_match else "",
            "engagement": engagement_match.group(1) if engagement_match else "",
            "bio": clean(topic_match.group(1)) if topic_match else source_topic,
            "source": "SocialHipper",
            "source_url": url,
            "profile_url": social_url(platform, handle, profile_url),
            "source_topic": source_topic,
        }


def parse_hafi(url: str, source_topic: str) -> Iterable[dict[str, str]]:
    soup = BeautifulSoup(fetch(url), "html.parser")
    for row in soup.find_all("tr"):
        cells = [clean(td.get_text(" ", strip=True).replace("\u200c", "")) for td in row.find_all("td")]
        if len(cells) < 6 or "@" not in cells[1]:
            continue
        match = re.match(r"@([A-Za-z0-9._]{2,40})\s+(.+)", cells[1])
        if not match:
            continue
        handle, name = normalize_handle(match.group(1)), clean(match.group(2))
        yield {
            "name": name,
            "handle": handle,
            "platform": "Instagram",
            "country": "",
            "followers": cells[2],
            "engagement": cells[4],
            "bio": source_topic,
            "source": "Hafi",
            "source_url": url,
            "profile_url": f"https://www.instagram.com/{handle}/",
            "source_topic": source_topic,
        }


def build_sources() -> list[tuple[str, str, str]]:
    sources: list[tuple[str, str, str]] = []

    for topic in CREATORREACH_TOPICS:
        for country in COUNTRIES:
            sources.append(
                (
                    "creatorreach",
                    f"https://creatorreach.io/find/{topic}-creators-{country}",
                    topic,
                )
            )

    for slug in CREATORREACH_PLATFORM_SLUGS:
        topic = "skincare" if "skincare" in slug else "beauty"
        if "wellness" in slug:
            topic = "wellness"
        if "makeup" in slug:
            topic = "makeup"
        sources.append(("creatorreach", f"https://creatorreach.io/find/{slug}", topic))

    for platform in SOCIALHIPPER_PLATFORMS:
        for category in SOCIALHIPPER_CATEGORIES:
            sources.append(
                ("socialhipper", f"https://www.socialhipper.com/top/{platform}/{category}", category)
            )
            if platform == "instagram":
                for country in SOCIALHIPPER_COUNTRIES:
                    sources.append(
                        (
                            "socialhipper",
                            f"https://www.socialhipper.com/top/{platform}/{category}/in/{country}",
                            category,
                        )
                    )

    for topic, url in HAFI_URLS:
        sources.append(("hafi", url, topic))

    return sources


def collect() -> list[Prospect]:
    raw: list[dict[str, str]] = []
    for parser_name, url, topic in build_sources():
        try:
            if parser_name == "creatorreach":
                raw.extend(parse_creatorreach(url, topic))
            elif parser_name == "socialhipper":
                raw.extend(parse_socialhipper(url, topic))
            elif parser_name == "hafi":
                raw.extend(parse_hafi(url, topic))
        except Exception as exc:
            print(f"[warn] failed {url}: {exc}")

    for item in MANUAL_PROSPECTS:
        raw.append(
            {
                **item,
                "engagement": "",
                "profile_url": social_url(item["platform"], item["handle"], item["source_url"]),
                "source_topic": "skincare",
            }
        )

    deduped: dict[str, dict[str, str]] = {}
    for item in raw:
        handle = normalize_handle(item.get("handle", ""))
        key = handle.lower() if handle else item["source_url"].lower()
        if not key:
            continue
        current = deduped.get(key)
        if current is None:
            deduped[key] = item
            continue
        current_score, *_ = relevance(
            current["name"], current.get("handle", ""), current.get("bio", ""), current.get("source_topic", "")
        )
        new_score, *_ = relevance(
            item["name"], item.get("handle", ""), item.get("bio", ""), item.get("source_topic", "")
        )
        if new_score > current_score:
            deduped[key] = item

    prospects: list[Prospect] = []
    for item in deduped.values():
        name = item.get("name", "")
        handle = normalize_handle(item.get("handle", ""))
        bio = item.get("bio", "")
        topic = item.get("source_topic", "")
        if not name or is_probable_brand(name, handle, bio):
            continue
        score, tier, niche, note = relevance(name, handle, bio, topic)
        if item.get("country") in {"United States", "Canada", "United Kingdom", "Australia"}:
            score += 6
        if score < 24:
            continue
        prospects.append(
            Prospect(
                name=name,
                handle=handle,
                platform=item.get("platform", ""),
                country=item.get("country", ""),
                followers=item.get("followers", ""),
                engagement=item.get("engagement", ""),
                bio=bio,
                niche=niche,
                priority_tier=tier,
                relevance_score=score,
                source=item.get("source", ""),
                source_url=item.get("source_url", ""),
                profile_url=item.get("profile_url", ""),
                outreach_note=note,
            )
        )

    prospects.sort(key=lambda p: (p.priority_tier, -p.relevance_score, p.name.lower()))
    return prospects


def main() -> None:
    prospects = collect()
    selected = prospects[:400]
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT.open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=list(asdict(selected[0]).keys()))
        writer.writeheader()
        for row in selected:
            writer.writerow(asdict(row))

    tiers = {tier: sum(1 for p in selected if p.priority_tier == tier) for tier in ["A", "B", "C"]}
    print(f"Wrote {len(selected)} prospects to {OUTPUT}")
    print(f"Tier counts: {tiers}")
    print(f"Collected before final cut: {len(prospects)}")


if __name__ == "__main__":
    main()
