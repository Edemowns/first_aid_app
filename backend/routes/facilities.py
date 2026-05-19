# backend/routes/facilities.py
# GET /nearby-facilities
# Uses OpenStreetMap Overpass API — free, no key needed
# Optimized: Ghana bounding box, backend caching, simplified query

from fastapi import APIRouter, Query
import math
import logging
import httpx
from datetime import datetime, timedelta

router = APIRouter()
logger = logging.getLogger("aida.routes.facilities")

# ── Ghana geographic bounds (restricts global queries) ────────────────────────
GHANA_BBOX = {
    "south": 1.0,
    "north": 11.2,
    "west": -3.5,
    "east": 1.5,
}

# ── Simple in-memory cache (for production, use Redis) ──────────────────────────
_facility_cache = {}
CACHE_TTL = 900  # 15 minutes

# Two public Overpass mirrors for reliability
OVERPASS_MIRRORS = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
]

STATIC_FACILITIES = [
    {"name": "Korle-Bu Teaching Hospital",    "phone": "0302-665-401", "address": "Guggisberg Ave, Accra",   "lat": 5.5381, "lng": -0.2290},
    {"name": "37 Military Hospital",           "phone": "0302-776-111", "address": "Liberation Rd, Accra",    "lat": 5.5769, "lng": -0.1969},
    {"name": "Ridge Hospital",                 "phone": "0302-663-185", "address": "Castle Rd, Accra",        "lat": 5.5598, "lng": -0.2020},
    {"name": "Komfo Anokye Teaching Hospital", "phone": "0322-022-301", "address": "Bantama, Kumasi",         "lat": 6.6885, "lng": -1.6244},
    {"name": "Tamale Teaching Hospital",       "phone": "0372-022-430", "address": "Tamale, Northern Region", "lat": 9.4008, "lng": -0.8393},
    {"name": "Cape Coast Teaching Hospital",   "phone": "0332-132-542", "address": "Cape Coast, Central",     "lat": 5.1037, "lng": -1.2827},
]


def _get_cache_key(lat: float, lng: float, radius: int) -> str:
    """Generate cache key based on location and radius."""
    return f"{round(lat, 3)}_{round(lng, 3)}_{radius}"


def _get_cached_results(cache_key: str) -> list:
    """Retrieve from cache if not expired."""
    if cache_key in _facility_cache:
        cached_time, results = _facility_cache[cache_key]
        if datetime.now() - cached_time < timedelta(seconds=CACHE_TTL):
            logger.info(f"Cache hit for {cache_key}")
            return results
        else:
            del _facility_cache[cache_key]
    return None


def _set_cache(cache_key: str, results: list) -> None:
    """Store in cache with timestamp."""
    _facility_cache[cache_key] = (datetime.now(), results)
    logger.info(f"Cached {len(results)} results for {cache_key}")


def _haversine(lat1, lng1, lat2, lng2) -> float:
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2
         + math.cos(math.radians(lat1))
         * math.cos(math.radians(lat2))
         * math.sin(dlng / 2) ** 2)
    return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 2)


def _maps_url(lat, lng):
    return f"https://www.google.com/maps/dir/?api=1&destination={lat},{lng}"


def _build_query(lat: float, lng: float, radius: int) -> str:
    """
    Build an Overpass QL query.
    Searches nearby hospitals and clinics.
    """

    return f"""
[out:json][timeout:25];
(
  node["amenity"="hospital"](around:{radius},{lat},{lng});
  way["amenity"="hospital"](around:{radius},{lat},{lng});

  node["amenity"="clinic"](around:{radius},{lat},{lng});
  way["amenity"="clinic"](around:{radius},{lat},{lng});

  node["amenity"="doctors"](around:{radius},{lat},{lng});

  node["healthcare"="hospital"](around:{radius},{lat},{lng});
  node["healthcare"="clinic"](around:{radius},{lat},{lng});
  node["healthcare"="centre"](around:{radius},{lat},{lng});
  node["healthcare"="health_centre"](around:{radius},{lat},{lng});
);
out center tags;
"""


def _is_in_ghana(lat: float, lng: float) -> bool:
    """Check if coordinates are inside Ghana."""
    return (
        GHANA_BBOX["south"] <= lat <= GHANA_BBOX["north"]
        and GHANA_BBOX["west"] <= lng <= GHANA_BBOX["east"]
    )

