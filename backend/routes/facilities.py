# backend/routes/facilities.py
# GET /nearby-facilities — returns nearby hospitals and emergency services

from fastapi import APIRouter, Query
import logging
import math

router = APIRouter()
logger = logging.getLogger("aida.routes.facilities")


# Static Ghana hospital data (Phase 4 will replace with Google Maps API)
GHANA_FACILITIES = [
    {"name": "Korle-Bu Teaching Hospital",  "nameTwi": "Korle-Bu Yadeɛhaw",  "phone": "0302-665-401", "type": "hospital", "lat": 5.5381, "lng": -0.2290, "emergency": True,  "city": "Accra"},
    {"name": "37 Military Hospital",         "nameTwi": "37 Asrafohaw",        "phone": "0302-776-111", "type": "hospital", "lat": 5.5769, "lng": -0.1969, "emergency": True,  "city": "Accra"},
    {"name": "Ridge Hospital",               "nameTwi": "Ridge Yadeɛhaw",      "phone": "0302-663-185", "type": "hospital", "lat": 5.5598, "lng": -0.2020, "emergency": True,  "city": "Accra"},
    {"name": "Komfo Anokye Teaching Hospital","nameTwi": "Komfo Anokye Yadeɛhaw","phone": "0322-022-301","type": "hospital", "lat": 6.6885, "lng": -1.6244, "emergency": True,  "city": "Kumasi"},
    {"name": "Manhyia Government Hospital",  "nameTwi": "Manhyia Yadeɛhaw",    "phone": "0322-024-278", "type": "hospital", "lat": 6.7044, "lng": -1.6016, "emergency": True,  "city": "Kumasi"},
    {"name": "Tamale Teaching Hospital",     "nameTwi": "Tamale Yadeɛhaw",     "phone": "0372-022-430", "type": "hospital", "lat": 9.4008, "lng": -0.8393, "emergency": True,  "city": "Tamale"},
    {"name": "Cape Coast Teaching Hospital", "nameTwi": "Cape Coast Yadeɛhaw", "phone": "0332-132-542", "type": "hospital", "lat": 5.1037, "lng": -1.2827, "emergency": True,  "city": "Cape Coast"},
]


def _distance_km(lat1, lng1, lat2, lng2) -> float:
    """Haversine formula — great-circle distance in km."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


@router.get("/nearby-facilities")
async def get_nearby_facilities(
    lat: float = Query(..., description="User's latitude"),
    lng: float = Query(..., description="User's longitude"),
    limit: int = Query(5, description="Max number of results"),
):
    """
    Return nearby medical facilities sorted by distance from user's GPS location.
    Phase 4: Replace GHANA_FACILITIES with a live Google Maps Places API call.
    """
    logger.info(f"GET /nearby-facilities | lat={lat}, lng={lng}")

    # Calculate distance for each facility and sort
    results = []
    for f in GHANA_FACILITIES:
        dist = _distance_km(lat, lng, f["lat"], f["lng"])
        results.append({**f, "distance_km": round(dist, 1)})

    results.sort(key=lambda x: x["distance_km"])

    return {
        "facilities": results[:limit],
        "count": min(limit, len(results)),
        "user_location": {"lat": lat, "lng": lng},
    }
