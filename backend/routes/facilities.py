# backend/routes/facilities.py
# GET /nearby-facilities
# Uses OpenStreetMap Overpass API — free, no key needed
# Fixed: broader OSM tags to catch all Ghana hospitals/clinics/health centres

from fastapi import APIRouter, Query
import math
import logging
import httpx

router = APIRouter()
logger = logging.getLogger("aida.routes.facilities")

# Two public Overpass mirrors for reliability
OVERPASS_MIRRORS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

STATIC_FACILITIES = [
    {"name": "Korle-Bu Teaching Hospital",    "phone": "0302-665-401", "address": "Guggisberg Ave, Accra",   "lat": 5.5381, "lng": -0.2290},
    {"name": "37 Military Hospital",           "phone": "0302-776-111", "address": "Liberation Rd, Accra",    "lat": 5.5769, "lng": -0.1969},
    {"name": "Ridge Hospital",                 "phone": "0302-663-185", "address": "Castle Rd, Accra",        "lat": 5.5598, "lng": -0.2020},
    {"name": "Komfo Anokye Teaching Hospital", "phone": "0322-022-301", "address": "Bantama, Kumasi",         "lat": 6.6885, "lng": -1.6244},
    {"name": "Tamale Teaching Hospital",       "phone": "0372-022-430", "address": "Tamale, Northern Region", "lat": 9.4008, "lng": -0.8393},
    {"name": "Cape Coast Teaching Hospital",   "phone": "0332-132-542", "address": "Cape Coast, Central",     "lat": 5.1037, "lng": -1.2827},
]


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
    Build an Overpass QL query that captures ALL health facilities in OSM —
    hospitals, clinics, health centres, pharmacies, doctors.
    This is much broader than just 'hospital' and will find small local clinics.
    """
    return f"""
[out:json][timeout:30];
(
  node["amenity"="hospital"](around:{radius},{lat},{lng});
  way["amenity"="hospital"](around:{radius},{lat},{lng});
  node["amenity"="clinic"](around:{radius},{lat},{lng});
  way["amenity"="clinic"](around:{radius},{lat},{lng});
  node["amenity"="doctors"](around:{radius},{lat},{lng});
  node["healthcare"="hospital"](around:{radius},{lat},{lng});
  node["healthcare"="clinic"](around:{radius},{lat},{lng});
  node["healthcare"="centre"](around:{radius},{lat},{lng});
  way["healthcare"="centre"](around:{radius},{lat},{lng});
  node["healthcare"="health_centre"](around:{radius},{lat},{lng});
  node["healthcare"="doctor"](around:{radius},{lat},{lng});
);
out center tags;
"""


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
                resp = await client.post(mirror, data={"data": query})
                resp.raise_for_status()
                data = resp.json()
                elements = data.get("elements", [])
                logger.info(f"Overpass ({mirror}) returned {len(elements)} elements")
                return elements
        except Exception as e:
            last_error = e
            logger.warning(f"Overpass mirror {mirror} failed: {e}")
    raise last_error


@router.get("/nearby-facilities")
async def get_nearby_facilities(
    lat: float = Query(...),
    lng: float = Query(...),
    radius: int = Query(3000, description="Search radius metres — default 3km"),
    limit: int = Query(10, description="Max results"),
):
    """
    Return ALL nearby health facilities (hospitals, clinics, health centres,
    doctors) sorted by distance from the user's GPS location.
    Source: OpenStreetMap Overpass API — free, no key needed.
    """
    logger.info(f"GET /nearby-facilities | lat={lat}, lng={lng}, radius={radius}m")

    # ── Try Overpass API ──────────────────────────────────────────────────────
    for search_radius in [radius, radius * 2, radius * 4]:
        try:
            query    = _build_query(lat, lng, search_radius)
            elements = await _query_overpass(query)
            results  = _parse_elements(elements, lat, lng)

            if results:
                logger.info(f"Found {len(results)} facilities within {search_radius}m")
                return {
                    "facilities": results[:limit],
                    "count": min(limit, len(results)),
                    "source": "openstreetmap",
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