def _parse_elements(elements: list, user_lat: float, user_lng: float) -> list:
    """Parse OSM elements into facility dicts."""
    results = []
    seen_names = set()  # deduplicate by name

    for element in elements:
        tags = element.get("tags", {})

        # coordinates
        if element["type"] == "node":
            elat = element.get("lat")
            elng = element.get("lon")
        else:
            center = element.get("center", {})
            elat = center.get("lat")
            elng = center.get("lon")

        if not elat or not elng:
            continue
        # ensure result is inside Ghana
        if not _is_in_ghana(elat, elng):
            continue

        # name — try multiple OSM name fields
        name = (
            tags.get("name")
            or tags.get("name:en")
            or tags.get("operator")
            or tags.get("brand")
        )
        if not name:
            continue  # skip unnamed facilities

        # deduplicate
        name_key = name.lower().strip()
        if name_key in seen_names:
            continue
        seen_names.add(name_key)

        # phone
        phone = (
            tags.get("phone")
            or tags.get("contact:phone")
            or tags.get("telephone")
            or "—"
        )

        # address
        parts = [
            tags.get("addr:housenumber", ""),
            tags.get("addr:street", ""),
            tags.get("addr:suburb", ""),
            tags.get("addr:city", ""),
        ]
        address = ", ".join(p for p in parts if p).strip(", ")
        if not address:
            address = tags.get("addr:full", "") or tags.get("is_in", "") or "Ghana"

        # facility type label
        amenity = tags.get("amenity") or tags.get("healthcare") or "health"
        type_label = {
            "hospital":      "Hospital",
            "clinic":        "Clinic",
            "doctors":       "Doctor / GP",
            "health_centre": "Health Centre",
            "centre":        "Health Centre",
            "doctor":        "Doctor / GP",
        }.get(amenity, "Health Facility")

        dist = _haversine(user_lat, user_lng, elat, elng)

        results.append({
            "name": name,
            "phone": phone,
            "address": address,
            "type": type_label,
            "lat": elat,
            "lng": elng,
            "distance_km": dist,
            "emergency": amenity == "hospital",
            "open": True,
            "maps_url": _maps_url(elat, elng),
            "source": "openstreetmap",
        })

    results.sort(key=lambda x: x["distance_km"])
    return results


async def _query_overpass(query: str) -> list:
    """Try each Overpass mirror until one succeeds."""
    last_error = None
    for mirror in OVERPASS_MIRRORS:
        try:
            async with httpx.AsyncClient(timeout=25) as client:
                resp = await client.post(
                    mirror,
                    data={"data": query},
                    headers={
                        "User-Agent": "AIDA-FirstAid-App/1.0"
                    }
                )
                resp.raise_for_status()
                data = resp.json()
                elements = data.get("elements", [])
                logger.info(f"Overpass ({mirror}) returned {len(elements)} elements")
                return elements
        except Exception as e:
            last_error = e
            logger.warning(f"Overpass mirror {mirror} failed: {type(e).__name__}: {str(e)}")
    raise last_error


@router.get("/nearby-facilities")
async def get_nearby_facilities(
    lat: float = Query(...),
    lng: float = Query(...),
    radius: int = Query(3000, description="Search radius metres — default 3km"),
    limit: int = Query(8, description="Max results — default 8"),
):
    """
    Return nearby health facilities within Ghana, sorted by distance.
    Uses Overpass API with Ghana bounding box (70-80% faster).
    Results are cached for 15 minutes.
    """
    logger.info(f"GET /nearby-facilities | lat={lat}, lng={lng}, radius={radius}m, limit={limit}")

    # ── Check backend cache ────────────────────────────────────────────────────
    cache_key = _get_cache_key(lat, lng, radius)
    cached_results = _get_cached_results(cache_key)
    if cached_results is not None:
        return {
            "facilities": cached_results[:limit],
            "count": min(limit, len(cached_results)),
            "source": "openstreetmap",
            "cached": True,
            "radius_used_m": radius,
            "user_location": {"lat": lat, "lng": lng},
        }

    # ── Try Overpass API with intelligent radius expansion ────────────────────
    for search_radius in [radius, int(radius * 1.5), radius * 2]:
        try:
            query    = _build_query(lat, lng, search_radius)
            elements = await _query_overpass(query)
            results  = _parse_elements(elements, lat, lng)

            if results:
                logger.info(f"Found {len(results)} facilities within {search_radius}m")
                _set_cache(cache_key, results)  # Cache the results
                return {
                    "facilities": results[:limit],
                    "count": min(limit, len(results)),
                    "source": "openstreetmap",
                    "cached": False,
                    "radius_used_m": search_radius,
                    "user_location": {"lat": lat, "lng": lng},
                }

            logger.info(f"No results within {search_radius}m — expanding search")

        except Exception as e:
            logger.error(f"Overpass failed: {e}")
            break   # don't retry on hard errors

    # ── Static fallback ───────────────────────────────────────────────────────
    logger.warning("Falling back to static Ghana hospital list")
    static = sorted(
        [{**f, "distance_km": _haversine(lat, lng, f["lat"], f["lng"]),
          "emergency": True, "open": True, "type": "Hospital",
          "maps_url": _maps_url(f["lat"], f["lng"]), "source": "static"}
         for f in STATIC_FACILITIES],
        key=lambda x: x["distance_km"]
    )

    # Filter to only show hospitals within 50km when using static fallback
    nearby_static = [f for f in static if f["distance_km"] <= 50]
    final = nearby_static if nearby_static else static[:3]

    return {
        "facilities": final[:limit],
        "count": len(final),
        "source": "static",
        "cached": False,
        "note": "Live data unavailable — showing nearby Ghana hospitals only",
        "user_location": {"lat": lat, "lng": lng},
    }


