// services/location.js
// GPS and location utilities

import * as Location from 'expo-location';

/**
 * Request location permission and get current coordinates.
 * @returns {{ latitude, longitude }} or null if denied
 */
export async function getCurrentLocation() {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    return null;
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

/**
 * Get a human-readable address from coordinates (reverse geocoding).
 */
export async function getAddressFromCoords(latitude, longitude) {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (results.length > 0) {
      const r = results[0];
      return `${r.street || ''} ${r.district || ''}, ${r.city || ''}, ${r.region || 'Ghana'}`.trim();
    }
  } catch {
    return 'Location unavailable';
  }
}

/**
 * Calculate distance between two coordinates in kilometers.
 */
export function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}