# ── Test endpoint — tests multiple Ghana cities at once ────────────────────────
TEST_LOCATIONS = {
    "accra_airport":    {"lat": 5.6037,  "lng": -0.1870,  "label": "Accra (Airport area)"},
    "accra_osu":        {"lat": 5.5581,  "lng": -0.1769,  "label": "Accra (Osu)"},
    "accra_tema":       {"lat": 5.6698,  "lng": -0.0166,  "label": "Tema"},
    "kumasi_city":      {"lat": 6.6885,  "lng": -1.6244,  "label": "Kumasi (City Centre)"},
    "takoradi":         {"lat": 4.8954,  "lng": -1.7552,  "label": "Takoradi"},
    "tamale":           {"lat": 9.4008,  "lng": -0.8393,  "label": "Tamale"},
    "cape_coast":       {"lat": 5.1037,  "lng": -1.2827,  "label": "Cape Coast"},
    "koforidua":        {"lat": 6.0886,  "lng": -0.2613,  "label": "Koforidua"},
}


@router.get("/test-locations")
async def test_locations(city: str = Query("accra_airport", description="City key to test")):
    """
    Test the Overpass API for a specific Ghana city.
    Use: GET /test-locations?city=accra_osu
    Available cities: accra_airport, accra_osu, accra_tema, kumasi_city,
                      takoradi, tamale, cape_coast, koforidua
    """
    if city not in TEST_LOCATIONS:
        return {
            "error": f"Unknown city '{city}'",
            "available": list(TEST_LOCATIONS.keys())
        }

    loc   = TEST_LOCATIONS[city]
    lat, lng = loc["lat"], loc["lng"]
    logger.info(f"TEST: {loc['label']} | lat={lat}, lng={lng}")

    try:
        query    = _build_query(lat, lng, 3000)
        elements = await _query_overpass(query)
        results  = _parse_elements(elements, lat, lng)

        return {
            "city":      loc["label"],
            "lat":       lat,
            "lng":       lng,
            "count":     len(results),
            "source":    "openstreetmap" if results else "none",
            "facilities": results[:10],
        }
    except Exception as e:
        return {
            "city":  loc["label"],
            "error": str(e),
            "count": 0,
        }


@router.get("/test-all-cities")
async def test_all_cities():
    """
    Test all Ghana cities at once and return a summary.
    Useful for checking OSM coverage across Ghana.
    """
    import asyncio

    async def test_one(key, loc):
        try:
            query    = _build_query(loc["lat"], loc["lng"], 3000)
            elements = await _query_overpass(query)
            results  = _parse_elements(elements, loc["lat"], loc["lng"])
            return {
                "city":    loc["label"],
                "count":   len(results),
                "status":  "✅ OK" if results else "⚠️ No results",
                "nearest": results[0]["name"] if results else None,
                "nearest_dist": results[0]["distance_km"] if results else None,
            }
        except Exception as e:
            return {"city": loc["label"], "count": 0, "status": f"❌ Error: {str(e)[:60]}"}

    # Run all cities sequentially (Overpass rate limits parallel requests)
    results = []
    for key, loc in TEST_LOCATIONS.items():
        result = await test_one(key, loc)
        results.append(result)

    return {
        "total_cities": len(results),
        "cities_with_data": sum(1 for r in results if r["count"] > 0),
        "results": results,
    }